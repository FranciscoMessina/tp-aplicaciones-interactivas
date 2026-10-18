import { useState } from 'react'
import type { FormEvent, ReactNode } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/auth-context'
import { ApiRequestError, forgotPassword, login, register, resetPassword } from '../services/auth'

function AuthLayout({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) {
  return (
    <main className="auth-page">
      <section className="auth-card">
        <Link to="/" className="auth-back">← Volver a la tienda</Link>
        <div className="auth-heading">
          <span className="section-kicker">MI CUENTA</span>
          <h1>{title}</h1>
          <p>{subtitle}</p>
        </div>
        {children}
      </section>
    </main>
  )
}

function ErrorMessage({ error }: { error: string }) {
  return error ? <div className="auth-alert auth-alert-error" role="alert">{error}</div> : null
}

function errorText(error: unknown) {
  if (error instanceof ApiRequestError) {
    const firstField = Object.values(error.fields ?? {})[0]?.[0]
    return firstField ?? error.message
  }
  return 'Ocurrió un error. Intentá nuevamente.'
}

export function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [pending, setPending] = useState(false)
  const { signIn } = useAuth()
  const navigate = useNavigate()

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setPending(true)
    try {
      const session = await login(email.trim(), password)
      signIn(session)
      navigate('/', { replace: true })
    } catch (cause) {
      setError(errorText(cause))
    } finally {
      setPending(false)
    }
  }

  return (
    <AuthLayout title="Iniciar sesión" subtitle="Ingresá con tu cuenta para continuar.">
      <form className="auth-form" onSubmit={(event) => void submit(event)}>
        <ErrorMessage error={error} />
        <label className="auth-field">Correo electrónico<input type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="nombre@ejemplo.com" /></label>
        <label className="auth-field">Contraseña<input type="password" autoComplete="current-password" required value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Ingresá tu contraseña" /></label>
        <div className="auth-inline"><Link to="/recuperar-contrasena">¿Olvidaste tu contraseña?</Link></div>
        <button className="auth-submit" type="submit" disabled={pending}>{pending ? 'Ingresando...' : 'Iniciar sesión'}</button>
      </form>
      <p className="auth-switch">¿No tenés cuenta? <Link to="/registro">Registrate</Link></p>
    </AuthLayout>
  )
}

export function RegisterPage() {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [error, setError] = useState('')
  const [pending, setPending] = useState(false)
  const { signIn } = useAuth()
  const navigate = useNavigate()

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    if (password.length < 8) { setError('La contraseña debe tener al menos 8 caracteres.'); return }
    if (password !== confirmation) { setError('Las contraseñas no coinciden.'); return }
    setPending(true)
    try {
      const session = await register(fullName.trim(), email.trim(), phone.trim(), password)
      signIn(session)
      navigate('/', { replace: true })
    } catch (cause) {
      setError(errorText(cause))
    } finally {
      setPending(false)
    }
  }

  return (
    <AuthLayout title="Crear una cuenta" subtitle="Completá tus datos para registrarte en TechStore.">
      <form className="auth-form" onSubmit={(event) => void submit(event)}>
        <ErrorMessage error={error} />
        <label className="auth-field">Nombre y apellido<input required autoComplete="name" value={fullName} onChange={(event) => setFullName(event.target.value)} placeholder="Ej.: Juan Pérez" /></label>
        <label className="auth-field">Correo electrónico<input type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="nombre@ejemplo.com" /></label>
        <label className="auth-field">Teléfono<input type="tel" autoComplete="tel" required value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="Ej.: +54 11 5555 0101" /></label>
        <label className="auth-field">Contraseña<input type="password" autoComplete="new-password" required minLength={8} value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Mínimo 8 caracteres" /></label>
        <label className="auth-field">Confirmar contraseña<input type="password" autoComplete="new-password" required minLength={8} value={confirmation} onChange={(event) => setConfirmation(event.target.value)} placeholder="Repetí la contraseña" /></label>
        <button className="auth-submit" type="submit" disabled={pending}>{pending ? 'Creando cuenta...' : 'Crear cuenta'}</button>
      </form>
      <p className="auth-switch">¿Ya tenés cuenta? <Link to="/login">Iniciá sesión</Link></p>
    </AuthLayout>
  )
}

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)
  const [pending, setPending] = useState(false)

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setPending(true)
    try {
      await forgotPassword(email.trim())
      setDone(true)
    } catch (cause) { setError(errorText(cause)) }
    finally { setPending(false) }
  }

  return (
    <AuthLayout title="Recuperar contraseña" subtitle="Ingresá tu correo para solicitar un código de recuperación.">
      {done ? (
        <div className="auth-success">
          <strong>Solicitud recibida</strong>
          <p>Si la cuenta existe, se generó un código de recuperación.</p>
          <p className="auth-dev-note">Durante el desarrollo, el backend muestra el código en su terminal. Todavía no envía correos.</p>
          <Link className="auth-submit auth-as-link" to="/restablecer-contrasena">Tengo el código</Link>
        </div>
      ) : (
        <form className="auth-form" onSubmit={(event) => void submit(event)}>
          <ErrorMessage error={error} />
          <label className="auth-field">Correo electrónico<input type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="nombre@ejemplo.com" /></label>
          <button className="auth-submit" type="submit" disabled={pending}>{pending ? 'Enviando...' : 'Solicitar recuperación'}</button>
        </form>
      )}
      <p className="auth-switch"><Link to="/login">Volver al inicio de sesión</Link></p>
    </AuthLayout>
  )
}

export function ResetPasswordPage() {
  const [params] = useSearchParams()
  const [token, setToken] = useState(params.get('token') ?? '')
  const [password, setPassword] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)
  const [pending, setPending] = useState(false)

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    if (password.length < 8) { setError('La contraseña debe tener al menos 8 caracteres.'); return }
    if (password !== confirmation) { setError('Las contraseñas no coinciden.'); return }
    setPending(true)
    try { await resetPassword(token.trim(), password); setDone(true) }
    catch (cause) { setError(errorText(cause)) }
    finally { setPending(false) }
  }

  return (
    <AuthLayout title="Restablecer contraseña" subtitle="Ingresá el código de recuperación y elegí una nueva contraseña.">
      {done ? (
        <div className="auth-success">
          <strong>Contraseña actualizada</strong>
          <p>Ya podés ingresar con tu nueva contraseña.</p>
          <Link className="auth-submit auth-as-link" to="/login">Ir a iniciar sesión</Link>
        </div>
      ) : (
        <form className="auth-form" onSubmit={(event) => void submit(event)}>
          <ErrorMessage error={error} />
          <label className="auth-field">Código de recuperación<input required autoComplete="off" value={token} onChange={(event) => setToken(event.target.value)} placeholder="Pegá el código de la terminal" /></label>
          <label className="auth-field">Nueva contraseña<input type="password" autoComplete="new-password" required minLength={8} value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Mínimo 8 caracteres" /></label>
          <label className="auth-field">Confirmar contraseña<input type="password" autoComplete="new-password" required minLength={8} value={confirmation} onChange={(event) => setConfirmation(event.target.value)} placeholder="Repetí la contraseña" /></label>
          <button className="auth-submit" type="submit" disabled={pending}>{pending ? 'Guardando...' : 'Actualizar contraseña'}</button>
        </form>
      )}
      <p className="auth-switch"><Link to="/login">Volver al inicio de sesión</Link></p>
    </AuthLayout>
  )
}
