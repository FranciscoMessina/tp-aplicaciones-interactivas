import type { AuthUser } from '../types/auth'
import { apiRequest } from './api'

// ---- Administración (requiere token de administrador) ----

export interface NewUser {
  fullName: string
  email: string
  phone: string
}

export function fetchUsers(token: string, signal?: AbortSignal) {
  return apiRequest<AuthUser[]>('/api/users', { token, signal })
}

/** Crea la cuenta y el backend le manda a la persona el enlace para elegir su contraseña. */
export function createUser(token: string, input: NewUser) {
  return apiRequest<AuthUser>('/api/users', { method: 'POST', token, body: input })
}

export function deleteUser(token: string, id: string) {
  return apiRequest<void>(`/api/users/${id}`, { method: 'DELETE', token })
}
