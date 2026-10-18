import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/auth-context'
import { ApiRequestError, changePassword, updateProfile } from '../services/auth'

function getErrorMessage(error: unknown): string {
  if (error instanceof ApiRequestError) {
    return Object.values(error.fields ?? {})[0]?.[0] ?? error.message
  }
  return 'Ocurrió un error inesperado. Intentá de nuevo.'
}

export default function ProfilePage() {
  const { user, accessToken, updateUser } = useAuth()
  const [fullName, setFullName] = useState(user?.fullName ?? '')
  const [email, setEmail] = useState(user?.email ?? '')
  const [phone, setPhone] = useState(user?.phone ?? '')
  const [saving, setSaving] = useState(false)
  const [profileError, setProfileError] = useState('')
  const [profileSuccess, setProfileSuccess] = useState('')

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [repeatPassword, setRepeatPassword] = useState('')
  const [changingPassword, setChangingPassword] = useState(false)
  const [passwordError, setPasswordError] = useState('')
  const [passwordSuccess, setPasswordSuccess] = useState('')

  async function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setProfileError('')
    setProfileSuccess('')
    if (!accessToken) { setProfileError('Tu sesión expiró. Volvé a iniciar sesión.'); return }

    const values = {
      fullName: fullName.trim(),
      email: email.trim(),
      phone: phone.trim(),
    }
    if (!values.fullName || !values.email || !values.phone) {
      setProfileError('Completá nombre, correo y teléfono.')
      return
    }

    setSaving(true)
    try {
      const updated = await updateProfile(accessToken, values)
      updateUser(updated)
      setFullName(updated.fullName)
      setEmail(updated.email)
      setPhone(updated.phone)
      setProfileSuccess('Tus datos se actualizaron correctamente.')
    } catch (error) {
      setProfileError(getErrorMessage(error))
    } finally {
      setSaving(false)
    }
  }

  async function savePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setPasswordError('')
    setPasswordSuccess('')
    if (!accessToken) { setPasswordError('Tu sesión expiró. Volvé a iniciar sesión.'); return }
    if (newPassword.length < 8) {
      setPasswordError('La nueva contraseña debe tener al menos 8 caracteres.')
      return
    }
    if (newPassword !== repeatPassword) {
      setPasswordError('Las contraseñas nuevas no coinciden.')
      return
    }
    setChangingPassword(true)
    try {
      await changePassword(accessToken, currentPassword, newPassword)
      setCurrentPassword('')
      setNewPassword('')
      setRepeatPassword('')
      setPasswordSuccess('Tu contraseña se actualizó correctamente.')
    } catch (error) {
      setPasswordError(getErrorMessage(error))
    } finally {
      setChangingPassword(false)
    }
  }

  return (
    <main className="profile-page">
      <div className="profile-container">
        <div className="profile-heading">
          <Link className="auth-back" to="/">← Volver a la tienda</Link>
          <span className="section-kicker">MI CUENTA</span>
          <h1>Mi perfil</h1>
          <p>Consultá y administrá tus datos personales y tu contraseña.</p>
        </div>

        <div className="profile-grid">
          <section className="profile-card" aria-labelledby="profile-data-title">
            <div className="profile-section-heading">
              <div>
                <h2 id="profile-data-title">Datos personales</h2>
                <p>Esta información se guarda en tu cuenta.</p>
              </div>
              <span className="profile-role">{user?.role === 'admin' ? 'Administrador' : 'Usuario'}</span>
            </div>
            <form className="auth-form" onSubmit={(event) => void saveProfile(event)}>
              {profileError && <div className="auth-alert auth-alert-error" role="alert">{profileError}</div>}
              {profileSuccess && <div className="profile-success" role="status">{profileSuccess}</div>}
              <label className="auth-field" htmlFor="profile-full-name">
                Nombre y apellido
                <input id="profile-full-name" required autoComplete="name" maxLength={150} value={fullName} onChange={(event) => setFullName(event.target.value)} />
              </label>
              <label className="auth-field" htmlFor="profile-email">
                Correo electrónico
                <input id="profile-email" required type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} />
              </label>
              <label className="auth-field" htmlFor="profile-phone">
                Teléfono
                <input id="profile-phone" required type="tel" autoComplete="tel" value={phone} onChange={(event) => setPhone(event.target.value)} />
              </label>
              <button className="auth-submit" type="submit" disabled={saving}>
                {saving ? 'Guardando...' : 'Guardar cambios'}
              </button>
            </form>
          </section>

          <section className="profile-card" aria-labelledby="password-title">
            <div className="profile-section-heading">
              <div>
                <h2 id="password-title">Cambiar contraseña</h2>
                <p>Por seguridad, ingresá tu contraseña actual.</p>
              </div>
            </div>
            <form className="auth-form" onSubmit={(event) => void savePassword(event)}>
              {passwordError && <div className="auth-alert auth-alert-error" role="alert">{passwordError}</div>}
              {passwordSuccess && <div className="profile-success" role="status">{passwordSuccess}</div>}
              <label className="auth-field" htmlFor="profile-current-password">
                Contraseña actual
                <input id="profile-current-password" type="password" required autoComplete="current-password" value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} />
              </label>
              <label className="auth-field" htmlFor="profile-new-password">
                Nueva contraseña
                <input id="profile-new-password" type="password" required minLength={8} autoComplete="new-password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} placeholder="Mínimo 8 caracteres" />
              </label>
              <label className="auth-field" htmlFor="profile-repeat-password">
                Confirmar contraseña
                <input id="profile-repeat-password" type="password" required minLength={8} autoComplete="new-password" value={repeatPassword} onChange={(event) => setRepeatPassword(event.target.value)} />
              </label>
              <button className="auth-submit" type="submit" disabled={changingPassword}>
                {changingPassword ? 'Actualizando...' : 'Actualizar contraseña'}
              </button>
            </form>
          </section>
        </div>
      </div>
    </main>
  )
}
