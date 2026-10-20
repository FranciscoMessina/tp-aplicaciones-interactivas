import { useState } from 'react'
import type { FormEvent } from 'react'
import { useAuth } from '../context/auth-context'
import { getErrorMessage } from '../services/api'
import { changePassword, updateProfile } from '../services/auth'
import { newPasswordProblem } from '../utils/password'

export default function ProfilePage() {
  const { user, accessToken, updateUser, signIn } = useAuth()
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
    const problem = newPasswordProblem(newPassword, repeatPassword)
    if (problem) { setPasswordError(problem); return }
    setChangingPassword(true)
    try {
      const result = await changePassword(accessToken, currentPassword, newPassword)
      if (user) signIn({ accessToken: result.accessToken, user })
      setCurrentPassword('')
      setNewPassword('')
      setRepeatPassword('')
      setPasswordSuccess('Tu contraseña se actualizó. Se cerraron las sesiones abiertas en otros dispositivos.')
    } catch (error) {
      setPasswordError(getErrorMessage(error))
    } finally {
      setChangingPassword(false)
    }
  }

  return (
    <>
      <div className="admin-heading">
        <div>
          <h1>Mi perfil</h1>
          <p>Consultá y administrá tus datos personales y tu contraseña.</p>
        </div>
      </div>

      <div className="profile-grid">
        <section className="admin-panel" aria-labelledby="profile-data-title">
          <header className="admin-panel-header">
            <div>
              <h2 id="profile-data-title">Datos personales</h2>
              <p>Esta información se guarda en tu cuenta.</p>
            </div>
            <span className="admin-tag">Administrador</span>
          </header>
          <form className="admin-form admin-panel-body" onSubmit={(event) => void saveProfile(event)}>
            {profileError && <p className="admin-alert is-error" role="alert">{profileError}</p>}
            {profileSuccess && <p className="admin-alert is-success" role="status">{profileSuccess}</p>}
            <div className="admin-field">
              <label htmlFor="profile-full-name">Nombre y apellido</label>
              <input id="profile-full-name" required autoComplete="name" maxLength={150} value={fullName} onChange={(event) => setFullName(event.target.value)} />
            </div>
            <div className="admin-field">
              <label htmlFor="profile-email">Correo electrónico</label>
              <input id="profile-email" required type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} />
            </div>
            <div className="admin-field">
              <label htmlFor="profile-phone">Teléfono</label>
              <input id="profile-phone" required type="tel" autoComplete="tel" value={phone} onChange={(event) => setPhone(event.target.value)} />
            </div>
            <div className="admin-form-actions">
              <button className="admin-primary" type="submit" disabled={saving}>
                {saving ? 'Guardando...' : 'Guardar cambios'}
              </button>
            </div>
          </form>
        </section>

        <section className="admin-panel" aria-labelledby="password-title">
          <header className="admin-panel-header">
            <div>
              <h2 id="password-title">Cambiar contraseña</h2>
              <p>Por seguridad, ingresá tu contraseña actual.</p>
            </div>
          </header>
          <form className="admin-form admin-panel-body" onSubmit={(event) => void savePassword(event)}>
            {passwordError && <p className="admin-alert is-error" role="alert">{passwordError}</p>}
            {passwordSuccess && <p className="admin-alert is-success" role="status">{passwordSuccess}</p>}
            <div className="admin-field">
              <label htmlFor="profile-current-password">Contraseña actual</label>
              <input id="profile-current-password" type="password" required autoComplete="current-password" value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} />
            </div>
            <div className="admin-field">
              <label htmlFor="profile-new-password">Nueva contraseña</label>
              <input id="profile-new-password" type="password" required minLength={8} autoComplete="new-password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} placeholder="Mínimo 8 caracteres" />
            </div>
            <div className="admin-field">
              <label htmlFor="profile-repeat-password">Confirmar contraseña</label>
              <input id="profile-repeat-password" type="password" required minLength={8} autoComplete="new-password" value={repeatPassword} onChange={(event) => setRepeatPassword(event.target.value)} />
            </div>
            <div className="admin-form-actions">
              <button className="admin-primary" type="submit" disabled={changingPassword}>
                {changingPassword ? 'Actualizando...' : 'Actualizar contraseña'}
              </button>
            </div>
          </form>
        </section>
      </div>
    </>
  )
}
