import { AiNormalResponse, AiResponse, AiUseToolResponse } from './types.js'

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
  if (typeof res.message !== 'string') return false
  return true
}
