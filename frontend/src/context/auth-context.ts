import { createContext, useContext } from 'react'
import type { AuthUser, AuthSession } from '../types/auth'

export interface AuthContextValue {
  user: AuthUser | null
  checkingSession: boolean
  signIn: (session: AuthSession) => void
  signOut: () => Promise<void>
}

export const AuthContext = createContext<AuthContextValue | null>(null)

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth necesita AuthProvider')
  return context
}
