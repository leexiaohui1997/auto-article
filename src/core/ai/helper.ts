import {
  AiNormalResponse,
  AiResponse,
  AiUseToolResponse,
  SelectionConclusion,
  SelectionPotential,
  SelectionScoreItem,
  SelectionSOPResult,
  SelectionVerdict,
  SelectionVetoCheck,
} from './types.js'

/** 校验失败原因回调 */
export type CheckReasonReporter = (reason: string) => void

export function checkIsValidResponse(res: any): res is AiResponse {
  return checkIsNormalResponse(res) || checkIsUseToolResponse(res)
}

export function checkIsUseToolResponse(res: any): res is AiUseToolResponse {
  if (!res || typeof res !== 'object') return false
  if (res.type !== 'use-tool') return false
  if (typeof res.name !== 'string') return false
  if (!Array.isArray(res.args) || res.args.some((item: unknown) => typeof item !== 'string'))
    return false
  if (res.message && typeof res.message !== 'string') return false
  return true
}

export function checkIsNormalResponse(res: any): res is AiNormalResponse {
  if (!res || typeof res !== 'object') return false
  if (res.type !== 'response') return false
  if (typeof res.status !== 'string') return false
  if (res.message && typeof res.message !== 'string') return false
  return true
}

export function checkIsSelectionSOPResult(
  res: unknown,
  onReason?: CheckReasonReporter,
): res is SelectionSOPResult {
  const fail = (reason: string): false => {
    onReason?.(reason)
    return false
  }

  if (!res || typeof res !== 'object') return fail('选书结果不是对象')
  const data = res as Record<string, unknown>

  if (typeof data.bookName !== 'string' || !data.bookName) return fail('bookName 缺失或非字符串')
  if (typeof data.score !== 'number' || Number.isNaN(data.score))
    return fail('score 缺失或不是有效数字')
  if (!checkIsSelectionVerdict(data.verdict, onReason)) return fail('verdict 取值非法')
  if (typeof data.reason !== 'string' || !data.reason) return fail('reason 缺失或为空字符串')

  if (!checkIsSelectionConclusion(data.conclusion, onReason)) return fail('conclusion 校验失败')
  if (!Array.isArray(data.vetoChecks) || data.vetoChecks.length !== 10)
    return fail(
      `否决项必须是 10 条，当前 ${Array.isArray(data.vetoChecks) ? data.vetoChecks.length : 0} 条`,
    )
  if (!data.vetoChecks.every((item) => checkIsSelectionVetoCheck(item, onReason)))
    return fail('否决项条目校验失败')

  // 命中否决项（reject）时评分卡与潜力点可整体省略
  if (data.scorecard !== undefined) {
    if (!Array.isArray(data.scorecard) || data.scorecard.length !== 10)
      return fail(
        `评分卡必须是 10 维，当前 ${Array.isArray(data.scorecard) ? data.scorecard.length : 0} 维`,
      )
    if (!data.scorecard.every((item) => checkIsSelectionScoreItem(item, onReason)))
      return fail('评分卡条目校验失败')
  }
  if (data.potential !== undefined && !checkIsSelectionPotential(data.potential, onReason))
    return fail('爆款潜力点校验失败')

  if (!Array.isArray(data.risks)) return fail('risks 不是数组')
  if (data.risks.length < 1) return fail('risks 至少需要 1 条')
  if (!data.risks.every((item) => typeof item === 'string')) return fail('risks 存在非字符串项')

  return true
}

export function checkIsSelectionVerdict(
  res: unknown,
  onReason?: CheckReasonReporter,
): res is SelectionVerdict {
  if (res !== 'go' && res !== 'trial' && res !== 'drop' && res !== 'unknown') {
    onReason?.(`verdict 取值非法：${String(res)}`)
    return false
  }
  return true
}

