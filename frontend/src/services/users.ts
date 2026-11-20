import type { AuthUser } from '../types/auth'
import { apiRequest } from './api'

// ---- Administración (requiere token de administrador) ----

export interface NewUser {
  fullName: string
  email: string
  phone: string
}

/** `pendingInvitation`: todavía no eligió su contraseña. */
export interface AdminUser extends AuthUser {
  pendingInvitation: boolean
}

export function fetchUsers(token: string, signal?: AbortSignal) {
  return apiRequest<AdminUser[]>('/api/users', { token, signal })
}

/** Crea la cuenta y el backend le manda a la persona el enlace para elegir su contraseña. */
export function createUser(token: string, input: NewUser) {
  return apiRequest<AuthUser>('/api/users', { method: 'POST', token, body: input })
}

/** Genera un enlace nuevo para una cuenta que no aceptó la invitación. */
export function resendInvitation(token: string, id: string) {
  return apiRequest<void>(`/api/users/${id}/resend-invitation`, { method: 'POST', token })
}

export function deleteUser(token: string, id: string) {
  return apiRequest<void>(`/api/users/${id}`, { method: 'DELETE', token })
}
