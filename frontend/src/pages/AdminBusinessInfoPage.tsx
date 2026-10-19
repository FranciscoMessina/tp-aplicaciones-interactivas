import { useCallback, useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import AdminNotice from '../components/AdminNotice'
import type { Notice } from '../components/AdminNotice'
import { useAuth } from '../context/auth-context'
import { ApiRequestError, getErrorMessage as errorMessage } from '../services/api'
import { fetchBusinessInfo, saveBusinessInfo } from '../services/businessInfo'
import type { BusinessInfo, BusinessInfoInput } from '../types/business'

// Los textareas se guardan como texto (una línea por elemento) y se convierten a arrays al enviar.
type FormState = Record<'name' | 'description' | 'address' | 'phone' | 'socialNetworks' | 'openingHours', string>
type Errors = Partial<Record<keyof FormState, string>>

const FIELDS: (keyof FormState)[] = ['name', 'description', 'address', 'phone', 'socialNetworks', 'openingHours']
const PHONE_PATTERN = /^[+\d\s()-]{6,}$/

function isHttpUrl(value: string) {
  try {
    return ['http:', 'https:'].includes(new URL(value).protocol)
  } catch {
    return false
  }
}

function toLines(text: string) {
  return text.split('\n').map((line) => line.trim()).filter(Boolean)
}

function toForm(info?: BusinessInfo): FormState {
  return {
    name: info?.name ?? '',
    description: info?.description ?? '',
    address: info?.address ?? '',
    phone: info?.phone ?? '',
    socialNetworks: (info?.socialNetworks ?? []).join('\n'),
    openingHours: (info?.openingHours ?? []).join('\n'),
  }
}

function validate(form: FormState): Errors {
  const found: Errors = {}
  if (!form.name.trim()) found.name = 'Ingresá el nombre del comercio.'
  if (!form.description.trim()) found.description = 'Ingresá una descripción.'
  if (!form.address.trim()) found.address = 'Ingresá la dirección.'
  if (!form.phone.trim()) found.phone = 'Ingresá el teléfono.'
  else if (!PHONE_PATTERN.test(form.phone.trim())) found.phone = 'Ingresá un teléfono válido.'
  if (toLines(form.socialNetworks).some((url) => !isHttpUrl(url))) {
    found.socialNetworks = 'Revisá las URLs: cada línea debe empezar con http:// o https://.'
  }
  return found
}

export default function AdminBusinessInfoPage() {
  const { accessToken } = useAuth()
  const token = accessToken ?? ''

  const [form, setForm] = useState<FormState>(toForm())
  const [errors, setErrors] = useState<Errors>({})
  const [formError, setFormError] = useState('')
  const [notCreated, setNotCreated] = useState(false)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [reload, setReload] = useState(0)
  const [saving, setSaving] = useState(false)
  const [notice, setNotice] = useState<Notice | null>(null)

  const clearNotice = useCallback(() => setNotice(null), [])

  useEffect(() => {
    const controller = new AbortController()
    fetchBusinessInfo(controller.signal)
      .then((info) => {
        setForm(toForm(info))
        setNotCreated(false)
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return
        // 404: todavía no se cargó la información; se empieza con el formulario vacío.
        if (error instanceof ApiRequestError && error.status === 404) {
          setForm(toForm())
          setNotCreated(true)
        } else {
          setLoadError(errorMessage(error))
        }
      })
      .finally(() => { if (!controller.signal.aborted) setLoading(false) })
    return () => controller.abort()
  }, [reload])

  function retry() {
    setLoading(true)
    setLoadError('')
    setReload((value) => value + 1)
  }

  function setField(key: keyof FormState, value: string) {
    setForm((current) => ({ ...current, [key]: value }))
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (saving) return
    setFormError('')

    const found = validate(form)
    setErrors(found)
    if (Object.keys(found).length > 0) return

    const input: BusinessInfoInput = {
      name: form.name.trim(),
      description: form.description.trim(),
      address: form.address.trim(),
      phone: form.phone.trim(),
      socialNetworks: toLines(form.socialNetworks),
      openingHours: toLines(form.openingHours),
    }

    setSaving(true)
    try {
      const saved = await saveBusinessInfo(token, input)
      setForm(toForm(saved))
      setNotCreated(false)
      setNotice({ kind: 'success', text: 'Se guardó la información del comercio.' })
    } catch (error) {
      if (error instanceof ApiRequestError && error.fields) {
        // El backend envía claves como `name` o `socialNetworks.0`; nos quedamos con el campo base.
        const fromServer: Errors = {}
        for (const key of Object.keys(error.fields)) {
          const field = key.split('.')[0] as keyof FormState
          const message = error.fields[key]?.[0]
          if (message && FIELDS.includes(field) && !fromServer[field]) fromServer[field] = message
        }
        setErrors(fromServer)
        setFormError(Object.keys(fromServer).length > 0 ? 'Revisá los campos marcados.' : errorMessage(error))
      } else {
        setFormError(errorMessage(error))
      }
    } finally {
      setSaving(false)
    }
  }

  const fieldClass = (key: keyof FormState) => (errors[key] ? 'admin-field has-error' : 'admin-field')

  return (
    <>
      <div className="admin-heading">
        <div>
          <span className="section-kicker">ADMINISTRACIÓN</span>
          <h1>Información del comercio</h1>
          <p>Estos datos se muestran en las secciones Nosotros y Contacto del sitio.</p>
        </div>
      </div>

      <AdminNotice notice={notice} onClose={clearNotice} />

      {loadError ? (
        <div className="empty-state" role="alert">
          <span aria-hidden="true">⚠️</span>
          <h3>No pudimos cargar la información del comercio</h3>
          <p>{loadError}</p>
          <button type="button" className="primary-button empty-button" onClick={retry}>Reintentar</button>
        </div>
      ) : loading ? (
        <div className="admin-skeleton" role="status" aria-label="Cargando información del comercio">
          <div /><div /><div /><div />
        </div>
      ) : (
        <section className="profile-card">
          {notCreated && <p className="admin-hint">Todavía no cargaste la información del comercio.</p>}

          <form className="admin-form" onSubmit={(event) => void submit(event)} noValidate>
            {formError && <div className="auth-alert auth-alert-error" role="alert">{formError}</div>}

            <div className={fieldClass('name')}>
              <label htmlFor="bi-name">Nombre del comercio *</label>
              <input id="bi-name" value={form.name} onChange={(event) => setField('name', event.target.value)} aria-invalid={Boolean(errors.name)} />
              {errors.name && <span className="admin-error">{errors.name}</span>}
            </div>

            <div className="admin-form-row admin-form-row-2">
              <div className={fieldClass('address')}>
                <label htmlFor="bi-address">Dirección *</label>
                <input id="bi-address" value={form.address} onChange={(event) => setField('address', event.target.value)} aria-invalid={Boolean(errors.address)} />
                {errors.address && <span className="admin-error">{errors.address}</span>}
              </div>
              <div className={fieldClass('phone')}>
                <label htmlFor="bi-phone">Teléfono *</label>
                <input id="bi-phone" type="tel" value={form.phone} onChange={(event) => setField('phone', event.target.value)} aria-invalid={Boolean(errors.phone)} />
                {errors.phone && <span className="admin-error">{errors.phone}</span>}
              </div>
            </div>

            <div className={fieldClass('description')}>
              <label htmlFor="bi-description">Descripción *</label>
              <textarea id="bi-description" rows={4} value={form.description} onChange={(event) => setField('description', event.target.value)} aria-invalid={Boolean(errors.description)} />
              {errors.description && <span className="admin-error">{errors.description}</span>}
            </div>

            <div className={fieldClass('openingHours')}>
              <label htmlFor="bi-hours">Horarios de atención</label>
              <textarea id="bi-hours" rows={3} value={form.openingHours} onChange={(event) => setField('openingHours', event.target.value)} aria-invalid={Boolean(errors.openingHours)} />
              {errors.openingHours
                ? <span className="admin-error">{errors.openingHours}</span>
                : <span className="admin-hint">Uno por línea, por ejemplo: Lunes a viernes de 10 a 20 hs</span>}
            </div>

            <div className={fieldClass('socialNetworks')}>
              <label htmlFor="bi-social">Redes sociales</label>
              <textarea id="bi-social" rows={3} value={form.socialNetworks} onChange={(event) => setField('socialNetworks', event.target.value)} aria-invalid={Boolean(errors.socialNetworks)} />
              {errors.socialNetworks
                ? <span className="admin-error">{errors.socialNetworks}</span>
                : <span className="admin-hint">Una URL por línea (Instagram, Facebook, WhatsApp...)</span>}
            </div>

            <div className="admin-form-actions">
              <button type="submit" className="admin-primary" disabled={saving}>
                {saving ? 'Guardando...' : 'Guardar cambios'}
              </button>
            </div>
          </form>
        </section>
      )}
    </>
  )
}
