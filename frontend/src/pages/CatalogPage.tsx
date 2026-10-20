import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import ProductCard from '../components/ProductCard'
import { useProducts } from '../hooks/useProducts'

const PRODUCTS_PER_PAGE = 12

export default function CatalogPage() {
  const { products, isLoading, error, retry } = useProducts()
  // La categoría va en la URL para que los accesos del inicio lleguen ya filtrados.
  const [searchParams, setSearchParams] = useSearchParams()
  const category = searchParams.get('categoria') ?? 'Todas'
  const [search, setSearch] = useState('')
  const [onlyAvailable, setOnlyAvailable] = useState(false)
  const [sortBy, setSortBy] = useState('recent')
  const [requestedPage, setCurrentPage] = useState(1)

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
  // La categoría puede cambiar desde la URL (por ejemplo, con el enlace del encabezado) sin pasar por changeFilters.
  const currentPage = Math.min(requestedPage, Math.max(totalPages, 1))
  const paginatedProducts = visibleProducts.slice(
    (currentPage - 1) * PRODUCTS_PER_PAGE,
    currentPage * PRODUCTS_PER_PAGE,
  )

  const changeFilters = (callback: () => void) => {
    callback()
    setCurrentPage(1)
  }

  const setCategory = (name: string) => {
    setSearchParams(name === 'Todas' ? {} : { categoria: name }, { replace: true })
  }

  const clearFilters = () => {
    setSearch('')
    setCategory('Todas')
    setOnlyAvailable(false)
    setSortBy('recent')
    setCurrentPage(1)
  }

  return (
    <main className="information-page">
      <div className="information-container">
        <div className="information-heading">
          <h1>{category === 'Todas' ? 'Catálogo' : category}</h1>
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
          <div className="empty-state" role="status">Cargando catálogo...</div>
        ) : error ? (
          <div className="empty-state" role="alert">
            <h3>No pudimos cargar el catálogo</h3>
            <p>{error} Verificá que el backend esté funcionando en el puerto 8080.</p>
            <button type="button" className="primary-button empty-button" onClick={retry}>
              Reintentar
            </button>
          </div>
        ) : paginatedProducts.length > 0 ? (
          <>
            <div className="products-grid">
              {paginatedProducts.map((product) => <ProductCard key={product.id} product={product} />)}
            </div>
            {totalPages > 1 && (
              <div className="pagination" aria-label="Paginación de productos">
                <button type="button" disabled={currentPage === 1} onClick={() => setCurrentPage(currentPage - 1)}>Anterior</button>
                <span>Página {currentPage} de {totalPages}</span>
                <button type="button" disabled={currentPage === totalPages} onClick={() => setCurrentPage(currentPage + 1)}>Siguiente</button>
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
