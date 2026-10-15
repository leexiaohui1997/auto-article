import { LinkType, ShareLinkFile, Status } from '@prisma/client'

import { getDB } from '../utils/db.js'
import { NoLinkError } from '../utils/error.js'
import { func, info } from '../utils/logger.js'

import { scanQuarkFolder, scanQuarkLink } from './context/quark.js'
import { BOOK_COUNT_PER_LOOP, getPendingBook, getPendingFiles } from './db.js'

export async function runMain() {
  let book = await getPendingBook()
  while (!book) {
    await addBooks()
    book = await getPendingBook()
  }
}

export async function addBooks() {
  const collected: ShareLinkFile[] = []
  while (true) {
    const pendingFiles = await getPendingFiles({
      limit: BOOK_COUNT_PER_LOOP - collected.length,
      excludeIds: collected.map((item) => item.id),
    })
    collected.push(...pendingFiles)
    if (collected.length >= BOOK_COUNT_PER_LOOP) {
      break
    }
    await scanFolder()
  }

  // TODO
  console.log(collected)
  process.exit(1)
}

export async function scanFolder() {
  func('扫描文件夹以录入新文件')
  const db = await getDB()
  const pendingFolder = await db.shareLinkFolder.findFirst({
    where: {
      status: {
        equals: Status.PENDING,
      },
    },
    include: { link: true },
  })

  if (!pendingFolder) {
    info('没有待处理的文件夹了')
    await scanLink()
    await scanFolder()
    return
  }

  await scanQuarkFolder(pendingFolder)
}

export async function scanLink() {
  func('扫描分享链接')
  const db = await getDB()

  const processingCount = await db.shareLink.count({
    where: { status: Status.PROCESSING },
  })
  if (processingCount > 0) {
    await db.shareLink.updateMany({
      where: {
        status: Status.PROCESSING,
      },
      data: {
        status: Status.SUCCESS,
      },
    })
    info(`已将 ${processingCount} 条处理中的分享链接的状态更新为处理完毕`)
  }

  const link = await db.shareLink.findFirst({
    where: {
      type: {
        equals: LinkType.QUARK,
      },
      status: {
        equals: Status.PENDING,
      },
    },
    orderBy: {
      createdAt: 'asc',
    },
  })

  if (!link) {
    throw new NoLinkError('分享链接已用完')
  }

  await scanQuarkLink(link)
}
