import type { ApiEnvelope, AuthSession, AuthUser } from '../types/auth'

export class ApiRequestError extends Error {
  readonly status: number
  readonly fields?: Record<string, string[]>

  constructor(message: string, status: number, fields?: Record<string, string[]>) {
    super(message)
    this.name = 'ApiRequestError'
    this.status = status
    this.fields = fields
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  let response: Response
  try {
    response = await fetch(`/api/users${path}`, {
      ...options,
      headers: { 'Content-Type': 'application/json', ...options.headers },
    })
  } catch {
    throw new ApiRequestError('No se pudo conectar con el servidor. Revisá que el backend esté iniciado.', 0)
  }

  if (response.status === 204) return undefined as T

  let body: ApiEnvelope<T>
  try {
    body = (await response.json()) as ApiEnvelope<T>
  } catch {
    throw new ApiRequestError('El servidor devolvió una respuesta inesperada.', response.status)
  }

  if (!response.ok || !body.success || body.data === undefined) {
    throw new ApiRequestError(body.error?.message ?? 'No se pudo completar la operación.', response.status, body.error?.fields)
  }
  return body.data
}

export function login(email: string, password: string) {
  return request<AuthSession>('/login', { method: 'POST', body: JSON.stringify({ email, password }) })
}

export function register(fullName: string, email: string, phone: string, password: string) {
  return request<AuthSession>('/register', { method: 'POST', body: JSON.stringify({ fullName, email, phone, password }) })
}

export function fetchProfile(token: string) {
  return request<AuthUser>('/me', { headers: { Authorization: `Bearer ${token}` } })
}

export function logout(token: string) {
  return request<void>('/logout', { method: 'POST', headers: { Authorization: `Bearer ${token}` } })
}

export function forgotPassword(email: string) {
  return request<{ message: string }>('/forgot-password', { method: 'POST', body: JSON.stringify({ email }) })
}

export function resetPassword(token: string, password: string) {
  return request<{ message: string }>('/reset-password', { method: 'POST', body: JSON.stringify({ token, password }) })
}
