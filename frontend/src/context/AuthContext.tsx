import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { setSessionRejectedHandler } from '../services/api'
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
  const [sessionExpired, setSessionExpired] = useState(false)

  const token = session?.accessToken

  // Cualquier petición con token que el backend rechace cierra la sesión local;
  // las rutas privadas redirigen al login, que explica el motivo.
  useEffect(() => {
    setSessionRejectedHandler(() => {
      sessionStorage.removeItem(STORAGE_KEY)
      setSession(null)
      setSessionExpired(true)
    })
  }, [])

  useEffect(() => {
    if (!token) return
    let cancelled = false
    // Ante fallas de red conservamos la sesión; un token rechazado lo resuelve el handler de arriba.
    void fetchProfile(token)
      .then((profile) => {
        if (cancelled) return
        setSession((current) => current?.accessToken === token ? { accessToken: token, user: profile } : current)
      })
      .catch(() => undefined)
      .finally(() => { if (!cancelled) setCheckingSession(false) })
    return () => { cancelled = true }
  }, [token])

  function signIn(nextSession: AuthSession) {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(nextSession))
    setSession(nextSession)
    setCheckingSession(false)
    setSessionExpired(false)
  }

  function updateUser(nextUser: AuthUser) {
    if (!session) return
    const updatedSession = { ...session, user: nextUser }
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(updatedSession))
    setSession(updatedSession)
  }

  async function signOut() {
    const token = session?.accessToken
    // Limpiar el token del cliente siempre, incluso si falla la red.
    sessionStorage.removeItem(STORAGE_KEY)
    setSession(null)
    setCheckingSession(false)
    if (token) { try { await logoutRequest(token) } catch { /* Ya cerramos la sesión local */ } }
  }

  return (
    <AuthContext.Provider value={{ user: session?.user ?? null, accessToken: token ?? null, checkingSession, sessionExpired, signIn, updateUser, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}
