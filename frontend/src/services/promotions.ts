import type { Promotion, PromotionInput } from '../types/promotion'
import { apiRequest } from './api'

/** Las promociones vigentes hoy. */
export function fetchPromotions(signal?: AbortSignal) {
  return apiRequest<Promotion[]>('/api/promotions', { signal })
}

// ---- Administración (requiere token de administrador) ----

/** Todas, incluidas las apagadas y las fuera de fecha. */
export function fetchAdminPromotions(token: string, signal?: AbortSignal) {
  return apiRequest<Promotion[]>('/api/promotions?includeInactive=true', { token, signal })
}

export function createPromotion(token: string, input: PromotionInput) {
  return apiRequest<Promotion>('/api/promotions', { method: 'POST', token, body: input })
}

export function updatePromotion(token: string, id: string, changes: Partial<PromotionInput>) {
  return apiRequest<Promotion>(`/api/promotions/${id}`, { method: 'PATCH', token, body: changes })
}

export function deletePromotion(token: string, id: string) {
  return apiRequest<void>(`/api/promotions/${id}`, { method: 'DELETE', token })
}
