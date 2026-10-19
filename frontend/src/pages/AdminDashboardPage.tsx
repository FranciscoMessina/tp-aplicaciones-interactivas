import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/auth-context'
import { getErrorMessage } from '../services/api'
import { fetchDashboardStats } from '../services/stats'
import type { DashboardStats } from '../services/stats'

interface Bar {
  key: string
  label: string
  count: number
  max: number
  fillClass?: string
}

function percentOf(value: number, max: number) {
  return max > 0 ? Math.round((value / max) * 100) : 0
}

function BarList({ bars }: { bars: Bar[] }) {
  return (
    <ul className="dashboard-bars">
      {bars.map((bar) => (
        <li key={bar.key}>
          <span className="dashboard-bar-label">{bar.label}</span>
          <span className="dashboard-bar-track">
            <span className={`dashboard-bar-fill${bar.fillClass ? ` ${bar.fillClass}` : ''}`} style={{ width: `${percentOf(bar.count, bar.max)}%` }} />
          </span>
          <span className="dashboard-bar-value">{bar.count}</span>
        </li>
      ))}
    </ul>
  )
}

function DashboardBody({ stats }: { stats: DashboardStats }) {
  const { products, enquiries, productsByCategory } = stats
  const maxCategory = Math.max(0, ...productsByCategory.map((category) => category.count))

  const tiles = [
    { label: 'Productos publicados', value: products.active, hint: `de ${products.total} en total` },
    { label: 'Sin stock', value: products.outOfStock, hint: 'publicados sin unidades' },
    { label: 'Destacados', value: products.featured, hint: 'se muestran en el inicio' },
    { label: 'Consultas pendientes', value: enquiries.PENDING, hint: `de ${enquiries.total} recibidas`, warning: enquiries.PENDING > 0 },
  ]

  const categoryBars: Bar[] = productsByCategory.map((category) => ({ key: category.name, label: category.name, count: category.count, max: maxCategory }))

  const enquiryBars: Bar[] = [
    { key: 'PENDING', label: 'Pendientes', count: enquiries.PENDING, max: enquiries.total, fillClass: 'status-pending' },
    { key: 'READ', label: 'Leídas', count: enquiries.READ, max: enquiries.total, fillClass: 'status-read' },
    { key: 'RESOLVED', label: 'Respondidas', count: enquiries.RESOLVED, max: enquiries.total, fillClass: 'status-resolved' },
  ]

  return (
    <>
      <div className="dashboard-tiles">
        {tiles.map((tile) => (
          <div key={tile.label} className={`dashboard-tile${tile.warning ? ' is-warning' : ''}`}>
            <span className="dashboard-tile-label">{tile.label}</span>
            <strong className="dashboard-tile-value">{tile.value}</strong>
            {tile.hint && <span className="dashboard-tile-hint">{tile.hint}</span>}
          </div>
        ))}
      </div>

      <div className="dashboard-panels">
        <section className="dashboard-panel">
          <h2>Productos por categoría</h2>
          {productsByCategory.length === 0 ? (
            <p className="admin-hint">Todavía no hay productos publicados en ninguna categoría.</p>
          ) : (
            <BarList bars={categoryBars} />
          )}
        </section>

        <section className="dashboard-panel">
          <h2>Estado de las consultas</h2>
          <BarList bars={enquiryBars} />
          <Link to="/admin/consultas" className="admin-secondary">Ver consultas →</Link>
        </section>
      </div>
    </>
  )
}

export default function AdminDashboardPage() {
  const { accessToken } = useAuth()
  const token = accessToken ?? ''

  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [reload, setReload] = useState(0)

  useEffect(() => {
    if (!token) return
    const controller = new AbortController()
    fetchDashboardStats(token, controller.signal)
      .then(setStats)
      .catch((error: unknown) => { if (!controller.signal.aborted) setLoadError(getErrorMessage(error)) })
      .finally(() => { if (!controller.signal.aborted) setLoading(false) })
    return () => controller.abort()
  }, [token, reload])

  function reloadStats() {
    setLoading(true)
    setLoadError('')
    setReload((value) => value + 1)
  }

  return (
    <>
      <div className="admin-heading">
        <div>
          <span className="section-kicker">ADMINISTRACIÓN</span>
          <h1>Resumen</h1>
          <p>Un vistazo rápido al catálogo y a las consultas.</p>
        </div>
      </div>

      {loadError ? (
        <div className="empty-state" role="alert">
          <span aria-hidden="true">⚠️</span>
          <h3>No pudimos cargar el resumen</h3>
          <p>{loadError}</p>
          <button type="button" className="primary-button empty-button" onClick={reloadStats}>Reintentar</button>
        </div>
      ) : loading || !stats ? (
        <div className="admin-skeleton" role="status" aria-label="Cargando resumen">
          {Array.from({ length: 4 }, (_, index) => <div key={index} />)}
        </div>
      ) : (
        <DashboardBody stats={stats} />
      )}
    </>
  )
}
