import type { EnquiryStatus } from '../types/business'
import { apiRequest } from './api'

// Respuesta de GET /api/stats (solo administradores).
export interface DashboardStats {
  products: { total: number; active: number; outOfStock: number; featured: number }
  enquiries: Record<EnquiryStatus, number> & { total: number }
  productsByCategory: { name: string; count: number }[]
}

export function fetchDashboardStats(token: string, signal?: AbortSignal) {
  return apiRequest<DashboardStats>('/api/stats', { token, signal })
}
