import path from 'node:path'

import { PrismaLibSql } from '@prisma/adapter-libsql'
import { PrismaClient } from '@prisma/client'

import { pkgRoot } from './env.js'
import { info, success } from './logger.js'

let prismaClient: PrismaClient | undefined

export async function getDB() {
  if (!prismaClient) {
    const dbUrl = process.env.DATABASE_URL
    if (!dbUrl) {
      throw new Error('未配置数据库路径：请在仓库根 .env 中设置 DATABASE_URL')
    }

    prismaClient = new PrismaClient({
      adapter: new PrismaLibSql({ url: `file:${path.resolve(pkgRoot, dbUrl)}` }),
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
