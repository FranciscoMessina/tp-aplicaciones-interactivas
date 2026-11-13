import { Link, useLocation } from 'react-router-dom'

// Cualquier dirección que no existe en el sitio público.
export default function NotFoundPage() {
  const { pathname } = useLocation()

  return (
    <main className="information-page">
      <div className="information-container">
        <div className="not-found">
          <span className="part-number">Error 404 · {pathname}</span>
          <h1>Esta página no existe</h1>
          <p>Puede que el enlace esté mal escrito o que la página se haya movido. Buscá en el catálogo, o escribinos y te ayudamos a encontrar lo que necesitás.</p>
          <div className="information-actions">
            <Link className="primary-button" to="/catalogo">Ir al catálogo</Link>
            <Link className="section-link" to="/contacto">Escribinos</Link>
            <Link className="section-link" to="/">Volver al inicio</Link>
          </div>
        </div>
      </div>
    </main>
  )
}
