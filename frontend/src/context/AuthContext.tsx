import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { fetchProfile, logout as logoutRequest } from '../services/auth'
import type { AuthSession, AuthUser } from '../types/auth'
import { AuthContext } from './auth-context'

const STORAGE_KEY = 'techstore_session'

function readSession(): AuthSession | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const session: AuthSession = JSON.parse(raw)
    if (typeof session.accessToken !== 'string' || !session.user?.id) return null
    return session
  } catch {
    return null
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(readSession)
  const [checkingSession, setCheckingSession] = useState(() => Boolean(readSession()))

  const token = session?.accessToken

  useEffect(() => {
    if (!token) return
    let cancelled = false
    void fetchProfile(token)
      .then((profile) => {
        if (cancelled) return
        setSession((current) => current?.accessToken === token ? { accessToken: token, user: profile } : current)
      })
      .catch((error: unknown) => {
        if (cancelled) return
        // Ante fallas de red conservamos la sesión; ante token rechazado la descartamos.
        if (error && typeof error === 'object' && 'status' in error && error.status === 401) {
          setSession(null)
          sessionStorage.removeItem(STORAGE_KEY)
        }
      })
      .finally(() => { if (!cancelled) setCheckingSession(false) })
    return () => { cancelled = true }
  }, [token])

  function signIn(nextSession: AuthSession) {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(nextSession))
    setSession(nextSession)
    setCheckingSession(false)
  }

  function updateUser(nextUser: AuthUser) {
    if (!session) return
    const updatedSession = { ...session, user: nextUser }
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(updatedSession))
    setSession(updatedSession)
  }

  async function signOut() {
    const token = session?.accessToken
    // El logout del backend es informativo (JWT sin lista de revocación).
    // Limpiar el token del cliente siempre, incluso si falla la red.
    sessionStorage.removeItem(STORAGE_KEY)
    setSession(null)
    setCheckingSession(false)
    if (token) { try { await logoutRequest(token) } catch { /* Ya cerramos la sesión local */ } }
  }

  return (
    <AuthContext.Provider value={{ user: session?.user ?? null, accessToken: token ?? null, checkingSession, signIn, updateUser, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

