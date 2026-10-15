import path from 'node:path'

import { PrismaLibSql } from '@prisma/adapter-libsql'
import { PrismaClient } from '@prisma/client'

import { pkgRoot } from './env.js'

let prismaClient: PrismaClient

export function getDB() {
  if (!prismaClient) {
    const dbUrl = process.env.DATABASE_URL
    if (!dbUrl) {
      throw new Error('未配置数据库路径：请在仓库根 .env 中设置 DATABASE_URL')
    }

    prismaClient = new PrismaClient({
      adapter: new PrismaLibSql({ url: `file:${path.resolve(pkgRoot, dbUrl)}` }),
    })
  }

  return prismaClient
}
