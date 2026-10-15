import { mkdirSync } from 'fs'
import path from 'path'

import { BrowserContext, chromium, Page } from 'playwright'

import { pkgRoot } from './env.js'

export const BROWSER_DATA_DIR = path.resolve(
  pkgRoot,
  process.env.BROWSER_DATA_DIR || '.auto-article/browser-data/chromium',
)

export const BROWSER_VIEWPORT_WIDTH = Number(process.env.BROWSER_VIEWPORT_WIDTH) || 1280
export const BROWSER_VIEWPORT_HEIGHT = Number(process.env.BROWSER_VIEWPORT_HEIGHT) || 800
export const BROWSER_HEADLESS = process.env.BROWSER_HEADLESS === 'true'

let context: BrowserContext | undefined
const pagesCache = new Map<Page, string>()

export async function getContext() {
  if (!context) {
    mkdirSync(BROWSER_DATA_DIR, { recursive: true })
    context = await chromium.launchPersistentContext(BROWSER_DATA_DIR, {
      headless: BROWSER_HEADLESS,
      acceptDownloads: true,
      viewport: { width: BROWSER_VIEWPORT_WIDTH, height: BROWSER_VIEWPORT_HEIGHT },
      args: ['--disable-blink-features=AutomationControlled'],
    })
  }
  return context
}

export async function getPage(id: string) {
  for (const [page, pageId] of pagesCache.entries()) {
    if (id === pageId) {
      return page
    }
  }

  const ctx = await getContext()
  const pages = ctx.pages()
  const page = pages.find((item) => !pagesCache.has(item)) || (await ctx.newPage())
  pagesCache.set(page, id)
  return page
}

export async function releasePage(page: Page) {
  pagesCache.delete(page)
}
