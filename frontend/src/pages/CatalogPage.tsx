import { useEffect, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import Icon from '../components/Icon'
import ProductCard from '../components/ProductCard'
import { useRequest } from '../hooks/useRequest'
import { fetchCategorySummaries } from '../services/categories'
import { fetchProducts } from '../services/products'
import type { ProductFilters } from '../services/products'
import { formatPrice } from '../utils/format'

const PRODUCTS_PER_PAGE = 12

// Cada opción del selector y cómo se la pide al backend.
const sortOptions: Record<string, { label: string; sortBy: ProductFilters['sortBy']; sortOrder: ProductFilters['sortOrder'] }> = {
  recent: { label: 'Más recientes', sortBy: 'publicationDate', sortOrder: 'desc' },
  'price-asc': { label: 'Menor precio', sortBy: 'price', sortOrder: 'asc' },
  'price-desc': { label: 'Mayor precio', sortBy: 'price', sortOrder: 'desc' },
  name: { label: 'Nombre (A-Z)', sortBy: 'name', sortOrder: 'asc' },
}

// Los filtros viven en la URL: se pueden compartir, el botón "atrás" los
// respeta y los accesos del inicio y de las promociones llegan ya filtrados.
type Param = 'q' | 'categoria' | 'desde' | 'hasta' | 'stock' | 'ofertas' | 'orden' | 'pagina'

// Un precio escrito por el visitante: número no negativo, o nada.
function parsePrice(value: string | null) {
  if (value === null || value.trim() === '') return undefined
  const price = Number(value)
  return Number.isFinite(price) && price >= 0 ? price : undefined
}

export default function CatalogPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const search = searchParams.get('q') ?? ''
  const category = searchParams.get('categoria') ?? ''
  const minPrice = parsePrice(searchParams.get('desde'))
  const maxPrice = parsePrice(searchParams.get('hasta'))
  const onlyAvailable = searchParams.get('stock') === '1'
  const onlyOnSale = searchParams.get('ofertas') === '1'
  const sortBy = sortOptions[searchParams.get('orden') ?? ''] ? searchParams.get('orden')! : 'recent'
  const page = Math.max(1, Number(searchParams.get('pagina')) || 1)

  const [searchInput, setSearchInput] = useState(search)
  const [panelOpen, setPanelOpen] = useState(false)

  // Si la búsqueda cambia desde afuera (un chip, "Limpiar", el botón "atrás"),
  // el campo la sigue. Se compara sin espacios para no borrar el que se está tipeando.
  const [lastSearch, setLastSearch] = useState(search)
  if (search !== lastSearch) {
    setLastSearch(search)
    if (search !== searchInput.trim()) setSearchInput(search)
  }

  // Cambia parámetros de la URL; cualquier cambio de filtro vuelve a la página 1.
  function updateParams(changes: Partial<Record<Param, string>>) {
    setSearchParams((current) => {
      const next = new URLSearchParams(current)
      for (const [key, value] of Object.entries(changes)) {
        if (value) next.set(key, value)
        else next.delete(key)
      }
      if (!('pagina' in changes)) next.delete('pagina')
      return next
    }, { replace: true })
  }

  // Espera a que se deje de escribir para no consultar al backend en cada tecla.
  useEffect(() => {
    if (searchInput.trim() === search) return
    const timer = window.setTimeout(() => updateParams({ q: searchInput.trim() }), 350)
    return () => window.clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchInput, search])

  const categories = useRequest(fetchCategorySummaries, 'categories')
  const filters: ProductFilters = {
    search,
    category,
    minPrice,
    maxPrice,
    inStock: onlyAvailable || undefined,
    onSale: onlyOnSale || undefined,
    ...sortOptions[sortBy],
    page,
    pageSize: PRODUCTS_PER_PAGE,
  }
  const products = useRequest((signal) => fetchProducts(filters, signal), JSON.stringify(filters))

  const total = products.data?.total ?? 0
  const totalPages = Math.ceil(total / PRODUCTS_PER_PAGE)
  const categoryName = categories.data?.find((item) => item.id === category)?.name

  // Un chip por filtro aplicado, cada uno con lo que hay que borrar para quitarlo.
  const chips: { label: string; clear: Partial<Record<Param, string>> }[] = [
    ...(search ? [{ label: `“${search}”`, clear: { q: '' } }] : []),
    ...(category ? [{ label: categoryName ?? 'Categoría', clear: { categoria: '' } }] : []),
    ...(minPrice !== undefined ? [{ label: `Desde ${formatPrice(minPrice)}`, clear: { desde: '' } }] : []),
    ...(maxPrice !== undefined ? [{ label: `Hasta ${formatPrice(maxPrice)}`, clear: { hasta: '' } }] : []),
    ...(onlyAvailable ? [{ label: 'Con stock', clear: { stock: '' } }] : []),
    ...(onlyOnSale ? [{ label: 'En oferta', clear: { ofertas: '' } }] : []),
  ]
  // El botón cuenta solo lo que se elige en el panel.
  const panelCount = chips.length - (search ? 1 : 0)

  function clearFilters() {
    setSearchParams({}, { replace: true })
  }

  function goToPage(next: number) {
    updateParams({ pagina: next > 1 ? String(next) : '' })
    window.scrollTo({ top: 0 })
  }

  return (
    <main className="information-page">
      <div className="information-container">
        <div className="information-heading">
          <h1>{onlyOnSale && !category ? 'Ofertas' : categoryName ?? 'Catálogo'}</h1>
        </div>

        <div className="catalog-bar">
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
            <label htmlFor="sort-filter">Ordenar por</label>
            <select id="sort-filter" value={sortBy} onChange={(event) => updateParams({ orden: event.target.value === 'recent' ? '' : event.target.value })}>
              {Object.entries(sortOptions).map(([value, option]) => (
                <option key={value} value={value}>{option.label}</option>
              ))}
            </select>
          </div>

          <button type="button" className="filters-button" aria-haspopup="dialog" onClick={() => setPanelOpen(true)}>
            <Icon name="filters" />
            Filtros
            {panelCount > 0 && <span className="filters-count" aria-label={`${panelCount} activos`}>{panelCount}</span>}
          </button>
        </div>

        <div className="catalog-toolbar">
          <p aria-live="polite">
            {products.isLoading ? 'Cargando productos...' : `${total} ${total === 1 ? 'producto encontrado' : 'productos encontrados'}`}
          </p>
          {chips.length > 0 && (
            <ul className="filter-chips" aria-label="Filtros aplicados">
              {chips.map((chip) => (
                <li key={chip.label}>
                  <button type="button" onClick={() => updateParams(chip.clear)} aria-label={`Quitar filtro ${chip.label}`}>
                    {chip.label} <Icon name="close" />
                  </button>
                </li>
              ))}
              {chips.length > 1 && (
                <li><button type="button" className="clear-button" onClick={clearFilters}>Limpiar filtros</button></li>
              )}
            </ul>
          )}
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
                <button type="button" disabled={page === 1 || products.isLoading} onClick={() => goToPage(page - 1)}>Anterior</button>
                <span>Página {page} de {totalPages}</span>
                <button type="button" disabled={page >= totalPages || products.isLoading} onClick={() => goToPage(page + 1)}>Siguiente</button>
              </div>
            )}
          </>
        ) : (
          <EmptyResults search={search} onlyOnSale={onlyOnSale && chips.length === 1} hasFilters={chips.length > 0} onClear={clearFilters} />
        )}
      </div>

      {panelOpen && (
        <FilterPanel
          categories={categories.data ?? []}
          category={category}
          minPrice={minPrice}
          maxPrice={maxPrice}
          onlyAvailable={onlyAvailable}
          onlyOnSale={onlyOnSale}
          total={products.isLoading ? null : total}
          onChange={updateParams}
          onClear={() => updateParams({ categoria: '', desde: '', hasta: '', stock: '', ofertas: '' })}
          onClose={() => setPanelOpen(false)}
        />
      )}
    </main>
  )
}

