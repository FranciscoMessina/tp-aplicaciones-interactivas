import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import ProductCard from '../components/ProductCard'
import { useRequest } from '../hooks/useRequest'
import { fetchCategorySummaries } from '../services/categories'
import { fetchProducts } from '../services/products'
import type { ProductFilters } from '../services/products'

const PRODUCTS_PER_PAGE = 12

// Cada opción del selector y cómo se la pide al backend.
const sortOptions: Record<string, { label: string; sortBy: ProductFilters['sortBy']; sortOrder: ProductFilters['sortOrder'] }> = {
  recent: { label: 'Más recientes', sortBy: 'publicationDate', sortOrder: 'desc' },
  'price-asc': { label: 'Menor precio', sortBy: 'price', sortOrder: 'asc' },
  'price-desc': { label: 'Mayor precio', sortBy: 'price', sortOrder: 'desc' },
  name: { label: 'Nombre (A-Z)', sortBy: 'name', sortOrder: 'asc' },
}

export default function CatalogPage() {
  // La categoría va en la URL para que los accesos del inicio lleguen ya filtrados.
  const [searchParams, setSearchParams] = useSearchParams()
  const category = searchParams.get('categoria') ?? ''
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [onlyAvailable, setOnlyAvailable] = useState(false)
  const [sortBy, setSortBy] = useState('recent')
  const [page, setPage] = useState(1)

  // Espera a que se deje de escribir para no consultar al backend en cada tecla.
  useEffect(() => {
    if (searchInput.trim() === search) return
    const timer = window.setTimeout(() => {
      setSearch(searchInput.trim())
      setPage(1)
    }, 350)
    return () => window.clearTimeout(timer)
  }, [searchInput, search])

  const categories = useRequest(fetchCategorySummaries, 'categories')
  const filters: ProductFilters = {
    search,
    category,
    inStock: onlyAvailable || undefined,
    ...sortOptions[sortBy],
    page,
    pageSize: PRODUCTS_PER_PAGE,
  }
  const products = useRequest((signal) => fetchProducts(filters, signal), JSON.stringify(filters))

  const total = products.data?.total ?? 0
  const totalPages = Math.ceil(total / PRODUCTS_PER_PAGE)
  const categoryName = categories.data?.find((item) => item.id === category)?.name

  const changeFilters = (callback: () => void) => {
    callback()
    setPage(1)
  }

  const setCategory = (id: string) => {
    setSearchParams(id ? { categoria: id } : {}, { replace: true })
  }

  const clearFilters = () => {
    setSearchInput('')
    setSearch('')
    setCategory('')
    setOnlyAvailable(false)
    setSortBy('recent')
    setPage(1)
  }

  return (
    <main className="information-page">
      <div className="information-container">
        <div className="information-heading">
          <h1>{categoryName ?? 'Catálogo'}</h1>
        </div>

        <div className="catalog-filters">
          <div className="field search-field">
            <label htmlFor="product-search">Buscar productos</label>
            <input
              id="product-search"
              type="search"
              placeholder="Ej.: notebook, auriculares..."
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
            />
          </div>

          <div className="field">
            <label htmlFor="category-filter">Categoría</label>
            <select
              id="category-filter"
              value={category}
              onChange={(event) => changeFilters(() => setCategory(event.target.value))}
            >
              <option value="">Todas</option>
              {categories.data?.map((item) => (
                <option key={item.id} value={item.id}>{item.name}</option>
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
              {Object.entries(sortOptions).map(([value, option]) => (
                <option key={value} value={value}>{option.label}</option>
              ))}
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
            {products.isLoading ? 'Cargando productos...' : `${total} ${total === 1 ? 'producto encontrado' : 'productos encontrados'}`}
          </p>
          <button type="button" className="clear-button" onClick={clearFilters}>
            Limpiar filtros
          </button>
        </div>

        {products.isLoading && !products.data ? (
          <div className="empty-state" role="status">Cargando catálogo...</div>
        ) : products.error ? (
          <div className="empty-state" role="alert">
            <h3>No pudimos cargar el catálogo</h3>
            <p>{products.error} Verificá que el backend esté funcionando en el puerto 8080.</p>
            <button type="button" className="primary-button empty-button" onClick={products.retry}>
              Reintentar
            </button>
          </div>
        ) : products.data && products.data.items.length > 0 ? (
          <>
            <div className="products-grid" aria-busy={products.isLoading}>
              {products.data.items.map((product) => <ProductCard key={product.id} product={product} />)}
            </div>
            {totalPages > 1 && (
              <div className="pagination" aria-label="Paginación de productos">
                <button type="button" disabled={page === 1 || products.isLoading} onClick={() => setPage(page - 1)}>Anterior</button>
                <span>Página {page} de {totalPages}</span>
                <button type="button" disabled={page >= totalPages || products.isLoading} onClick={() => setPage(page + 1)}>Siguiente</button>
              </div>
            )}
          </>
        ) : (
          <div className="empty-state">
            <h3>No encontramos productos</h3>
            <p>Probá con otra búsqueda o cambiá los filtros.</p>
            <button type="button" className="primary-button empty-button" onClick={clearFilters}>
              Ver todos los productos
            </button>
          </div>
        )}
      </div>
    </main>
  )
}
