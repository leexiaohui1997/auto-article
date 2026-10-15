import path from 'node:path'

import dotenv from 'dotenv'

export const pkgRoot = path.resolve(import.meta.dirname, '../..')
dotenv.config({ path: path.join(pkgRoot, '.env'), quiet: true })
