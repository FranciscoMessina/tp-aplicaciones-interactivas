import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import BusinessDetails from '../components/BusinessDetails'
import { ApiRequestError } from '../services/api'
import { fetchBusinessInfo } from '../services/businessInfo'
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
          const missing = cause instanceof ApiRequestError && cause.status === 404
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
          <h1>Sobre nosotros</h1>
          <p>Quiénes somos, dónde estamos y cómo hablar con nosotros.</p>
        </div>

        {loading ? (
          <div className="information-message" role="status">Cargando información del comercio...</div>
        ) : error ? (
          <div className="information-message" role="alert">
            <h2>{notConfigured ? 'Información pendiente' : 'No pudimos cargar los datos'}</h2>
            <p>{error}</p>
            {!notConfigured && <button type="button" className="primary-button information-retry" onClick={reload}>Reintentar</button>}
          </div>
        ) : info ? (
          <>
            <section className="business-intro">
              <h2>{info.name}</h2>
              <p>{info.description}</p>
            </section>
            <BusinessDetails info={info} />
          </>
        ) : null}

        <div className="information-bottom-cta">
          <div><h2>¿Tenés alguna pregunta?</h2><p>Escribinos desde el formulario de contacto y te respondemos.</p></div>
          <Link className="primary-button" to="/contacto">Enviar una consulta</Link>
        </div>
      </div>
    </main>
  )
}
