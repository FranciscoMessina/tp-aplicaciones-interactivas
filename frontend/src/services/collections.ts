import type { Collection, CollectionInput } from '../types/collection'
import { apiRequest } from './api'

/** Las colecciones encendidas que tienen productos publicados. */
export function fetchCollections(signal?: AbortSignal) {
  return apiRequest<Collection[]>('/api/collections', { signal })
}

/** Una colección encendida; las apagadas responden 404. */
export function fetchCollection(id: string, signal?: AbortSignal) {
  return apiRequest<Collection>(`/api/collections/${id}`, { signal })
}

// ---- Administración (requiere token de administrador) ----

/** Todas, incluidas las apagadas, con todos sus productos. */
export function fetchAdminCollections(token: string, signal?: AbortSignal) {
  return apiRequest<Collection[]>('/api/collections?includeInactive=true', { token, signal })
}

export function createCollection(token: string, input: CollectionInput) {
  return apiRequest<Collection>('/api/collections', { method: 'POST', token, body: input })
}

export function updateCollection(token: string, id: string, changes: Partial<CollectionInput>) {
  return apiRequest<Collection>(`/api/collections/${id}`, { method: 'PATCH', token, body: changes })
}

export function deleteCollection(token: string, id: string) {
  return apiRequest<void>(`/api/collections/${id}`, { method: 'DELETE', token })
}
