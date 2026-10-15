import { ShareLinkFile } from '@prisma/client'

import { func } from '../../utils/logger.js'

import AiQianWenEngine from './engines/qianwen.js'

export class AiDispatch {
  engine = new AiQianWenEngine()

  async getScore(file: ShareLinkFile) {
    func(`为 ${file.name} 打分`)
    await this.engine.ensureLogin()
    await this.engine.createContext()
    await this.engine.input('### 你好啊')
    await this.engine.send()
    await this.engine.getLastAnswer()
    await new Promise((r) => setTimeout(r, 1500000))
  }
}

export const ai = new AiDispatch()
