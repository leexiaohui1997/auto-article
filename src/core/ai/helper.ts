import {
  AiNormalResponse,
  AiResponse,
  AiUseToolResponse,
  SelectionConclusion,
  SelectionPotential,
  SelectionScoreItem,
  SelectionSOPResult,
  SelectionVetoCheck,
} from './types.js'

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

// eslint-disable-next-line complexity
export function checkIsSelectionSOPResult(res: unknown): res is SelectionSOPResult {
  if (!res || typeof res !== 'object') return false
  const data = res as Record<string, unknown>

  if (typeof data.bookName !== 'string' || !data.bookName) return false
  if (typeof data.score !== 'number' || Number.isNaN(data.score)) return false

  if (!checkIsSelectionConclusion(data.conclusion)) return false
  if (!Array.isArray(data.vetoChecks) || data.vetoChecks.length !== 10) return false
  if (!data.vetoChecks.every((item) => checkIsSelectionVetoCheck(item))) return false

  // 命中否决项（reject）时评分卡与潜力点可整体省略
  if (data.scorecard !== undefined) {
    if (!Array.isArray(data.scorecard) || data.scorecard.length !== 10) return false
    if (!data.scorecard.every((item) => checkIsSelectionScoreItem(item))) return false
  }
  if (data.potential !== undefined && !checkIsSelectionPotential(data.potential)) return false

  if (!Array.isArray(data.risks)) return false
  if (data.risks.length < 1 || data.risks.length > 3) return false
  if (!data.risks.every((item) => typeof item === 'string')) return false

  return true
}

export function checkIsSelectionConclusion(res: unknown): res is SelectionConclusion {
  if (!res || typeof res !== 'object') return false
  const data = res as Record<string, unknown>
  if (
    data.recommendLevel !== 'strong' &&
    data.recommendLevel !== 'trial' &&
    data.recommendLevel !== 'reject'
  )
    return false
  if (typeof data.estimatedArticleCount !== 'number' || Number.isNaN(data.estimatedArticleCount))
    return false
  if (typeof data.collectionName !== 'string') return false
  return true
}

export function checkIsSelectionVetoCheck(res: unknown): res is SelectionVetoCheck {
  if (!res || typeof res !== 'object') return false
  const data = res as Record<string, unknown>
  if (typeof data.id !== 'number') return false
  if (typeof data.name !== 'string') return false
  if (typeof data.pass !== 'boolean') return false
  if (typeof data.reason !== 'string') return false
  // 命中否决项时原因必填
  if (!data.pass && !data.reason) return false
  return true
}

export function checkIsSelectionScoreItem(res: unknown): res is SelectionScoreItem {
  if (!res || typeof res !== 'object') return false
  const data = res as Record<string, unknown>
  if (typeof data.id !== 'number') return false
  if (typeof data.dimension !== 'string') return false
  if (data.score !== 0 && data.score !== 1 && data.score !== 2) return false
  if (typeof data.evidence !== 'string') return false
  return true
}

export function checkIsSelectionPotential(res: unknown): res is SelectionPotential {
  if (!res || typeof res !== 'object') return false
  const data = res as Record<string, unknown>
  if (typeof data.hook !== 'string') return false
  if (!Array.isArray(data.candidateTitles) || data.candidateTitles.length !== 3) return false
  if (!data.candidateTitles.every((item) => typeof item === 'string')) return false
  if (typeof data.readerEmotion !== 'string') return false
  return true
}
