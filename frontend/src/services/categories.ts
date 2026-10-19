import type { Category } from '../types/product'
import { apiRequest } from './api'

export function fetchCategories(signal?: AbortSignal) {
  return apiRequest<Category[]>('/api/categories', { signal })
}

// ---- Administración (requiere token de administrador) ----

export function createCategory(token: string, name: string) {
  return apiRequest<Category>('/api/categories', { method: 'POST', token, body: { name } })
}

export function updateCategory(token: string, id: string, name: string) {
  return apiRequest<Category>(`/api/categories/${id}`, { method: 'PATCH', token, body: { name } })
}

export function deleteCategory(token: string, id: string) {
  return apiRequest<void>(`/api/categories/${id}`, { method: 'DELETE', token })
}
