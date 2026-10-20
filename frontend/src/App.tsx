import { useEffect } from 'react'
import type { ReactElement } from 'react'
import { BrowserRouter, Link, NavLink, Navigate, Outlet, Route, Routes, useLocation } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { useAuth } from './context/auth-context'
import { BusinessProvider } from './context/BusinessContext'
import { useBusiness } from './context/business-context'
import AdminLayout from './components/AdminLayout'
import LogoMark from './components/LogoMark'
import { LoginPage, ForgotPasswordPage, ResetPasswordPage } from './pages/AuthPages'
import HomePage from './pages/HomePage'
import CatalogPage from './pages/CatalogPage'
import BusinessInfoPage from './pages/BusinessInfoPage'
import ContactPage from './pages/ContactPage'
import ProfilePage from './pages/ProfilePage'
import ProductDetailPage from './pages/ProductDetailPage'
import AdminDashboardPage from './pages/AdminDashboardPage'
import AdminProductsPage from './pages/AdminProductsPage'
import AdminCategoriesPage from './pages/AdminCategoriesPage'
import AdminEnquiriesPage from './pages/AdminEnquiriesPage'
import AdminBusinessInfoPage from './pages/AdminBusinessInfoPage'
import AdminUsersPage from './pages/AdminUsersPage'
import './App.css'

function ScrollToSection() {
  const location = useLocation()
  useEffect(() => {
    if (!location.hash) { window.scrollTo(0, 0); return }
    const target = document.getElementById(decodeURIComponent(location.hash.slice(1)))
    target?.scrollIntoView({ behavior: 'smooth' })
  }, [location.pathname, location.hash])
  return null
}

// Marco del sitio público: encabezado con la navegación y pie de página.
function PublicLayout() {
  const { user } = useAuth()
  const { businessName } = useBusiness()

  return (
    <div className="app">
      <header className="header">
        <Link className="logo" to="/" aria-label={`${businessName || 'Tienda'}, ir al inicio`}>
          <LogoMark /> {businessName}
        </Link>
        <nav className="nav" aria-label="Navegación principal">
          <NavLink to="/" end>Inicio</NavLink>
          <NavLink to="/catalogo">Catálogo</NavLink>
          <NavLink to="/nosotros">Nosotros</NavLink>
          <NavLink to="/contacto">Contacto</NavLink>
        </nav>
      </header>
      <Outlet />
      <footer className="footer">
        <Link to="/" className="footer-logo"><LogoMark /> {businessName}</Link>
        <p>© 2026{businessName && ` ${businessName}`}. Todos los derechos reservados.</p>
        <div className="footer-links">
          <Link to="/nosotros">Nosotros</Link>
          <Link to="/contacto">Contacto</Link>
          <Link to={user ? '/admin' : '/login'}>Administración</Link>
        </div>
      </footer>
    </div>
  )
}

function AppRoutes() {
  const { user, checkingSession } = useAuth()

  // Las únicas cuentas son las de los administradores del comercio:
  // estar logueado alcanza para entrar al área privada.
  function privateRoute(page: ReactElement) {
    if (checkingSession) return <main className="profile-loading" role="status">Verificando tu sesión...</main>
    return user ? page : <Navigate to="/login" replace />
  }

  return (
    <>
      <ScrollToSection />
      <Routes>
        <Route element={<PublicLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/catalogo" element={<CatalogPage />} />
          <Route path="/productos/:id" element={<ProductDetailPage />} />
          <Route path="/nosotros" element={<BusinessInfoPage />} />
          <Route path="/contacto" element={<ContactPage />} />
        </Route>
        <Route path="/login" element={user ? <Navigate to="/admin" replace /> : <LoginPage />} />
        <Route path="/recuperar-contrasena" element={<ForgotPasswordPage />} />
        <Route path="/restablecer-contrasena" element={<ResetPasswordPage />} />
        <Route path="/admin" element={privateRoute(<AdminLayout />)}>
          <Route index element={<Navigate to="resumen" replace />} />
          <Route path="resumen" element={<AdminDashboardPage />} />
          <Route path="productos" element={<AdminProductsPage />} />
          <Route path="categorias" element={<AdminCategoriesPage />} />
          <Route path="consultas" element={<AdminEnquiriesPage />} />
          <Route path="comercio" element={<AdminBusinessInfoPage />} />
          <Route path="usuarios" element={<AdminUsersPage />} />
          <Route path="perfil" element={<ProfilePage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  )
}

function App() {
  return <BrowserRouter><BusinessProvider><AuthProvider><AppRoutes /></AuthProvider></BusinessProvider></BrowserRouter>
}

export default App
