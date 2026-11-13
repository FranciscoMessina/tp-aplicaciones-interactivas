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

// Cuenta desde 0 hasta el valor; con "menos movimiento" muestra el número final directamente.
function CountUp({ value }: { value: number }) {
  const [shown, setShown] = useState(0)
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

  useEffect(() => {
    if (reduceMotion) return
    const duration = 900
    const start = performance.now()
    let frame = requestAnimationFrame(function tick(now) {
      const progress = Math.min((now - start) / duration, 1)
      setShown(Math.round(value * (1 - (1 - progress) ** 3)))
      if (progress < 1) frame = requestAnimationFrame(tick)
    })
    return () => cancelAnimationFrame(frame)
  }, [value, reduceMotion])

  return <>{reduceMotion ? value : shown}</>
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

// Las fechas vienen como AAAA-MM-DD; se leen al mediodía UTC para que no cambien de día.
const shortDay = new Intl.DateTimeFormat('es-AR', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' })
const formatShortDay = (day: string) => shortDay.format(new Date(`${day}T12:00:00Z`))

// Una columna por día. Al pasar el puntero se lee el valor de ese día; sin puntero, el de hoy.
function VisitsChart({ days }: { days: DashboardStats['views']['byDay'] }) {
  const [active, setActive] = useState<number | null>(null)
  const max = Math.max(1, ...days.map((day) => day.count))
  const shown = days[active ?? days.length - 1]

  return (
    <>
      <p className="dashboard-chart-readout" aria-hidden="true">
        <strong>{shown.count}</strong> {shown.count === 1 ? 'visita' : 'visitas'} · {active === null ? 'hoy' : formatShortDay(shown.day)}
      </p>
      <div className="dashboard-chart" aria-hidden="true" onPointerLeave={() => setActive(null)}>
        {days.map((day, index) => (
          <span key={day.day} className={`dashboard-chart-column${index === active ? ' is-active' : ''}`} onPointerEnter={() => setActive(index)}>
            <span style={{ height: `${percentOf(day.count, max)}%` }} />
          </span>
        ))}
      </div>
      <div className="dashboard-chart-axis" aria-hidden="true">
        <span>{formatShortDay(days[0].day)}</span>
        <span>Hoy</span>
      </div>
      <table className="visually-hidden">
        <caption>Visitas a las fichas de productos por día</caption>
        <thead><tr><th scope="col">Día</th><th scope="col">Visitas</th></tr></thead>
        <tbody>
          {days.map((day) => <tr key={day.day}><td>{formatShortDay(day.day)}</td><td>{day.count}</td></tr>)}
        </tbody>
      </table>
    </>
  )
}

// Variación contra los 30 días anteriores, redondeada a un porcentaje entero.
function changeHint(current: number, previous: number) {
  if (previous === 0) return 'sin visitas en los 30 días anteriores'
  const change = Math.round(((current - previous) / previous) * 100)
  if (change === 0) return 'igual que los 30 días anteriores'
  return `${change > 0 ? '+' : ''}${change}% vs. los 30 días anteriores`
}

function DashboardBody({ stats }: { stats: DashboardStats }) {
  const { products, enquiries, views } = stats

  // Cada número lleva al listado ya filtrado con lo que cuenta.
  const tiles = [
    { label: 'Visitas en 30 días', value: views.lastPeriod, hint: changeHint(views.lastPeriod, views.previousPeriod), to: '#visitas-titulo' },
    { label: 'Productos publicados', value: products.active, hint: `de ${products.total} en total`, to: '/admin/productos?estado=publicado' },
    { label: 'Sin stock', value: products.outOfStock, hint: 'publicados sin unidades', to: '/admin/productos?estado=publicado&stock=sin-stock' },
    { label: 'Consultas pendientes', value: enquiries.PENDING, hint: `de ${enquiries.total} recibidas`, to: '/admin/consultas?estado=pendiente', attention: enquiries.PENDING > 0 },
  ]

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
            <strong className="dashboard-stat-value"><CountUp value={tile.value} /></strong>
            <span className="dashboard-stat-hint">{tile.hint}</span>
          </Link>
        ))}
      </div>

      <div className="dashboard-panels">
        <section className="admin-panel is-wide" aria-labelledby="visitas-titulo">
          <header className="admin-panel-header">
            <div>
              <h2 id="visitas-titulo">Visitas por día</h2>
              <p>Cuántas veces se abrió la ficha de un producto en los últimos 30 días.</p>
            </div>
          </header>
          <div className="admin-panel-body">
            {views.lastPeriod === 0
              ? <p className="admin-hint">Todavía nadie abrió la ficha de un producto en los últimos 30 días.</p>
              : <VisitsChart days={views.byDay} />}
          </div>
        </section>

        <section className="admin-panel">
          <header className="admin-panel-header">
            <div>
              <h2>Lo más visto</h2>
              <p>Los productos con más visitas en los últimos 30 días.</p>
            </div>
          </header>
          <div className="admin-panel-body">
            {views.topProducts.length === 0 ? (
              <p className="admin-hint">Cuando los visitantes abran las fichas, acá vas a ver las más vistas.</p>
            ) : (
              <ol className="dashboard-ranking">
                {views.topProducts.map((product) => (
                  <li key={product.id}>
                    {product.image ? <img src={product.image} alt="" loading="lazy" /> : <span className="admin-thumb-placeholder" aria-hidden="true" />}
                    <Link to={`/productos/${product.id}`} className="dashboard-ranking-name">{product.name}</Link>
                    <span className="dashboard-bar-value">{product.count}<span className="visually-hidden"> {product.count === 1 ? 'visita' : 'visitas'}</span></span>
                  </li>
                ))}
              </ol>
            )}
          </div>
        </section>

        <section className="admin-panel">
          <header className="admin-panel-header">
            <div>
              <h2>Estado de las consultas</h2>
              <p>{enquiries.lastPeriod} {enquiries.lastPeriod === 1 ? 'recibida' : 'recibidas'} en los últimos 30 días.</p>
            </div>
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
          <p>Un vistazo rápido a las visitas, el catálogo y las consultas.</p>
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
