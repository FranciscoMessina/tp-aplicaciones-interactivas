import { createContext, useContext } from 'react'
import type { AuthUser, AuthSession } from '../types/auth'

export interface AuthContextValue {
  user: AuthUser | null
  accessToken: string | null
  checkingSession: boolean
  // La última sesión terminó porque el backend rechazó el token (venció o se cerró).
  sessionExpired: boolean
  signIn: (session: AuthSession) => void
  updateUser: (user: AuthUser) => void
  signOut: () => Promise<void>
}

export const AuthContext = createContext<AuthContextValue | null>(null)

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth necesita AuthProvider')
  return context
}