// Sin resultados, la salida es pedir el producto: lo que no está en el catálogo se puede conseguir.
function EmptyResults({ search, onlyOnSale, hasFilters, onClear }: { search: string; onlyOnSale: boolean; hasFilters: boolean; onClear: () => void }) {
  if (onlyOnSale) {
    return (
      <div className="empty-state">
        <h3>No hay ofertas por ahora</h3>
        <p>Las ofertas cambian seguido: volvé en unos días o mirá todo el catálogo.</p>
        <button type="button" className="primary-button empty-button" onClick={onClear}>Ver todo el catálogo</button>
      </div>
    )
  }

  const subject = search ? `Busco: ${search}` : 'Busco un producto'
  return (
    <div className="empty-state">
      <h3>{search ? `No encontramos “${search}”` : hasFilters ? 'Nada con esos filtros' : 'Todavía no hay productos'}</h3>
      <p>
        {search
          ? 'Si no está en el catálogo, te lo buscamos. Contanos qué modelo necesitás y te respondemos con precio y disponibilidad.'
          : hasFilters
            ? 'Probá sacando alguno de los filtros, o escribinos y te lo buscamos.'
            : 'Todavía no hay productos cargados en el catálogo.'}
      </p>
      <div className="empty-actions">
        <Link className="primary-button" to={`/contacto?asunto=${encodeURIComponent(subject)}`}>Pedir un producto</Link>
        {hasFilters && <button type="button" className="clear-button" onClick={onClear}>Limpiar filtros</button>}
      </div>
    </div>
  )
}

