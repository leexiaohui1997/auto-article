import { ShareLinkFile } from '@prisma/client'

import { getErrorMsg } from '../../utils/common.js'
import { AiResponseError, AppError } from '../../utils/error.js'
import { func, success } from '../../utils/logger.js'
import { renderTemplate, renderToAttach } from '../template/index.js'

import AiQianWenEngine from './engines/qianwen.js'
import { checkIsNormalResponse, checkIsSelectionSOPResult, checkIsValidResponse } from './helper.js'
import { AiNormalResponse, AiResponse, SelectionSOPResult } from './types.js'

export class AiDispatch {
  engine = new AiQianWenEngine()

  // eslint-disable-next-line complexity
  async ask<T = any>(
    question: string,
    opts?: {
      attaches?: File[]
      onResult?: (res: AiNormalResponse<T>) => unknown
    },
  ): Promise<AiNormalResponse<T>> {
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
        if (opts?.attaches?.length) {
          await this.engine.inputAttach(opts.attaches)
        }
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
        if (opts?.onResult) {
          try {
            await opts.onResult(resJson)
          } catch (err) {
            if (err instanceof AiResponseError) {
              await this.engine.input(getErrorMsg(err))
              await this.engine.send()
              continue
            }
            throw err
          }
        }
        return resJson
      }

      await this.engine.input('暂不支持工具调用')
      await this.engine.send()
    }
  }

  async getScore(file: ShareLinkFile) {
    func(`为 ${file.name} 打分`)
    const anwser = await this.ask<SelectionSOPResult>(
      `请遵照附件指南为此书做评估报告：${file.name}`,
      {
        attaches: [await renderToAttach('selection-sop', '选书评估 SOP.md')],
        onResult: async (res) => {
          if (!checkIsSelectionSOPResult(res.data)) {
            throw new AiResponseError('你提供的评估结果不符合文档要求的结构规范，请调整后重新回复')
          }
          success('评估结果已通过数据结构校验')
        },
      },
    )
    return anwser.data!
  }
}

export const ai = new AiDispatch()
