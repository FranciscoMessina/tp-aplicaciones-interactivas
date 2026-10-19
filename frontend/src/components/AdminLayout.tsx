import { NavLink, Outlet } from 'react-router-dom'

const sections = [
  { to: 'resumen', label: 'Resumen' },
  { to: 'productos', label: 'Productos' },
  { to: 'categorias', label: 'Categorías' },
  { to: 'consultas', label: 'Consultas' },
  { to: 'comercio', label: 'Información del comercio' },
]

// Marco común de las pantallas del área privada: pestañas y contenido de la sección.
export default function AdminLayout() {
  return (
    <main className="admin-page">
      <div className="admin-container">
        <nav className="admin-tabs" aria-label="Secciones de administración">
          {sections.map((section) => (
            <NavLink key={section.to} to={section.to}>{section.label}</NavLink>
          ))}
        </nav>
        <Outlet />
      </div>
    </main>
  )
}
