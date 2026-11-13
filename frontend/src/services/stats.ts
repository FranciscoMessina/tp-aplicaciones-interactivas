import type { EnquiryStatus } from '../types/business'
import { apiRequest } from './api'

// Respuesta de GET /api/stats (solo administradores). Los períodos son los últimos 30 días.
export interface DashboardStats {
  products: { total: number; active: number; outOfStock: number }
  enquiries: Record<EnquiryStatus, number> & { total: number; lastPeriod: number }
  views: {
    lastPeriod: number
    previousPeriod: number
    // Un elemento por día (AAAA-MM-DD), del más viejo a hoy.
    byDay: { day: string; count: number }[]
    topProducts: { id: string; name: string; image?: string; count: number }[]
  }
}

export function fetchDashboardStats(token: string, signal?: AbortSignal) {
  return apiRequest<DashboardStats>('/api/stats', { token, signal })
}