export function checkIsSelectionConclusion(
  res: unknown,
  onReason?: CheckReasonReporter,
): res is SelectionConclusion {
  if (!res || typeof res !== 'object') {
    onReason?.('conclusion 不是对象')
    return false
  }
  const data = res as Record<string, unknown>
  if (
    data.recommendLevel !== 'strong' &&
    data.recommendLevel !== 'trial' &&
    data.recommendLevel !== 'reject'
  ) {
    onReason?.(`conclusion.recommendLevel 取值非法：${String(data.recommendLevel)}`)
    return false
  }
  if (typeof data.estimatedArticleCount !== 'number' || Number.isNaN(data.estimatedArticleCount)) {
    onReason?.('conclusion.estimatedArticleCount 缺失或不是有效数字')
    return false
  }
  if (typeof data.collectionName !== 'string') {
    onReason?.('conclusion.collectionName 缺失或非字符串')
    return false
  }
  return true
}

export function checkIsSelectionVetoCheck(
  res: unknown,
  onReason?: CheckReasonReporter,
): res is SelectionVetoCheck {
  if (!res || typeof res !== 'object') {
    onReason?.('否决项条目不是对象')
    return false
  }
  const data = res as Record<string, unknown>
  if (typeof data.id !== 'number') {
    onReason?.('否决项 id 缺失或非数字')
    return false
  }
  if (typeof data.name !== 'string') {
    onReason?.(`否决项 ${data.id} 的 name 缺失或非字符串`)
    return false
  }
  if (typeof data.pass !== 'boolean') {
    onReason?.(`否决项 ${data.id} 的 pass 缺失或非布尔值`)
    return false
  }
  if (typeof data.reason !== 'string') {
    onReason?.(`否决项 ${data.id} 的 reason 缺失或非字符串`)
    return false
  }
  // 命中否决项时原因必填
  if (!data.pass && !data.reason) {
    onReason?.(`否决项 ${data.id} 命中（pass=false）但未填写 reason`)
    return false
  }
  return true
}

export function checkIsSelectionScoreItem(
  res: unknown,
  onReason?: CheckReasonReporter,
): res is SelectionScoreItem {
  if (!res || typeof res !== 'object') {
    onReason?.('评分项不是对象')
    return false
  }
  const data = res as Record<string, unknown>
  if (typeof data.id !== 'number') {
    onReason?.('评分项 id 缺失或非数字')
    return false
  }
  if (typeof data.dimension !== 'string') {
    onReason?.(`评分项 ${data.id} 的 dimension 缺失或非字符串`)
    return false
  }
  if (data.score !== 0 && data.score !== 1 && data.score !== 2) {
    onReason?.(`评分项 ${data.id} 的 score 必须是 0/1/2，当前 ${String(data.score)}`)
    return false
  }
  if (typeof data.evidence !== 'string') {
    onReason?.(`评分项 ${data.id} 的 evidence 缺失或非字符串`)
    return false
  }
  return true
}

export function checkIsSelectionPotential(
  res: unknown,
  onReason?: CheckReasonReporter,
): res is SelectionPotential {
  if (!res || typeof res !== 'object') {
    onReason?.('爆款潜力点不是对象')
    return false
  }
  const data = res as Record<string, unknown>
  if (typeof data.hook !== 'string') {
    onReason?.('potential.hook 缺失或非字符串')
    return false
  }
  if (!Array.isArray(data.candidateTitles) || data.candidateTitles.length !== 3) {
    onReason?.(
      `potential.candidateTitles 必须是 3 个，当前 ${Array.isArray(data.candidateTitles) ? data.candidateTitles.length : 0} 个`,
    )
    return false
  }
  if (!data.candidateTitles.every((item) => typeof item === 'string')) {
    onReason?.('potential.candidateTitles 存在非字符串项')
    return false
  }
  if (typeof data.readerEmotion !== 'string') {
    onReason?.('potential.readerEmotion 缺失或非字符串')
    return false
  }
  return true
}
