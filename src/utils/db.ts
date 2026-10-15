import path from 'node:path'

import { PrismaLibSql } from '@prisma/adapter-libsql'
import { PrismaClient } from '@prisma/client'

import { pkgRoot } from './env.js'
import { info, success } from './logger.js'

export const DATABASE_URL = `file:${path.resolve(pkgRoot, process.env.DATABASE_URL || '.auto-article/data.db')}`

let prismaClient: PrismaClient | undefined

export async function getDB() {
  if (!prismaClient) {
    prismaClient = new PrismaClient({
      adapter: new PrismaLibSql({ url: DATABASE_URL }),
    })

    await prismaClient.$connect()
    success('数据库已连接')
    process.once('SIGINT', closeDB)
    process.once('SIGTERM', closeDB)
    process.once('beforeExit', closeDB)
  }

  return prismaClient
}

export async function closeDB() {
  if (prismaClient) {
    await prismaClient.$disconnect()
    prismaClient = undefined
    info('数据库已关闭')
  }
}
