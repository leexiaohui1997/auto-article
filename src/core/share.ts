import { LinkType } from '@prisma/client'

import { getDB } from '../utils/db.js'
import { AppError } from '../utils/error.js'
import { success } from '../utils/logger.js'

export function getLinkType(url: string): LinkType | undefined {
  if (url.startsWith('https://pan.baidu.com/s/')) {
    return LinkType.BAIDU
  }
  if (url.startsWith('https://pan.quark.cn/s/')) {
    return LinkType.QUARK
  }
}

export async function addShareLink(link: string) {
  const type = getLinkType(link)
  if (!type) {
    throw new AppError('只接受夸克网盘或百度网盘链接')
  }

  const cleanUrl = link.split('#')[0]?.split('?')[0] || ''
  if (!/\/s\/\w+$/.test(cleanUrl)) {
    throw new AppError('链接格式不正确')
  }

  const db = await getDB()
  const existCount = await db.shareLink.count({
    where: {
      url: {
        equals: cleanUrl,
      },
    },
  })

  if (existCount > 0) {
    throw new AppError('已存在相同的分享链接')
  }

  const row = await db.shareLink.create({
    data: {
      url: cleanUrl,
      type,
    },
  })

  success(`已添加，链接ID: ${row.id}`)
  return row
}
