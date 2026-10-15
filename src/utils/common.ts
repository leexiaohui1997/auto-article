import { readFileSync } from 'node:fs'
import path from 'node:path'

import bytes from 'bytes'

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

export function parseSize(text: string): number {
  const normalized = text.trim().replace(/^([\d.]+)\s*([KMG])$/i, '$1$2B')
  return bytes.parse(normalized) ?? 0
}
