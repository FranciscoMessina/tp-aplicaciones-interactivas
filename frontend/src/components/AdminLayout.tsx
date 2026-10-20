import { useCallback, useEffect, useState } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/auth-context'
import { useBusiness } from '../context/business-context'
import { fetchEnquiries } from '../services/enquiries'
import Icon from './Icon'
import type { IconName } from './Icon'
import LogoMark from './LogoMark'
import '../Admin.css'

// Lo que el marco comparte con las secciones: avisar que cambiaron las consultas pendientes.
export type AdminOutletContext = { refreshPending: () => void }

const groups: { label?: string; links: { to: string; label: string; icon: IconName }[] }[] = [
  { links: [{ to: 'resumen', label: 'Resumen', icon: 'summary' }] },
  { label: 'Catálogo', links: [{ to: 'productos', label: 'Productos', icon: 'products' }, { to: 'categorias', label: 'Categorías', icon: 'categories' }] },
  { label: 'Atención', links: [{ to: 'consultas', label: 'Consultas', icon: 'enquiries' }] },
  { label: 'Comercio', links: [{ to: 'comercio', label: 'Información del comercio', icon: 'business' }, { to: 'usuarios', label: 'Administradores', icon: 'users' }] },
]

// Marco propio del área privada: barra lateral con las secciones y la cuenta, y el contenido a la derecha.
export default function AdminLayout() {
  const { user, accessToken, signOut } = useAuth()
  const { businessName } = useBusiness()
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)
  const [pending, setPending] = useState(0)
  const [pendingCheck, setPendingCheck] = useState(0)

  const refreshPending = useCallback(() => setPendingCheck((value) => value + 1), [])

  useEffect(() => {
    if (!accessToken) return
    const controller = new AbortController()
    // Alcanza con una página de un elemento: el total viene en la respuesta.
    fetchEnquiries(accessToken, { status: 'PENDING', page: 1, pageSize: 1 }, controller.signal)
      .then((result) => setPending(result.total))
      .catch(() => { /* el contador es informativo; la sección de consultas avisa si falla */ })
    return () => controller.abort()
  }, [accessToken, pendingCheck, pathname])

  async function leave() {
    await signOut()
    navigate('/')
  }

  return (
    <div className={`admin-shell${menuOpen ? ' is-menu-open' : ''}`}>
      <aside className="admin-sidebar">
        <div className="admin-sidebar-top">
          <Link className="admin-brand" to="/admin" aria-label={`${businessName || 'Tienda'}, ir al resumen del panel`}>
            <LogoMark /> {businessName} <span>Panel</span>
          </Link>
          <button
            type="button"
            className="admin-menu-button"
            aria-expanded={menuOpen}
            aria-controls="admin-menu"
            aria-label={menuOpen ? 'Cerrar menú' : 'Abrir menú'}
            onClick={() => setMenuOpen((open) => !open)}
          >
            <Icon name={menuOpen ? 'close' : 'menu'} />
          </button>
        </div>

        {/* En pantallas chicas el menú se cierra al elegir una sección. */}
        <div id="admin-menu" className="admin-menu" onClick={(event) => { if ((event.target as HTMLElement).closest('a')) setMenuOpen(false) }}>
          <nav className="admin-nav" aria-label="Secciones de administración">
            {groups.map((group, index) => (
              <div key={group.label ?? index} className="admin-nav-group">
                {group.label && <p className="admin-nav-label">{group.label}</p>}
                {group.links.map((link) => (
                  <NavLink key={link.to} to={link.to}>
                    <Icon name={link.icon} />
                    <span>{link.label}</span>
                    {link.to === 'consultas' && pending > 0 && (
                      <span className="admin-nav-count" aria-label={`${pending} pendientes`}>{pending}</span>
                    )}
                  </NavLink>
                ))}
              </div>
            ))}
          </nav>

          <div className="admin-account">
            {user && (
              <NavLink to="perfil" className="admin-account-user">
                <span className="admin-avatar" aria-hidden="true">{user.fullName.charAt(0).toUpperCase()}</span>
                <span>
                  <strong>{user.fullName}</strong>
                  <small>Mi perfil</small>
                </span>
              </NavLink>
            )}
            <Link className="admin-account-link" to="/"><Icon name="external" /> Ver sitio</Link>
            <button type="button" className="admin-account-link" onClick={() => void leave()}><Icon name="logout" /> Cerrar sesión</button>
          </div>
        </div>
      </aside>

      <main className="admin-main">
        <div className="admin-container">
          <Outlet context={{ refreshPending } satisfies AdminOutletContext} />
        </div>
      </main>
    </div>
  )
}
