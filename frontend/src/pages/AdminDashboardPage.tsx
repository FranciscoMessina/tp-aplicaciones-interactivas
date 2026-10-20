import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import AdminEmpty from '../components/AdminEmpty'
import { useAuth } from '../context/auth-context'
import { getErrorMessage } from '../services/api'
import { fetchDashboardStats } from '../services/stats'
import type { DashboardStats } from '../services/stats'

interface Bar {
  key: string
  label: string
  count: number
  max: number
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
            <span className="dashboard-bar-fill" style={{ width: `${percentOf(bar.count, bar.max)}%` }} />
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

  // Cada número lleva al listado ya filtrado con lo que cuenta.
  const tiles = [
    { label: 'Productos publicados', value: products.active, hint: `de ${products.total} en total`, to: '/admin/productos?estado=publicado' },
    { label: 'Sin stock', value: products.outOfStock, hint: 'publicados sin unidades', to: '/admin/productos?estado=publicado&stock=sin-stock' },
    { label: 'Destacados', value: products.featured, hint: 'se muestran en el inicio', to: '/admin/productos?estado=publicado&destacados=si' },
    { label: 'Consultas pendientes', value: enquiries.PENDING, hint: `de ${enquiries.total} recibidas`, to: '/admin/consultas?estado=pendiente', attention: enquiries.PENDING > 0 },
  ]

  const categoryBars: Bar[] = productsByCategory.map((category) => ({ key: category.name, label: category.name, count: category.count, max: maxCategory }))

  const enquiryBars: Bar[] = [
    { key: 'PENDING', label: 'Pendientes', count: enquiries.PENDING, max: enquiries.total },
    { key: 'READ', label: 'Leídas', count: enquiries.READ, max: enquiries.total },
    { key: 'RESOLVED', label: 'Respondidas', count: enquiries.RESOLVED, max: enquiries.total },
  ]

  return (
    <>
      <div className="dashboard-stats">
        {tiles.map((tile) => (
          <Link key={tile.label} to={tile.to} className={`dashboard-stat${tile.attention ? ' is-attention' : ''}`}>
            <span className="dashboard-stat-label">{tile.label}</span>
            <strong className="dashboard-stat-value">{tile.value}</strong>
            <span className="dashboard-stat-hint">{tile.hint}</span>
          </Link>
        ))}
      </div>

      <div className="dashboard-panels">
        <section className="admin-panel">
          <header className="admin-panel-header">
            <h2>Productos por categoría</h2>
            <Link to="/admin/categorias" className="admin-text-link">Categorías</Link>
          </header>
          <div className="admin-panel-body">
            {productsByCategory.length === 0
              ? <p className="admin-hint">Todavía no hay productos publicados en ninguna categoría.</p>
              : <BarList bars={categoryBars} />}
          </div>
        </section>

        <section className="admin-panel">
          <header className="admin-panel-header">
            <h2>Estado de las consultas</h2>
            <Link to="/admin/consultas" className="admin-text-link">Ver consultas</Link>
          </header>
          <div className="admin-panel-body">
            <BarList bars={enquiryBars} />
          </div>
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
          <h1>Resumen</h1>
          <p>Un vistazo rápido al catálogo y a las consultas.</p>
        </div>
      </div>

      {loadError ? (
        <AdminEmpty icon="alert" title="No pudimos cargar el resumen" isError action={<button type="button" className="admin-secondary" onClick={reloadStats}>Reintentar</button>}>
          {loadError}
        </AdminEmpty>
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
