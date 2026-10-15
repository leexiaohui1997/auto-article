import { readFileSync } from 'node:fs'
import path from 'node:path'

import { pkgRoot } from './env.js'

export function getPackageJson() {
  try {
    const content = readFileSync(path.resolve(pkgRoot, 'package.json'), 'utf-8')
    return JSON.parse(content)
  } catch {
    return {}
  }
}

export function getErrorMsg(err: unknown) {
  if (err instanceof Error) {
    return err.message
  }
  return `${err}`
}
