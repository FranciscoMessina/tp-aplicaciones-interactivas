export interface AuthUser {
  id: string
  fullName: string
  email: string
  phone: string
}

export interface AuthSession {
  accessToken: string
  user: AuthUser
}
