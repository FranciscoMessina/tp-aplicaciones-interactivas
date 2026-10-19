import { useEffect } from 'react'
import type { ReactElement } from 'react'
import { BrowserRouter, Link, Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { useAuth } from './context/auth-context'
import { LoginPage, RegisterPage, ForgotPasswordPage, ResetPasswordPage } from './pages/AuthPages'
import HomePage from './pages/HomePage'
import BusinessInfoPage from './pages/BusinessInfoPage'
import ContactPage from './pages/ContactPage'
import ProfilePage from './pages/ProfilePage'
import AdminProductsPage from './pages/AdminProductsPage'
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

function Layout() {
  const { user, checkingSession, signOut } = useAuth()
  const navigate = useNavigate()

  async function leave() {
    await signOut()
    navigate('/')
  }

  function profileRoute() {
    if (checkingSession) return <main className="profile-loading" role="status">Verificando tu sesión...</main>
    return user ? <ProfilePage /> : <Navigate to="/login" replace />
  }

  function adminRoute(page: ReactElement) {
    if (checkingSession) return <main className="profile-loading" role="status">Verificando tu sesión...</main>
    if (!user) return <Navigate to="/login" replace />
    return user.role === 'admin' ? page : <Navigate to="/" replace />
  }

  return (
    <div className="app">
      <ScrollToSection />
      <header className="header">
        <Link className="logo" to="/" aria-label="TechStore, ir al inicio">
          <span className="logo-symbol" aria-hidden="true">T</span> TechStore
        </Link>
        <nav className="nav" aria-label="Navegación principal">
          <Link to="/">Inicio</Link>
          <Link to="/#productos">Productos</Link>
          <Link to="/nosotros">Nosotros</Link>
          <Link to="/contacto">Contacto</Link>
        </nav>
        {user ? (
          <div className="user-actions">
            <span className="user-greeting">Hola, {user.fullName.split(' ')[0]}</span>
            {user.role === 'admin' && <Link className="profile-nav-link" to="/admin/productos">Administrar productos</Link>}
            <Link className="profile-nav-link" to="/perfil">Mi perfil</Link>
            <button className="login-button" type="button" onClick={() => void leave()}>Cerrar sesión</button>
          </div>
        ) : (
          <Link className="login-button" to="/login">{checkingSession ? 'Verificando...' : 'Iniciar sesión'}</Link>
        )}
      </header>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/nosotros" element={<BusinessInfoPage />} />
        <Route path="/contacto" element={<ContactPage />} />
        <Route path="/perfil" element={profileRoute()} />
        <Route path="/admin/productos" element={adminRoute(<AdminProductsPage />)} />
        <Route path="/login" element={user ? <Navigate to="/" replace /> : <LoginPage />} />
        <Route path="/registro" element={user ? <Navigate to="/" replace /> : <RegisterPage />} />
        <Route path="/recuperar-contrasena" element={<ForgotPasswordPage />} />
        <Route path="/restablecer-contrasena" element={<ResetPasswordPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <footer className="footer">
        <Link to="/" className="footer-logo">TechStore</Link>
        <p>© 2026 TechStore. Todos los derechos reservados.</p>
        <div className="footer-links">
          <Link to="/nosotros">Nosotros</Link>
          <Link to="/contacto">Contacto</Link>
          <Link to="/">Volver al inicio ↑</Link>
        </div>
      </footer>
    </div>
  )
}

function App() {
  return <BrowserRouter><AuthProvider><Layout /></AuthProvider></BrowserRouter>
}

export default App