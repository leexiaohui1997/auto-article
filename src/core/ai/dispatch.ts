import { ShareLinkFile } from '@prisma/client'

import { AppError } from '../../utils/error.js'
import { func } from '../../utils/logger.js'
import { renderTemplate } from '../template/index.js'

import AiQianWenEngine from './engines/qianwen.js'
import { checkIsNormalResponse, checkIsValidResponse } from './helper.js'
import { AiResponse } from './types.js'

export class AiDispatch {
  engine = new AiQianWenEngine()

  async ask(question: string) {
    await this.engine.ensureLogin()
    await this.engine.createContext()
    await this.engine.input(await renderTemplate('begin'))
    await this.engine.send()

    let sendedQuestion = false

    while (true) {
      let resJson: AiResponse
      try {
        const res = await this.engine.getLastAnswer()
        const resMatch = res.match(/```json([\s\S]*?)```/)
        if (!resMatch) throw new AppError('回复格式不符合规范')
        resJson = JSON.parse(resMatch[1])
        if (!checkIsValidResponse(resJson)) {
          throw new AppError('回复格式不符合规范')
        }
      } catch {
        await this.engine.input('你的回复不符合格式铁律要求，请按规范重新回复')
        await this.engine.send()
        continue
      }

      if (resJson.type === 'response' && resJson.message === 'OK' && !sendedQuestion) {
        await this.engine.input(question)
        await this.engine.send()
        sendedQuestion = true
        continue
      }

      if (!sendedQuestion) {
        await this.engine.input('首次回复要求必须只回复“OK”')
        await this.engine.send()
        continue
      }

      if (checkIsNormalResponse(resJson)) {
        return resJson.message
      }

      await this.engine.input('暂不支持工具调用')
      await this.engine.send()
    }
  }

  async getScore(file: ShareLinkFile) {
    func(`为 ${file.name} 打分`)
    const anwser = await this.ask('1+1')
    console.log({ anwser })
    process.exit(1)
  }
}

export const ai = new AiDispatch()
