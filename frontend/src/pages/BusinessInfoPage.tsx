import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import BusinessDetails from '../components/BusinessDetails'
import { BusinessInfoError, fetchBusinessInfo } from '../services/businessInfo'
import type { BusinessInfo } from '../types/business'

export default function BusinessInfoPage() {
  const [info, setInfo] = useState<BusinessInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notConfigured, setNotConfigured] = useState(false)
  const [retry, setRetry] = useState(0)

  useEffect(() => {
    const controller = new AbortController()
    void (async () => {
      try {
        const data = await fetchBusinessInfo(controller.signal)
        if (!controller.signal.aborted) setInfo(data)
      } catch (cause) {
        if (!controller.signal.aborted) {
          const missing = cause instanceof BusinessInfoError && cause.status === 404
          setNotConfigured(missing)
          setError(missing
            ? 'La información institucional todavía no fue cargada por un administrador.'
            : cause instanceof Error ? cause.message : 'No se pudo cargar la información.')
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false)
      }
    })()
    return () => controller.abort()
  }, [retry])

  function reload() {
    setLoading(true)
    setError('')
    setNotConfigured(false)
    setRetry((previous) => previous + 1)
  }

  return (
    <main className="information-page">
      <div className="information-container">
        <div className="information-heading">
          <span className="section-kicker">CONOCÉ NUESTRA TIENDA</span>
          <h1>Sobre nosotros</h1>
          <p>Información institucional, ubicación y medios de contacto del comercio.</p>
        </div>

        {loading ? (
          <div className="information-message" role="status">Cargando información del comercio...</div>
        ) : error ? (
          <div className="information-message" role="alert">
            <h2>{notConfigured ? 'Información pendiente' : 'No pudimos cargar los datos'}</h2>
            <p>{error}</p>
            {!notConfigured && <button type="button" className="auth-submit information-retry" onClick={reload}>Reintentar</button>}
          </div>
        ) : info ? (
          <>
            <section className="business-intro">
              <span className="business-overline">NUESTRO COMERCIO</span>
              <h2>{info.name}</h2>
              <p>{info.description}</p>
            </section>
            <BusinessDetails info={info} />
          </>
        ) : null}

        <div className="information-bottom-cta">
          <div><h2>¿Tenés alguna pregunta?</h2><p>Mandanos tu consulta desde el formulario de contacto.</p></div>
          <Link className="primary-button" to="/contacto">Contactanos →</Link>
        </div>
      </div>
    </main>
  )
}
