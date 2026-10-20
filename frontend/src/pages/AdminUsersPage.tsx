import { useCallback, useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import AdminEmpty from '../components/AdminEmpty'
import AdminNotice from '../components/AdminNotice'
import type { Notice } from '../components/AdminNotice'
import Icon from '../components/Icon'
import Modal from '../components/Modal'
import { useAuth } from '../context/auth-context'
import { ApiRequestError, getErrorMessage as errorMessage } from '../services/api'
import { createUser, deleteUser, fetchUsers } from '../services/users'
import type { NewUser } from '../services/users'
import type { AuthUser } from '../types/auth'

type Field = keyof NewUser
type Errors = Partial<Record<Field, string>>

const FIELDS: { key: Field; label: string; type: string; autoComplete: string }[] = [
  { key: 'fullName', label: 'Nombre y apellido', type: 'text', autoComplete: 'name' },
  { key: 'email', label: 'Correo electrónico', type: 'email', autoComplete: 'email' },
  { key: 'phone', label: 'Teléfono', type: 'tel', autoComplete: 'tel' },
]

function UserFormModal({ token, onClose, onSaved }: { token: string; onClose: () => void; onSaved: (user: AuthUser) => void }) {
  const [values, setValues] = useState<NewUser>({ fullName: '', email: '', phone: '' })
  const [errors, setErrors] = useState<Errors>({})
  const [formError, setFormError] = useState('')
  const [saving, setSaving] = useState(false)

  function showErrors(found: Errors) {
    setErrors(found)
    const first = FIELDS.find((field) => found[field.key])
    if (first) document.getElementById(`uf-${first.key}`)?.focus()
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (saving) return
    setFormError('')

    const input = { fullName: values.fullName.trim(), email: values.email.trim(), phone: values.phone.trim() }
    const found: Errors = {}
    for (const field of FIELDS) if (!input[field.key]) found[field.key] = 'Este campo es obligatorio.'
    showErrors(found)
    if (Object.keys(found).length > 0) return

    setSaving(true)
    try {
      onSaved(await createUser(token, input))
    } catch (error) {
      const fromServer: Errors = {}
      if (error instanceof ApiRequestError) {
        for (const field of FIELDS) {
          const message = error.fields?.[field.key]?.[0]
          if (message) fromServer[field.key] = field.key === 'email' && error.status === 409 ? 'Ya existe una cuenta con este correo.' : message
        }
      }
      showErrors(fromServer)
      setFormError(Object.keys(fromServer).length > 0 ? 'Revisá los campos marcados.' : errorMessage(error))
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal title="Nuevo administrador" onClose={saving ? () => undefined : onClose}>
      <form className="admin-form" onSubmit={(event) => void submit(event)} noValidate>
        <p className="admin-confirm-text">Le vamos a enviar un correo con un enlace para que elija su contraseña. El enlace vence en 72 horas.</p>
        {formError && <p className="admin-alert is-error" role="alert">{formError}</p>}
        {FIELDS.map((field) => (
          <div key={field.key} className={errors[field.key] ? 'admin-field has-error' : 'admin-field'}>
            <label htmlFor={`uf-${field.key}`}>{field.label} *</label>
            <input
              id={`uf-${field.key}`}
              type={field.type}
              autoComplete="off"
              value={values[field.key]}
              onChange={(event) => setValues((current) => ({ ...current, [field.key]: event.target.value }))}
              aria-invalid={Boolean(errors[field.key])}
              aria-describedby={errors[field.key] ? `uf-${field.key}-error` : undefined}
            />
            {errors[field.key] && <span id={`uf-${field.key}-error`} className="admin-error">{errors[field.key]}</span>}
          </div>
        ))}
        <div className="admin-form-actions">
          <button type="button" className="admin-secondary" onClick={onClose} disabled={saving}>Cancelar</button>
          <button type="submit" className="admin-primary" disabled={saving}>{saving ? 'Enviando invitación...' : 'Crear e invitar'}</button>
        </div>
      </form>
    </Modal>
  )
}

export default function AdminUsersPage() {
  const { accessToken, user: currentUser } = useAuth()
  const token = accessToken ?? ''

  const [users, setUsers] = useState<AuthUser[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [reload, setReload] = useState(0)
  const [creating, setCreating] = useState(false)
  const [deleting, setDeleting] = useState<AuthUser | null>(null)
  const [deleteBusy, setDeleteBusy] = useState(false)
  const [notice, setNotice] = useState<Notice | null>(null)
  const clearNotice = useCallback(() => setNotice(null), [])

  useEffect(() => {
    if (!token) return
    const controller = new AbortController()
    fetchUsers(token, controller.signal)
      .then(setUsers)
      .catch((error: unknown) => { if (!controller.signal.aborted) setLoadError(errorMessage(error)) })
      .finally(() => { if (!controller.signal.aborted) setLoading(false) })
    return () => controller.abort()
  }, [token, reload])

  function retry() {
    setLoading(true)
    setLoadError('')
    setReload((value) => value + 1)
  }

  function handleSaved(saved: AuthUser) {
    setCreating(false)
    setUsers((current) => [...current, saved].sort((a, b) => a.fullName.localeCompare(b.fullName, 'es')))
    setNotice({ kind: 'success', text: `Se creó la cuenta de ${saved.fullName} y le enviamos la invitación a ${saved.email}.` })
  }

  async function confirmDelete() {
    if (!deleting) return
    setDeleteBusy(true)
    try {
      await deleteUser(token, deleting.id)
      setUsers((current) => current.filter((item) => item.id !== deleting.id))
      setNotice({ kind: 'success', text: `Se eliminó la cuenta de ${deleting.fullName}.` })
    } catch (error) {
      setNotice({ kind: 'error', text: errorMessage(error) })
    } finally {
      setDeleting(null)
      setDeleteBusy(false)
    }
  }

  return (
    <>
      <div className="admin-heading">
        <div>
          <h1>Administradores</h1>
          <p>Las personas que pueden ingresar al panel. Solo un administrador puede dar de alta a otro.</p>
        </div>
        <button type="button" className="admin-primary" onClick={() => setCreating(true)}><Icon name="plus" /> Nuevo administrador</button>
      </div>

      <AdminNotice notice={notice} onClose={clearNotice} />

      <section className="admin-panel" aria-label="Listado de administradores">
        {loadError ? (
          <AdminEmpty icon="alert" title="No pudimos cargar los administradores" isError action={<button type="button" className="admin-secondary" onClick={retry}>Reintentar</button>}>
            {loadError}
          </AdminEmpty>
        ) : loading ? (
          <div className="admin-skeleton is-rows" role="status" aria-label="Cargando administradores">
            {Array.from({ length: 3 }, (_, index) => <div key={index} />)}
          </div>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th scope="col">Nombre</th>
                  <th scope="col">Correo electrónico</th>
                  <th scope="col">Teléfono</th>
                  <th scope="col"><span className="visually-hidden">Acciones</span></th>
                </tr>
              </thead>
              <tbody>
                {users.map((item) => (
                  <tr key={item.id}>
                    <td data-label="Nombre">
                      <strong>{item.fullName}</strong>
                      {item.id === currentUser?.id && <> <span className="admin-tag">Vos</span></>}
                    </td>
                    <td data-label="Correo electrónico">{item.email}</td>
                    <td data-label="Teléfono">{item.phone}</td>
                    <td className="admin-actions-cell">
                      <div className="admin-row-actions">
                        {item.id !== currentUser?.id && (
                          <button type="button" className="admin-icon-button is-danger" aria-label={`Eliminar la cuenta de ${item.fullName}`} title="Eliminar" onClick={() => setDeleting(item)}>
                            <Icon name="delete" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {creating && <UserFormModal token={token} onClose={() => setCreating(false)} onSaved={handleSaved} />}

      {deleting && (
        <Modal title="Eliminar administrador" onClose={() => { if (!deleteBusy) setDeleting(null) }}>
          <p className="admin-confirm-text">
            ¿Seguro que querés eliminar la cuenta de <strong>{deleting.fullName}</strong>? Pierde el acceso al panel de inmediato, incluso si tiene una sesión abierta.
          </p>
          <div className="admin-form-actions">
            <button type="button" className="admin-secondary" disabled={deleteBusy} onClick={() => setDeleting(null)}>Cancelar</button>
            <button type="button" className="admin-danger" disabled={deleteBusy} onClick={() => void confirmDelete()}>
              {deleteBusy ? 'Eliminando...' : 'Sí, eliminar'}
            </button>
          </div>
        </Modal>
      )}
    </>
  )
}
