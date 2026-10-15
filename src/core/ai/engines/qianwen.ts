import { getPage } from '../../../utils/browser.js'
import { summary } from '../../../utils/common.js'
import { success, warn } from '../../../utils/logger.js'
import AiEngineBase from '../base.js'

let isLogined = false
const QIANWEN_URL = 'https://www.qianwen.com/'
const getQianWenPage = () => getPage('qianwen')

export default class AiQianWenEngine extends AiEngineBase {
  async ensureLogin(): Promise<void> {
    if (isLogined) return
    const page = await getQianWenPage()
    await page.goto(QIANWEN_URL, { waitUntil: 'domcontentloaded', timeout: 30000 })
    await Promise.all([
      (async () => {
        await page
          .locator('#new-nav-tab-wrapper button[id="radix-:r53:"]')
          .first()
          .waitFor({ state: 'visible', timeout: 0 })
        isLogined = true
        success('已登录千问')
      })(),
      (async () => {
        const loginButton = page.locator('button:has-text("登录")').first()
        const hasButton = await loginButton
          .waitFor({ state: 'visible', timeout: 3000 })
          .then(() => true)
          .catch(() => false)
        if (!hasButton) return
        await loginButton.click()
        warn('请完成登录')
      })(),
    ])
  }

  async createContext(): Promise<void> {
    const page = await getQianWenPage()
    if (page.url() !== QIANWEN_URL) {
      await page.goto(QIANWEN_URL, { waitUntil: 'domcontentloaded', timeout: 30000 })
      success('打开新会话')
    }

    const trigger = page.locator('button[aria-label="快速"]').first()
    await trigger.waitFor({ state: 'visible', timeout: 3000 })
    await trigger.click()
    const item = page
      .locator('div[role="menuitemcheckbox"] span.text-primary:has-text("思考研究")')
      .first()
    await item.waitFor({ state: 'visible', timeout: 3000 })
    await item.click()
    success('切换到思考研究模式')
  }

  async input(content: string): Promise<void> {
    const page = await getQianWenPage()
    const box = page.locator('[role="textbox"][contenteditable="true"]').first()
    await box.waitFor({ state: 'visible', timeout: 3000 })
    await box.click()

    // 清空输入框
    await page.keyboard.press('Meta+A')
    await page.keyboard.press('Backspace')
    await page.waitForTimeout(300)

    await page.keyboard.insertText(content)
    await page.waitForTimeout(300)
    success(`已输入: ${summary(content)}`)
  }

  async send(): Promise<void> {
    const page = await getQianWenPage()
    await Promise.all([
      (async () => {
        const button = page
          .locator(
            'button[data-session-switch-target="send-query"][aria-label="发送消息"]:not([disabled])',
          )
          .first()
        await button.waitFor({ state: 'visible', timeout: 3000 })
        await button.click()
      })(),
      (async () => {
        await page
          .locator('button[aria-label="停止回答"]')
          .first()
          .waitFor({ state: 'visible', timeout: 3000 })
        success('点击了发送按钮')
        await page
          .locator('button[data-session-switch-target="send-query"][aria-label="发送消息"]')
          .first()
          .waitFor({ state: 'visible', timeout: 3000 })
        success('千问回答完毕')
      })(),
    ])
  }

  async getLastAnswer(): Promise<string> {
    const page = await getQianWenPage()
    const copyBtn = page
      .locator('#message-list-scroller')
      .locator('.message-select-wrapper-answer-rqWekn')
      .last()
      .locator('[data-answer-feedback-toolbar="true"] > .flex > .flex')
      .first()
    await copyBtn.waitFor({ state: 'visible', timeout: 3000 })
    await copyBtn.dispatchEvent('mouseover')
    const copyItem = page.locator('[role="menuitem"]:has-text("复制为Markdown")').first()
    await copyItem.waitFor({ state: 'visible', timeout: 3000 })
    await copyItem.click()
    const text = await page.evaluate(async () => {
      return await navigator.clipboard.readText()
    })
    success(`获取到回答: ${summary(text)}`)
    return text
  }
}
