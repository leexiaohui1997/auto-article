import { ShareLinkFile } from '@prisma/client'

import { getErrorMsg } from '../../utils/common.js'
import { AiResponseError, AppError } from '../../utils/error.js'
import { func, success } from '../../utils/logger.js'
import { renderToAttach } from '../template/index.js'

import AiQianWenEngine from './engines/qianwen.js'
import { checkIsNormalResponse, checkIsSelectionSOPResult, checkIsValidResponse } from './helper.js'
import { AiNormalResponse, AiResponse, SelectionSOPResult } from './types.js'

export type QuestionFunc = (stop: () => void) => Promise<unknown>

export class AiDispatch {
  engine = new AiQianWenEngine()

  async ask<T = any>(
    question: string | string[],
    opts?: {
      attaches?: File[]
      onResult?: (res: AiNormalResponse<T>) => unknown
    },
  ): Promise<AiNormalResponse<T>[]> {
    const questions = (Array.isArray(question) ? [...question] : [question]).filter(Boolean)
    if (!questions.length) throw new AppError('请输入问题')

    await this.engine.ensureLogin()
    await this.engine.createContext()
    await this.engine.inputAttach([await renderToAttach('begin', '本会话交流约定.md')])
    await this.engine.input('如果你已经完全理解了约定，请按规范回复且只回复“OK”')
    await this.engine.send()

    let sendedQuestion = false
    const anwsers: AiNormalResponse<T>[] = []

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
        await this.engine.input(questions.shift()!)
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

        anwsers.push(resJson)
        if (questions.length) {
          await this.engine.input(questions.shift()!)
          await this.engine.send()
          continue
        }
        return anwsers
      }

      await this.engine.input('暂不支持工具调用')
      await this.engine.send()
    }
  }

  async getScore(files: ShareLinkFile[]) {
    func(`为 ${files.length} 本书打分`)
    const anwsers = await this.ask<SelectionSOPResult>(
      files.map((file) => `请遵照《选书评估 SOP.md》为此书做评估报告：${file.name}`),
      {
        attaches: [await renderToAttach('selection-sop', '选书评估 SOP.md')],
        onResult: async (res) => {
          const reasons: string[] = []
          if (!checkIsSelectionSOPResult(res.data, (r) => reasons.push(r))) {
            const c = reasons.map((v, i) => `${i + 1}. ${v}`).join('\r\n')
            throw new AiResponseError(
              `你提供的评估结果不符合以下文档要求的结构规范，请调整后重新提供符合要求的结构：\r\n${c}`,
            )
          }
          success('评估结果已通过数据结构校验')
        },
      },
    )
    return anwsers.map((item) => item.data!)
  }
}

export const ai = new AiDispatch()
