import { useState } from 'react'
import type { FormEvent, ReactNode } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/auth-context'
import { useBusiness } from '../context/business-context'
import { getErrorMessage as errorText } from '../services/api'
import { forgotPassword, login, resetPassword } from '../services/auth'
import { newPasswordProblem } from '../utils/password'
import Icon from '../components/Icon'
import LogoMark from '../components/LogoMark'
import '../Admin.css'

// Entrada al panel: misma columna en tinta que la barra lateral del área privada, y el formulario a la derecha.
function AuthLayout({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) {
  const { businessName } = useBusiness()

  return (
    <div className="auth-shell">
      <aside className="auth-aside">
        <Link to="/" className="admin-brand" aria-label={`${businessName || 'Tienda'}, ir a la tienda`}>
          <LogoMark /> {businessName} <span>Panel</span>
        </Link>
        <div className="auth-aside-body">
          <p className="auth-aside-title">Panel de administración</p>
          <ul>
            <li><Icon name="products" /> Productos y categorías del catálogo</li>
            <li><Icon name="enquiries" /> Consultas de los visitantes</li>
            <li><Icon name="business" /> Información del comercio</li>
          </ul>
        </div>
        <Link to="/" className="auth-back"><Icon name="back" /> Volver a la tienda</Link>
      </aside>
      <main className="auth-main">
        <div className="auth-content">
          <div className="auth-heading">
            <h1>{title}</h1>
            <p>{subtitle}</p>
          </div>
          {children}
        </div>
      </main>
    </div>
  )
}

function ErrorMessage({ error }: { error: string }) {
  return error ? <p className="admin-alert is-error" role="alert">{error}</p> : null
}

export function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [pending, setPending] = useState(false)
  const { signIn, sessionExpired } = useAuth()
  const navigate = useNavigate()

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setPending(true)
    try {
      const session = await login(email.trim(), password)
      signIn(session)
      navigate('/admin', { replace: true })
    } catch (cause) {
      setError(errorText(cause))
    } finally {
      setPending(false)
    }
  }

  return (
    <AuthLayout title="Iniciar sesión" subtitle="Acceso para administradores del comercio.">
      <form className="auth-form" onSubmit={(event) => void submit(event)}>
        {sessionExpired && !error && <p className="admin-alert" role="status">Tu sesión venció o se cerró. Volvé a iniciar sesión para continuar.</p>}
        <ErrorMessage error={error} />
        <label className="admin-field">Correo electrónico<input type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="nombre@ejemplo.com" /></label>
        <label className="admin-field">Contraseña<input type="password" autoComplete="current-password" required value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Ingresá tu contraseña" /></label>
        <div className="auth-inline"><Link to="/recuperar-contrasena">¿Olvidaste tu contraseña?</Link></div>
        <button className="admin-primary auth-submit" type="submit" disabled={pending}>{pending ? 'Ingresando...' : 'Iniciar sesión'}</button>
      </form>
      <p className="auth-switch">¿No tenés cuenta? Pedile a un administrador del comercio que te invite desde el panel.</p>
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
    <AuthLayout title="Recuperar contraseña" subtitle="Ingresá tu correo y te enviamos un enlace para elegir una nueva contraseña.">
      {done ? (
        <div className="auth-success">
          <strong>Solicitud recibida</strong>
          <p>Si la cuenta existe, te enviamos un correo con el enlace para restablecer la contraseña. El enlace vence en 15 minutos.</p>
          <p className="auth-dev-note">Si el servidor no tiene un servicio de correo configurado, el enlace se muestra en la consola del backend.</p>
          <Link className="admin-primary auth-submit" to="/restablecer-contrasena">Tengo el código</Link>
        </div>
      ) : (
        <form className="auth-form" onSubmit={(event) => void submit(event)}>
          <ErrorMessage error={error} />
          <label className="admin-field">Correo electrónico<input type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="nombre@ejemplo.com" /></label>
          <button className="admin-primary auth-submit" type="submit" disabled={pending}>{pending ? 'Enviando...' : 'Solicitar recuperación'}</button>
        </form>
      )}
      <p className="auth-switch"><Link to="/login">Volver al inicio de sesión</Link></p>
    </AuthLayout>
  )
}

export function ResetPasswordPage() {
  const [params] = useSearchParams()
  // El mail de invitación usa este mismo formulario para elegir la primera contraseña.
  const isInvitation = params.get('invitacion') === '1'
  const [token, setToken] = useState(params.get('token') ?? '')
  const [password, setPassword] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)
  const [pending, setPending] = useState(false)

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const problem = newPasswordProblem(password, confirmation)
    setError(problem)
    if (problem) return
    setPending(true)
    try { await resetPassword(token.trim(), password); setDone(true) }
    catch (cause) { setError(errorText(cause)) }
    finally { setPending(false) }
  }

  return (
    <AuthLayout
      title={isInvitation ? 'Activar tu cuenta' : 'Restablecer contraseña'}
      subtitle={isInvitation ? 'Elegí la contraseña con la que vas a ingresar al panel.' : 'Ingresá el código de recuperación y elegí una nueva contraseña.'}
    >
      {done ? (
        <div className="auth-success">
          <strong>{isInvitation ? 'Cuenta activada' : 'Contraseña actualizada'}</strong>
          <p>Ya podés ingresar con tu nueva contraseña.</p>
          <Link className="admin-primary auth-submit" to="/login">Ir a iniciar sesión</Link>
        </div>
      ) : (
        <form className="auth-form" onSubmit={(event) => void submit(event)}>
          <ErrorMessage error={error} />
          <label className="admin-field">Código de recuperación<input required autoComplete="off" value={token} onChange={(event) => setToken(event.target.value)} placeholder="Pegá el código que recibiste por correo" /></label>
          <label className="admin-field">Nueva contraseña<input type="password" autoComplete="new-password" required minLength={8} value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Mínimo 8 caracteres" /></label>
          <label className="admin-field">Confirmar contraseña<input type="password" autoComplete="new-password" required minLength={8} value={confirmation} onChange={(event) => setConfirmation(event.target.value)} placeholder="Repetí la contraseña" /></label>
          <button className="admin-primary auth-submit" type="submit" disabled={pending}>{pending ? 'Guardando...' : isInvitation ? 'Activar cuenta' : 'Actualizar contraseña'}</button>
        </form>
      )}
      <p className="auth-switch"><Link to="/login">Volver al inicio de sesión</Link></p>
    </AuthLayout>
  )
}
