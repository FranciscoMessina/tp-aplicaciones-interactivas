import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { fetchProducts } from '../services/products'
import type { Product } from '../types/product'

const PRODUCTS_PER_PAGE = 12

const formatPrice = (price: number) =>
  new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0,
  }).format(price)

function ProductImage({ product }: { product: Product }) {
  const [imageFailed, setImageFailed] = useState(false)
  const imageUrl = product.images?.[0]

  return (
    <div className="product-image">
      {imageUrl && !imageFailed ? (
        <img
          src={imageUrl}
          alt={product.name}
          loading="lazy"
          onError={() => setImageFailed(true)}
        />
      ) : (
        <span className="image-placeholder" role="img" aria-label="Sin imagen disponible">💻</span>
      )}
    </div>
  )
}

function HomePage() {
  const [products, setProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [retryCount, setRetryCount] = useState(0)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('Todas')
  const [onlyAvailable, setOnlyAvailable] = useState(false)
  const [sortBy, setSortBy] = useState('recent')
  const [currentPage, setCurrentPage] = useState(1)

  useEffect(() => {
    const controller = new AbortController()

    async function loadProducts() {
      setIsLoading(true)
      setError('')
      try {
        const result = await fetchProducts(controller.signal)
        if (!controller.signal.aborted) setProducts(result)
      } catch (cause) {
        if (!controller.signal.aborted) {
          setError(cause instanceof Error ? cause.message : 'No se pudieron cargar los productos.')
        }
      } finally {
        if (!controller.signal.aborted) setIsLoading(false)
      }
    }

    void loadProducts()
    return () => controller.abort()
  }, [retryCount])

  const categories = useMemo(
    () => ['Todas', ...Array.from(new Set(products.map((product) => product.category?.name).filter(Boolean))).sort((a, b) => a.localeCompare(b, 'es-AR'))],
    [products],
  )

  const visibleProducts = useMemo(() => {
    const normalizedSearch = search.trim().toLocaleLowerCase('es-AR')

    return products
      .filter((product) => {
        const matchesSearch =
          product.name.toLocaleLowerCase('es-AR').includes(normalizedSearch) ||
          product.description.toLocaleLowerCase('es-AR').includes(normalizedSearch)
        const matchesCategory = category === 'Todas' || product.category?.name === category
        const matchesStock = !onlyAvailable || product.availableQuantity > 0

        return matchesSearch && matchesCategory && matchesStock
      })
      .sort((first, second) => {
        if (sortBy === 'price-asc') return first.price - second.price
        if (sortBy === 'price-desc') return second.price - first.price
        if (sortBy === 'name') return first.name.localeCompare(second.name, 'es-AR')
        return new Date(second.createdAt).getTime() - new Date(first.createdAt).getTime()
      })
  }, [products, search, category, onlyAvailable, sortBy])

  const totalPages = Math.ceil(visibleProducts.length / PRODUCTS_PER_PAGE)
  const paginatedProducts = visibleProducts.slice(
    (currentPage - 1) * PRODUCTS_PER_PAGE,
    currentPage * PRODUCTS_PER_PAGE,
  )

  const changeFilters = (callback: () => void) => {
    callback()
    setCurrentPage(1)
  }

  const clearFilters = () => {
    setSearch('')
    setCategory('Todas')
    setOnlyAvailable(false)
    setSortBy('recent')
    setCurrentPage(1)
  }

  return (
    <div id="inicio">
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
                onChange={(event) => changeFilters(() => setSearch(event.target.value))}
              />
            </div>

            <div className="field">
              <label htmlFor="category-filter">Categoría</label>
              <select
                id="category-filter"
                value={category}
                onChange={(event) => changeFilters(() => setCategory(event.target.value))}
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
                onChange={(event) => changeFilters(() => setSortBy(event.target.value))}
              >
                <option value="recent">Más recientes</option>
                <option value="price-asc">Menor precio</option>
                <option value="price-desc">Mayor precio</option>
                <option value="name">Nombre (A-Z)</option>
              </select>
            </div>

            <label className="stock-filter">
              <input
                type="checkbox"
                checked={onlyAvailable}
                onChange={(event) => changeFilters(() => setOnlyAvailable(event.target.checked))}
              />
              Solo disponibles
            </label>
          </div>

          <div className="catalog-toolbar">
            <p aria-live="polite">
              {isLoading ? 'Cargando productos...' : `${visibleProducts.length} ${visibleProducts.length === 1 ? 'producto encontrado' : 'productos encontrados'}`}
            </p>
            <button type="button" className="clear-button" onClick={clearFilters}>
              Limpiar filtros
            </button>
          </div>

          {isLoading ? (
            <div className="empty-state" role="status">Cargando catálogo desde MongoDB...</div>
          ) : error ? (
            <div className="empty-state" role="alert">
              <span aria-hidden="true">⚠️</span>
              <h3>No pudimos cargar el catálogo</h3>
              <p>{error} Verificá que el backend esté funcionando en el puerto 8080.</p>
              <button type="button" className="primary-button empty-button" onClick={() => setRetryCount((previous) => previous + 1)}>
                Reintentar
              </button>
            </div>
          ) : paginatedProducts.length > 0 ? (
            <>
              <div className="products-grid">
                {paginatedProducts.map((product) => (
                  <article className="product-card" key={product.id}>
                    <ProductImage product={product} />
                    <div className="product-info">
                      <span className="product-category">{product.category?.name ?? 'Sin categoría'}</span>
                      <h3>{product.name}</h3>
                      <p className="product-description">{product.description}</p>
                      <p className="product-price">{formatPrice(product.price)}</p>
                      <span className={product.availableQuantity > 0 ? 'product-available' : 'product-unavailable'}>
                        {product.availableQuantity > 0 ? 'Disponible' : 'Sin stock'}
                      </span>
                    </div>
                  </article>
                ))}
              </div>
              {totalPages > 1 && (
                <div className="pagination" aria-label="Paginación de productos">
                  <button type="button" disabled={currentPage === 1} onClick={() => setCurrentPage((page) => page - 1)}>Anterior</button>
                  <span>Página {currentPage} de {totalPages}</span>
                  <button type="button" disabled={currentPage === totalPages} onClick={() => setCurrentPage((page) => page + 1)}>Siguiente</button>
                </div>
              )}
            </>
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
            <p>Escribinos y contanos qué necesitás. Podés enviar una consulta sin iniciar sesión.</p>
            <Link className="contact-cta" to="/contacto">Enviar consulta →</Link>
          </div>
          <span className="contact-icon" aria-hidden="true">✉</span>
        </section>
      </main>

    </div>
  )
}

export default HomePage
