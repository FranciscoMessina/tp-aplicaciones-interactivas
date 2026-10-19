import type { Enquiry, EnquiryInput, EnquiryStatus } from '../types/business'
import { apiRequest } from './api'

export function sendEnquiry(input: EnquiryInput) {
  return apiRequest<Enquiry>('/api/enquiries', { method: 'POST', body: input })
}

// ---- Administración (requiere token de administrador) ----

export function fetchEnquiries(token: string, status?: EnquiryStatus, signal?: AbortSignal) {
  const query = status ? `?status=${status}` : ''
  return apiRequest<Enquiry[]>(`/api/enquiries${query}`, { token, signal })
}

export function updateEnquiryStatus(token: string, id: string, status: EnquiryStatus) {
  return apiRequest<Enquiry>(`/api/enquiries/${id}`, { method: 'PATCH', token, body: { status } })
}

export function deleteEnquiry(token: string, id: string) {
  return apiRequest<void>(`/api/enquiries/${id}`, { method: 'DELETE', token })
}
