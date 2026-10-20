import type { Enquiry, EnquiryInput, EnquiryStatus } from '../types/business'
import type { Page } from '../types/product'
import { apiRequest } from './api'

export function sendEnquiry(input: EnquiryInput) {
  return apiRequest<Enquiry>('/api/enquiries', { method: 'POST', body: input })
}

// ---- Administración (requiere token de administrador) ----

export function fetchEnquiries(token: string, filters: { status?: EnquiryStatus; page: number; pageSize: number }, signal?: AbortSignal) {
  const params = new URLSearchParams({ page: String(filters.page), pageSize: String(filters.pageSize) })
  if (filters.status) params.set('status', filters.status)
  return apiRequest<Page<Enquiry>>(`/api/enquiries?${params}`, { token, signal })
}

/** Le envía la respuesta por correo al visitante y deja la consulta como respondida. */
export function replyToEnquiry(token: string, id: string, message: string) {
  return apiRequest<Enquiry>(`/api/enquiries/${id}/replies`, { method: 'POST', token, body: { message } })
}

export function updateEnquiryStatus(token: string, id: string, status: EnquiryStatus) {
  return apiRequest<Enquiry>(`/api/enquiries/${id}`, { method: 'PATCH', token, body: { status } })
}

export function deleteEnquiry(token: string, id: string) {
  return apiRequest<void>(`/api/enquiries/${id}`, { method: 'DELETE', token })
}
