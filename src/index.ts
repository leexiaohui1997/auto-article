import './utils/env.js'
import { getDB } from './utils/db.js'

const db = getDB()
const count = await db.shareLink.count()
console.log({ count })
await db.$disconnect()