interface FilterPanelProps {
  categories: { id: string; name: string; productCount: number }[]
  category: string
  minPrice?: number
  maxPrice?: number
  onlyAvailable: boolean
  onlyOnSale: boolean
  total: number | null
  onChange: (changes: Partial<Record<Param, string>>) => void
  onClear: () => void
  onClose: () => void
}

// Panel lateral con los filtros. Cada cambio se aplica en el momento y el pie
// muestra cuántos productos quedan; el <dialog> nativo bloquea el foco y cierra con Escape.
function FilterPanel({ categories, category, minPrice, maxPrice, onlyAvailable, onlyOnSale, total, onChange, onClear, onClose }: FilterPanelProps) {
  const ref = useRef<HTMLDialogElement>(null)
  const [from, setFrom] = useState(minPrice === undefined ? '' : String(minPrice))
  const [to, setTo] = useState(maxPrice === undefined ? '' : String(maxPrice))
  const priceError = from !== '' && to !== '' && Number(from) > Number(to) ? 'El “desde” es mayor que el “hasta”.' : ''

  useEffect(() => {
    const dialog = ref.current
    if (dialog && !dialog.open) dialog.showModal()
  }, [])

  // Los precios se aplican cuando se deja de escribir y el rango es válido.
  useEffect(() => {
    if (priceError || (parsePrice(from) === minPrice && parsePrice(to) === maxPrice)) return
    const timer = window.setTimeout(() => onChange({ desde: from.trim(), hasta: to.trim() }), 500)
    return () => window.clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [from, to, priceError])

  function clearAll() {
    setFrom('')
    setTo('')
    onClear()
  }

  return (
    <dialog
      ref={ref}
      className="filter-panel"
      aria-labelledby="filter-panel-title"
      onCancel={(event) => { event.preventDefault(); onClose() }}
      onMouseDown={(event) => { if (event.target === ref.current) onClose() }}
    >
      <div className="filter-panel-header">
        <h2 id="filter-panel-title">Filtros</h2>
        <button type="button" className="filter-panel-close" aria-label="Cerrar filtros" onClick={onClose}><Icon name="close" /></button>
      </div>

      <div className="filter-panel-body">
        <fieldset className="filter-group">
          <legend>Categoría</legend>
          <label className="filter-option">
            <input type="radio" name="filter-category" checked={category === ''} onChange={() => onChange({ categoria: '' })} />
            <span>Todas</span>
          </label>
          {categories.map((item) => (
            <label key={item.id} className="filter-option">
              <input type="radio" name="filter-category" checked={category === item.id} onChange={() => onChange({ categoria: item.id })} />
              <span>{item.name}</span>
              <span className="filter-option-count">{item.productCount}</span>
            </label>
          ))}
        </fieldset>

        <fieldset className="filter-group">
          <legend>Precio</legend>
          <div className="filter-price">
            <div className="field">
              <label htmlFor="filter-from">Desde</label>
              <input id="filter-from" type="number" inputMode="numeric" min={0} placeholder="$ 0" value={from} onChange={(event) => setFrom(event.target.value)} aria-invalid={Boolean(priceError)} aria-describedby={priceError ? 'filter-price-error' : undefined} />
            </div>
            <div className="field">
              <label htmlFor="filter-to">Hasta</label>
              <input id="filter-to" type="number" inputMode="numeric" min={0} placeholder="Sin tope" value={to} onChange={(event) => setTo(event.target.value)} aria-invalid={Boolean(priceError)} aria-describedby={priceError ? 'filter-price-error' : undefined} />
            </div>
          </div>
          {priceError && <p id="filter-price-error" className="filter-error" role="alert">{priceError}</p>}
        </fieldset>

        <fieldset className="filter-group">
          <legend>Mostrar solo</legend>
          <label className="filter-option">
            <input type="checkbox" checked={onlyAvailable} onChange={(event) => onChange({ stock: event.target.checked ? '1' : '' })} />
            <span>Productos con stock</span>
          </label>
          <label className="filter-option">
            <input type="checkbox" checked={onlyOnSale} onChange={(event) => onChange({ ofertas: event.target.checked ? '1' : '' })} />
            <span>Productos en oferta</span>
          </label>
        </fieldset>
      </div>

      <div className="filter-panel-footer">
        <button type="button" className="clear-button" onClick={clearAll}>Limpiar</button>
        <button type="button" className="primary-button" onClick={onClose}>
          {total === null ? 'Ver productos' : total === 1 ? 'Ver 1 producto' : `Ver ${total} productos`}
        </button>
      </div>
    </dialog>
  )
}
