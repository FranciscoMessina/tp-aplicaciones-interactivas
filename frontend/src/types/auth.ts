export type UserRole = 'customer' | 'admin'

export interface AuthUser {
  id: string
  fullName: string
  email: string
  phone: string
  role: UserRole
}

export interface AuthSession {
  accessToken: string
  user: AuthUser
}

export interface ApiEnvelope<T> {
  success: boolean
  data?: T
  error?: { code: string; message: string; fields?: Record<string, string[]> }
}
