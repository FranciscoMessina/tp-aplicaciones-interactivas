import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { ApiRequestError, getErrorMessage } from '../services/api'
import { fetchBusinessInfo } from '../services/businessInfo'
import { sendEnquiry } from '../services/enquiries'
import type { BusinessInfo } from '../types/business'

export default function ContactPage() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [searchParams] = useSearchParams()
  const [subject, setSubject] = useState(searchParams.get('asunto') ?? '')
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [info, setInfo] = useState<BusinessInfo | null>(null)
  const [infoNote, setInfoNote] = useState('')

  useEffect(() => {
    const controller = new AbortController()
    void fetchBusinessInfo(controller.signal)
      .then((result) => { if (!controller.signal.aborted) setInfo(result) })
      .catch((cause: unknown) => {
        if (controller.signal.aborted) return
        if (cause instanceof ApiRequestError && cause.status === 404) {
          setInfoNote('Los datos institucionales todavía no están cargados.')
        } else {
          setInfoNote('No se pudieron consultar los datos del comercio.')
        }
      })
    return () => controller.abort()
  }, [])

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (sending) return
    setError('')
    setSuccess(false)

    const data = {
      name: name.trim(),
      email: email.trim(),
      ...(phone.trim() ? { phone: phone.trim() } : {}),
      subject: subject.trim(),
      message: message.trim(),
    }

    if (!data.name || !data.email || !data.subject || !data.message) {
      setError('Completá los campos obligatorios.')
      return
    }

    setSending(true)
    try {
      await sendEnquiry(data)
      setSuccess(true)
      setSubject('')
      setMessage('')
    } catch (cause) {
      setError(getErrorMessage(cause))
    } finally {
      setSending(false)
    }
  }

  return (
    <main className="information-page">
      <div className="information-container">
        <div className="information-heading">
          <h1>Contacto</h1>
          <p>Preguntanos por stock, precios o un equipo que no encontrás en el catálogo. Te respondemos por email.</p>
        </div>

        <div className="contact-layout">
          <section className="contact-form-card" aria-labelledby="contact-form-title">
            <h2 id="contact-form-title">Tu consulta</h2>
            <p className="contact-form-description">Los campos marcados con * son obligatorios.</p>

            {success && (
              <div className="contact-alert contact-success" role="status">
                <strong>Consulta enviada.</strong> Te vamos a responder a {email.trim()}.
              </div>
            )}
            {error && <div className="contact-alert contact-error" role="alert">{error}</div>}

            <form className="contact-form" onSubmit={(event) => void submit(event)}>
              <div className="contact-form-row">
                <label className="auth-field">Nombre y apellido *
                  <input required maxLength={120} autoComplete="name" value={name} onChange={(event) => setName(event.target.value)} placeholder="Tu nombre" />
                </label>
                <label className="auth-field">Email *
                  <input required type="email" maxLength={254} autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="nombre@ejemplo.com" />
                </label>
              </div>
              <label className="auth-field">Teléfono (opcional)
                <input type="tel" maxLength={40} autoComplete="tel" value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="Ej.: +54 11 4444-4444" />
              </label>
              <label className="auth-field">Asunto *
                <input required maxLength={150} value={subject} onChange={(event) => setSubject(event.target.value)} placeholder="¿Sobre qué querés consultar?" />
              </label>
              <label className="auth-field">Mensaje *
                <textarea required minLength={1} maxLength={3000} rows={6} value={message} onChange={(event) => setMessage(event.target.value)} placeholder="Escribí tu consulta..." />
              </label>
              <button className="primary-button" type="submit" disabled={sending}>
                {sending ? 'Enviando...' : 'Enviar consulta'}
              </button>
            </form>
          </section>

          <aside className="contact-aside" aria-label="Datos de contacto del negocio">
            <h2>Datos del comercio</h2>
            {info ? (
              <>
                <h3>{info.name}</h3>
                <p>{info.description}</p>
                <div className="contact-aside-detail"><strong>Dirección</strong><span>{info.address}</span></div>
                <div className="contact-aside-detail"><strong>Teléfono</strong><a href={`tel:${info.phone.replace(/[^\d+]/g, '')}`}>{info.phone}</a></div>
                {info.openingHours.length > 0 && (
                  <div className="contact-aside-detail"><strong>Horarios</strong>{info.openingHours.map((hour, index) => <span key={`${index}-${hour}`}>{hour}</span>)}</div>
                )}
              </>
            ) : <p className="contact-aside-note">{infoNote || 'Cargando información...'}</p>}
            <Link to="/nosotros" className="contact-aside-link">Más sobre nosotros</Link>
          </aside>
        </div>
      </div>
    </main>
  )
}
