import { useEffect } from 'react'
import type { ReactElement } from 'react'
import { BrowserRouter, Link, NavLink, Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { useAuth } from './context/auth-context'
import AdminLayout from './components/AdminLayout'
import { LoginPage, RegisterPage, ForgotPasswordPage, ResetPasswordPage } from './pages/AuthPages'
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
import './App.css'

// Marca: una "T" trazada como pista de circuito, sobre un chip con la esquina cortada del sitio.
function LogoMark() {
  return (
    <svg className="logo-symbol" viewBox="0 0 32 32" aria-hidden="true">
      <path className="logo-chip" d="M0 0H24L32 8V32H0Z" />
      <path className="logo-trace" d="M7 10H23M15 10V17.5L20.5 23" />
      <circle className="logo-pad" cx="21.5" cy="24" r="3.25" />
    </svg>
  )
}

function ScrollToSection() {
  const location = useLocation()
  useEffect(() => {
    if (!location.hash) { window.scrollTo(0, 0); return }
    const target = document.getElementById(decodeURIComponent(location.hash.slice(1)))
    target?.scrollIntoView({ behavior: 'smooth' })
  }, [location.pathname, location.hash])
  return null
}

function Layout() {
  const { user, checkingSession, signOut } = useAuth()
  const navigate = useNavigate()

  async function leave() {
    await signOut()
    navigate('/')
  }

  // Las únicas cuentas son las de los administradores del comercio:
  // estar logueado alcanza para entrar al área privada.
  function privateRoute(page: ReactElement) {
    if (checkingSession) return <main className="profile-loading" role="status">Verificando tu sesión...</main>
    return user ? page : <Navigate to="/login" replace />
  }

  return (
    <div className="app">
      <ScrollToSection />
      <header className="header">
        <Link className="logo" to="/" aria-label="TechStore, ir al inicio">
          <LogoMark /> TechStore
        </Link>
        <nav className="nav" aria-label="Navegación principal">
          <NavLink to="/" end>Inicio</NavLink>
          <NavLink to="/catalogo">Catálogo</NavLink>
          <NavLink to="/nosotros">Nosotros</NavLink>
          <NavLink to="/contacto">Contacto</NavLink>
        </nav>
        {user && (
          <div className="user-actions">
            <span className="user-greeting">Hola, {user.fullName.split(' ')[0]}</span>
            <Link className="profile-nav-link" to="/admin">Panel</Link>
            <Link className="profile-nav-link" to="/perfil">Mi perfil</Link>
            <button className="login-button" type="button" onClick={() => void leave()}>Cerrar sesión</button>
          </div>
        )}
      </header>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/catalogo" element={<CatalogPage />} />
        <Route path="/productos/:id" element={<ProductDetailPage />} />
        <Route path="/nosotros" element={<BusinessInfoPage />} />
        <Route path="/contacto" element={<ContactPage />} />
        <Route path="/perfil" element={privateRoute(<ProfilePage />)} />
        <Route path="/admin" element={privateRoute(<AdminLayout />)}>
          <Route index element={<Navigate to="resumen" replace />} />
          <Route path="resumen" element={<AdminDashboardPage />} />
          <Route path="productos" element={<AdminProductsPage />} />
          <Route path="categorias" element={<AdminCategoriesPage />} />
          <Route path="consultas" element={<AdminEnquiriesPage />} />
          <Route path="comercio" element={<AdminBusinessInfoPage />} />
        </Route>
        <Route path="/login" element={user ? <Navigate to="/admin" replace /> : <LoginPage />} />
        <Route path="/registro" element={user ? <Navigate to="/admin" replace /> : <RegisterPage />} />
        <Route path="/recuperar-contrasena" element={<ForgotPasswordPage />} />
        <Route path="/restablecer-contrasena" element={<ResetPasswordPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <footer className="footer">
        <Link to="/" className="footer-logo"><LogoMark /> TechStore</Link>
        <p>© 2026 TechStore. Todos los derechos reservados.</p>
        <div className="footer-links">
          <Link to="/nosotros">Nosotros</Link>
          <Link to="/contacto">Contacto</Link>
          <Link to={user ? '/admin' : '/login'}>Administración</Link>
        </div>
      </footer>
    </div>
  )
}

function App() {
  return <BrowserRouter><AuthProvider><Layout /></AuthProvider></BrowserRouter>
}

export default App
