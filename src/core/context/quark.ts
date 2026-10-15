import { Prisma, ShareLink, ShareLinkFolder, Status } from '@prisma/client'
import { Page } from 'playwright'

import { getPage } from '../../utils/browser.js'
import { parseSize } from '../../utils/common.js'
import { getDB } from '../../utils/db.js'
import { func, info, success, warn } from '../../utils/logger.js'
import { BOOK_EXT } from '../db.js'

const LADING_PAGE = 'https://pan.quark.cn/'
const HOME_PAGE = 'https://pan.quark.cn/list'

let isLogined = false

export type QuarkItem = {
  id: string
  name: string
  size: string
  ext: string
  isFolder: boolean
}

export async function getQuarkPage() {
  return await getPage('quark')
}

export async function ensureLogin() {
  if (isLogined) return

  func('登录夸克网盘')
  const page = await getQuarkPage()
  await page.goto(LADING_PAGE, { waitUntil: 'domcontentloaded', timeout: 30000 })
  if (!page.url().startsWith(HOME_PAGE)) {
    const button = page
      .locator(
        'div[class^="LoginComponent--modal"] div[class^="LoginComponent--other-mode-item"]:has-text("微信登录")',
      )
      .first()
    await button.waitFor({ state: 'visible', timeout: 5000 })
    await button.click()
    warn('请扫码完成登录')
    await page.waitForURL((url) => url.href.startsWith(HOME_PAGE), { timeout: 0 })
  }
  isLogined = true
  success('已登录夸克网盘')
}

export async function scanQuarkLink(link: ShareLink, folder?: ShareLinkFolder) {
  await ensureLogin()
  const url = folder?.url || link.url
  func(`处理夸克网盘链接, ${url}`)
  const page = await getQuarkPage()
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 })
  const rows = await listDir(page)
  await addRows(rows, page.url(), link, folder)
}

export async function scanQuarkFolder(
  folder: Prisma.ShareLinkFolderGetPayload<{ include: { link: true } }>,
) {
  await ensureLogin()
  await scanQuarkLink(folder.link, folder)
  const page = await getQuarkPage()
  await page.goto(folder.url, { waitUntil: 'domcontentloaded', timeout: 30000 })
}

export async function addRows(
  rows: QuarkItem[],
  url: string,
  link: ShareLink,
  folder?: ShareLinkFolder,
) {
  const files = rows.filter((item) => !item.isFolder && BOOK_EXT.includes(item.ext))
  const folders = rows.filter((item) => item.isFolder)
  const db = await getDB()
  await db.$transaction(async (tx) => {
    if (files.length) {
      await tx.shareLinkFile.createMany({
        data: files.map((item) => ({
          linkId: link.id,
          folderId: folder?.id,
          url,
          name: item.name,
          size: parseSize(item.size),
          ext: item.ext,
        })),
      })
      info(`扫描到 ${files.length} 个文件`)
    }

    if (folders.length) {
      await tx.shareLinkFolder.createMany({
        data: folders.map((item) => ({
          linkId: link.id,
          parentId: folder?.id,
          url: `${link.url}#/list/share/${item.id}`,
          name: item.name,
          count: Number(item.size.replace(/[^\d]/g, '')),
        })),
      })
      info(`扫描到 ${folders.length} 个文件夹`)
    }

    if (link.status !== Status.PROCESSING) {
      await tx.shareLink.update({
        where: { id: link.id },
        data: { status: Status.PROCESSING },
      })
      info(`分享链接状态改为处理中`)
    }

    if (folder && folder.status !== Status.SUCCESS) {
      await tx.shareLinkFolder.update({
        where: { id: folder.id },
        data: { status: Status.SUCCESS },
      })
      info(`文件夹状态改为已处理`)
    }
  })
}

export async function listDir(page: Page) {
  const found = await page
    .locator('tr.ant-table-row')
    .first()
    .waitFor({ timeout: 5000 })
    .then(() => true)
    .catch(() => false)
  if (!found) return []

  const collected = new Map<string, QuarkItem>()

  while (true) {
    await page.waitForTimeout(800)
    const rows = await page.evaluate(() => {
      const trs = document.querySelectorAll('tr.ant-table-row')
      return Array.from(trs).map<QuarkItem>((tr) => {
        const fileId = tr.getAttribute('data-row-key') || ''
        const name = (tr.querySelector('.filename-text') as HTMLElement)?.title || ''
        const tds = tr.querySelectorAll('td')
        const size = tds[2]?.textContent?.trim() || ''
        const isFolder = /项$/.test(size)
        const ext = isFolder ? '' : name.match(/\.([^.]+)$/)?.[1].toLowerCase() || ''
        return {
          id: fileId,
          name,
          size,
          ext,
          isFolder,
        }
      })
    })

    const before = collected.size
    for (const r of rows) {
      if (r.id) collected.set(r.id, r)
    }
    if (collected.size === before) break

    await page.evaluate(() => {
      const c = document.querySelector('.ant-table-body') as HTMLElement
      if (c) c.scrollTop += c.clientHeight * 0.8
    })
  }

  return Array.from(collected.values())
}
