export type AiUseToolResponse = {
  type: 'use-tool'
  name: string
  args: string[]
  message?: string
}

export type AiNormalResponse = {
  type: 'response'
  message: string
}

export type AiResponse = AiNormalResponse | AiUseToolResponse
