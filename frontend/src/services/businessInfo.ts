import type { BusinessInfo, BusinessInfoInput } from '../types/business'
import { apiRequest } from './api'

export function fetchBusinessInfo(signal?: AbortSignal) {
  return apiRequest<BusinessInfo>('/api/business-info', { signal })
}

/** Crea o reemplaza la información institucional. Solo administradores. */
export function saveBusinessInfo(token: string, input: BusinessInfoInput) {
  return apiRequest<BusinessInfo>('/api/business-info', { method: 'PUT', token, body: input })
}
