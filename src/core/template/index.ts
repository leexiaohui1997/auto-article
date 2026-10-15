import { existsSync } from 'node:fs'
import path from 'node:path'

import ejs from 'ejs'

import { pkgRoot } from '../../utils/env.js'

export const TEMPLATE_DIR = path.resolve(pkgRoot, process.env.TEMPLATE_DIR || 'templates')
export const TEMPLATE_EXT = (process.env.TEMPLATE_EXT || 'md')
  .split(',')
  .filter(Boolean)
  .map((s) => s.toLocaleLowerCase())

export function resolveFileName(name: string) {
  for (const ext of TEMPLATE_EXT) {
    const filePath = path.resolve(TEMPLATE_DIR, `${name}.${ext}`)
    if (existsSync(filePath)) {
      return filePath
    }
  }
  throw new Error(`模板 ${name} 不存在`)
}

export async function renderTemplate(name: string) {
  const filename = resolveFileName(name)
  const options: ejs.Options = {
    filename,
    cache: true,
    root: TEMPLATE_DIR,
    rmWhitespace: false,
    _with: false,
    destructuredLocals: [],
    async: true,
  }
  return await ejs.renderFile(filename, {}, options)
}
