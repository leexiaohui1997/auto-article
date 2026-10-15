import { Status } from '@prisma/client'

import { parseSize } from '../utils/common.js'
import { getDB } from '../utils/db.js'
import { func, info, success } from '../utils/logger.js'

export const BOOK_EXT = (process.env.BOOK_EXT || 'epub').split(',').filter(Boolean)
export const BOOK_MAX_SIZE = parseSize(process.env.BOOK_MAX_SIZE || '50mb')
export const BOOK_COUNT_PER_LOOP = Number(process.env.BOOK_COUNT_PER_LOOP) || 5

// 获取一本待处理的书籍
export async function getPendingBook() {
  func('获取一本待处理的书籍')
  const db = await getDB()
  const book = await db.book.findFirst({
    where: {
      status: {
        equals: Status.PENDING,
      },
    },
    orderBy: [{ score: 'desc' }, { createdAt: 'asc' }],
  })

  if (!book) {
    return null
  }

  success(`获取到了, ID: ${book.id}, 书名: ${book.name}, 评分: ${book.score}`)
  return book
}

export async function getPendingFiles({
  limit = BOOK_COUNT_PER_LOOP,
  exts = BOOK_EXT,
  maxSize = BOOK_MAX_SIZE,
  excludeIds = [],
}: {
  exts?: string[]
  maxSize?: number
  limit?: number
  excludeIds?: string[]
}) {
  func(`获取 ${limit} 个文件, 格式限制: ${exts}, 大小限制: ${maxSize}`)
  const db = await getDB()
  const pendingFiles = await db.shareLinkFile.findMany({
    where: {
      status: {
        equals: Status.PENDING,
      },
      ext: {
        in: exts,
      },
      size: {
        lte: maxSize,
      },
      id: {
        notIn: excludeIds,
      },
    },
    orderBy: {
      createdAt: 'asc',
    },
    take: limit,
  })
  info(
    pendingFiles.length ? `获取到 ${pendingFiles.length} 个符合条件的文件` : '没有符合条件的文件了',
  )
  return pendingFiles
}
