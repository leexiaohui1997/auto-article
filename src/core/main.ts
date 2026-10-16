import { LinkType, ShareLinkFile, Status } from '@prisma/client'

import { getDB } from '../utils/db.js'
import { NoLinkError } from '../utils/error.js'
import { error, func, info, success } from '../utils/logger.js'

import { ai } from './ai/dispatch.js'
import { scanQuarkFolder, scanQuarkLink } from './context/quark.js'
import { BOOK_COUNT_PER_LOOP, getPendingBook, getPendingFiles } from './db.js'

export const SOP_SCORE_MIN = 15

export async function runMain() {
  let book = await getPendingBook()
  while (!book) {
    await addBooks()
    book = await getPendingBook()
  }

  console.log({ book })
}

export async function addBooks() {
  const collected: ShareLinkFile[] = []
  try {
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
  } catch (err) {
    if (!(err instanceof NoLinkError)) {
      throw err
    }

    if (!collected.length) {
      throw err
    }
  }

  const results = await ai.getScore(collected)
  const db = await getDB()
  await db.$transaction(async (tx) => {
    for (let i = 0; i < results.length; i++) {
      const res = results[i]
      const file = collected[i]
      let isSuccess = false
      if (res.verdict === 'go' || res.verdict === 'trial') {
        await tx.book.create({
          data: {
            fileId: file.id,
            name: res.bookName,
            score: res.score,
            reason: res.reason,
            sopResult: JSON.stringify(res),
          },
        })
        isSuccess = true
      }

      const status: Status = isSuccess ? Status.SUCCESS : Status.FAILED
      const action = isSuccess ? '可做' : '弃做'
      const method = isSuccess ? success : error

      await tx.shareLinkFile.update({
        where: { id: file.id },
        data: { status },
      })

      method(`《${res.bookName}》评估结果：${res.score} 分，${action}`)
    }
  })
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
