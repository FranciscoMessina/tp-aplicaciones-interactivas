import type { AuthSession, AuthUser } from '../types/auth'
import { apiRequest } from './api'

export function login(email: string, password: string) {
  return apiRequest<AuthSession>('/api/users/login', { method: 'POST', body: { email, password } })
}

export function fetchProfile(token: string) {
  return apiRequest<AuthUser>('/api/users/me', { token })
}

export function logout(token: string) {
  return apiRequest<void>('/api/users/logout', { method: 'POST', token })
}

export function forgotPassword(email: string) {
  return apiRequest<{ message: string }>('/api/users/forgot-password', { method: 'POST', body: { email } })
}

export function resetPassword(token: string, password: string) {
  return apiRequest<{ message: string }>('/api/users/reset-password', { method: 'POST', body: { token, password } })
}

export interface ProfileChanges {
  fullName: string
  email: string
  phone: string
}

export function updateProfile(token: string, updates: ProfileChanges) {
  return apiRequest<AuthUser>('/api/users/me', { method: 'PATCH', token, body: updates })
}

// Devuelve un token nuevo: el cambio cierra las demás sesiones, incluida la actual.
export function changePassword(token: string, currentPassword: string, newPassword: string) {
  return apiRequest<{ message: string; accessToken: string }>('/api/users/me/password', {
    method: 'PATCH',
    token,
    body: { currentPassword, newPassword },
  })
}
