import { useMemo, useState } from 'react'
import { products } from './data/products'
import './App.css'

const formatPrice = (price: number) =>
  new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0,
  }).format(price)

function App() {
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('Todas')
  const [onlyAvailable, setOnlyAvailable] = useState(false)
  const [sortBy, setSortBy] = useState('featured')

  const categories = useMemo(
    () => ['Todas', ...Array.from(new Set(products.map((product) => product.category)))],
    [],
  )

  const visibleProducts = useMemo(() => {
    const normalizedSearch = search.trim().toLocaleLowerCase('es-AR')

    return products
      .filter((product) => {
        const matchesSearch =
          product.name.toLocaleLowerCase('es-AR').includes(normalizedSearch) ||
          product.description.toLocaleLowerCase('es-AR').includes(normalizedSearch)
        const matchesCategory = category === 'Todas' || product.category === category
        const matchesStock = !onlyAvailable || product.available

        return matchesSearch && matchesCategory && matchesStock
      })
      .sort((first, second) => {
        if (sortBy === 'price-asc') return first.price - second.price
        if (sortBy === 'price-desc') return second.price - first.price
        if (sortBy === 'name') return first.name.localeCompare(second.name, 'es-AR')
        return Number(Boolean(second.featured)) - Number(Boolean(first.featured))
      })
  }, [search, category, onlyAvailable, sortBy])

  const clearFilters = () => {
    setSearch('')
    setCategory('Todas')
    setOnlyAvailable(false)
    setSortBy('featured')
  }

  return (
    <div className="app" id="inicio">
      <header className="header">
        <a className="logo" href="#inicio" aria-label="TechStore, ir al inicio">
          <span className="logo-symbol" aria-hidden="true">T</span>
          TechStore
        </a>

        <nav className="nav" aria-label="Navegación principal">
          <a href="#inicio">Inicio</a>
          <a href="#productos">Productos</a>
          <a href="#contacto">Contacto</a>
        </nav>

        <button
          className="login-button"
          type="button"
          disabled
          title="Inicio de sesión disponible en una próxima etapa"
        >
          Iniciar sesión
        </button>
      </header>

      <main>
        <section className="welcome" aria-labelledby="welcome-title">
          <div className="welcome-content">
            <span className="eyebrow">TU TIENDA DE TECNOLOGÍA</span>
            <h1 id="welcome-title">La tecnología que necesitás, en un solo lugar.</h1>
            <p>
              Descubrí productos para trabajar, estudiar y disfrutar. Encontrá lo
              que buscás de forma simple y rápida.
            </p>
            <a className="primary-button" href="#productos">
              Explorar productos <span aria-hidden="true">→</span>
            </a>
          </div>
          <div className="welcome-art" aria-hidden="true">
            <div className="art-circle art-circle-one" />
            <div className="art-circle art-circle-two" />
            <div className="art-main">💻</div>
            <div className="art-small art-small-top">🎧</div>
            <div className="art-small art-small-bottom">⌨️</div>
          </div>
        </section>

        <section className="benefits" aria-label="Ventajas de comprar en TechStore">
          <div className="benefit"><span aria-hidden="true">✦</span><div><strong>Productos seleccionados</strong><p>Equipos y accesorios para vos.</p></div></div>
          <div className="benefit"><span aria-hidden="true">✓</span><div><strong>Catálogo simple</strong><p>Buscá y filtrá en segundos.</p></div></div>
          <div className="benefit"><span aria-hidden="true">⌁</span><div><strong>Atención cercana</strong><p>Estamos para ayudarte a elegir.</p></div></div>
        </section>

        <section id="productos" className="products-section" aria-labelledby="products-title">
          <div className="section-heading">
            <span className="section-kicker">CATÁLOGO</span>
            <h2 id="products-title">Nuestros productos</h2>
            <p>Explorá nuestra selección de tecnología.</p>
          </div>

          <div className="catalog-filters">
            <div className="field search-field">
              <label htmlFor="product-search">Buscar productos</label>
              <input
                id="product-search"
                type="search"
                placeholder="Ej.: notebook, auriculares..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </div>

            <div className="field">
              <label htmlFor="category-filter">Categoría</label>
              <select
                id="category-filter"
                value={category}
                onChange={(event) => setCategory(event.target.value)}
              >
                {categories.map((item) => (
                  <option key={item} value={item}>{item}</option>
                ))}
              </select>
            </div>

            <div className="field">
              <label htmlFor="sort-filter">Ordenar por</label>
              <select
                id="sort-filter"
                value={sortBy}
                onChange={(event) => setSortBy(event.target.value)}
              >
                <option value="featured">Destacados</option>
                <option value="price-asc">Menor precio</option>
                <option value="price-desc">Mayor precio</option>
                <option value="name">Nombre (A-Z)</option>
              </select>
            </div>

            <label className="stock-filter">
              <input
                type="checkbox"
                checked={onlyAvailable}
                onChange={(event) => setOnlyAvailable(event.target.checked)}
              />
              Solo disponibles
            </label>
          </div>

          <div className="catalog-toolbar">
            <p aria-live="polite">
              {visibleProducts.length} {visibleProducts.length === 1 ? 'producto encontrado' : 'productos encontrados'}
            </p>
            <button type="button" className="clear-button" onClick={clearFilters}>
              Limpiar filtros
            </button>
          </div>

          {visibleProducts.length > 0 ? (
            <div className="products-grid">
              {visibleProducts.map((product) => (
                <article className="product-card" key={product.id}>
                  <div className="product-image" aria-hidden="true">
                    <span>{product.icon}</span>
                  </div>
                  <div className="product-info">
                    <span className="product-category">{product.category}</span>
                    <h3>{product.name}</h3>
                    <p className="product-description">{product.description}</p>
                    <p className="product-price">{formatPrice(product.price)}</p>
                    <span className={product.available ? 'product-available' : 'product-unavailable'}>
                      {product.available ? 'Disponible' : 'Sin stock'}
                    </span>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <span aria-hidden="true">🔎</span>
              <h3>No encontramos productos</h3>
              <p>Probá con otra búsqueda o cambiá los filtros.</p>
              <button type="button" className="primary-button empty-button" onClick={clearFilters}>
                Ver todos los productos
              </button>
            </div>
          )}
        </section>

        <section id="contacto" className="contact-section" aria-labelledby="contact-title">
          <div>
            <span className="section-kicker">ESTAMOS PARA AYUDARTE</span>
            <h2 id="contact-title">¿Tenés alguna consulta?</h2>
            <p>Próximamente vas a poder enviarnos tus consultas desde nuestro formulario de contacto.</p>
          </div>
          <span className="contact-icon" aria-hidden="true">✉</span>
        </section>
      </main>

      <footer className="footer">
        <a href="#inicio" className="footer-logo">TechStore</a>
        <p>© 2026 TechStore. Todos los derechos reservados.</p>
        <a href="#inicio">Volver arriba ↑</a>
      </footer>
    </div>
  )
}

export default App
