export type AiUseToolResponse = {
  type: 'use-tool'
  name: string
  args: string[]
  message?: string
}

export type AiNormalResponse<T = any> = {
  type: 'response'
  message?: string
  status: string
  data?: T
}

export type AiResponse<T = any> = AiNormalResponse<T> | AiUseToolResponse

/** 推荐等级：强烈推荐直接做 / 边缘，建议试写一篇再定 / 不建议做 */
export type SelectionRecommendLevel = 'strong' | 'trial' | 'reject'

export type SelectionVetoCheck = {
  /** 否决项序号，固定 1~10 */
  id: number
  /** 否决项名称 */
  name: string
  /** true = 未命中（通过），false = 命中否决项 */
  pass: boolean
  /** 命中时的原因说明，pass=false 时必填 */
  reason: string
}

export type SelectionScoreItem = {
  /** 评分维度序号，固定 1~10 */
  id: number
  /** 维度名称 */
  dimension: string
  /** 该维度得分，0 / 1 / 2 */
  score: number
  /** 证据，必须来自 Step 1 真实检索结果 */
  evidence: string
}

export type SelectionConclusion = {
  recommendLevel: SelectionRecommendLevel
  /** 预估可拆篇数 */
  estimatedArticleCount: number
  /** 合集名方向，5~6 字，不带"书/章"字眼 */
  collectionName: string
}

export type SelectionPotential = {
  /** 核心反常识钩子（一句话） */
  hook: string
  /** 3 个候选标题，≤30 字 */
  candidateTitles: string[]
  /** 戳中的读者情绪 */
  readerEmotion: string
}

export type SelectionSOPResult = {
  /** 书名（不带书名号） */
  bookName: string
  /** 评分，满分 20 */
  score: number
  conclusion: SelectionConclusion
  /** 否决项检查，固定 10 条 */
  vetoChecks: SelectionVetoCheck[]
  /** 评分卡明细，固定 10 维；命中否决项时可整体省略 */
  scorecard?: SelectionScoreItem[]
  /** 爆款潜力点；命中否决项时可整体省略 */
  potential?: SelectionPotential
  /** 主要风险，1~3 条 */
  risks: string[]
}
