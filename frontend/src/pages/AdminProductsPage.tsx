import { useCallback, useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import AdminEmpty from '../components/AdminEmpty'
import AdminNotice from '../components/AdminNotice'
import type { Notice } from '../components/AdminNotice'
import Icon from '../components/Icon'
import Modal from '../components/Modal'
import ProductFormModal from '../components/ProductFormModal'
import type { CategoriesState } from '../components/ProductFormModal'
import { useAuth } from '../context/auth-context'
import { getErrorMessage as errorMessage } from '../services/api'
import { fetchCategories } from '../services/categories'
import { deleteProduct, fetchAdminProducts, updateProduct } from '../services/products'
import type { Category, Product } from '../types/product'
import { formatPrice } from '../utils/format'

const PAGE_SIZE = 10

// Valores de los filtros en la URL (?estado=publicado&stock=sin-stock&destacados=si...).
const statusValues: Record<string, boolean> = { publicado: true, oculto: false }
const stockValues: Record<string, boolean> = { 'con-stock': true, 'sin-stock': false }

export default function AdminProductsPage() {
  const { accessToken } = useAuth()
  const token = accessToken ?? ''

  const [products, setProducts] = useState<Product[]>([])
  const [total, setTotal] = useState(0)
  const [categories, setCategories] = useState<Category[]>([])
  const [categoriesState, setCategoriesState] = useState<CategoriesState>('loading')
  const [categoriesReload, setCategoriesReload] = useState(0)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [reload, setReload] = useState(0)

  // Los filtros viven en la URL: se pueden compartir, el resumen enlaza a una vista filtrada
  // y el botón Atrás vuelve al listado anterior.
  const [params, setParams] = useSearchParams()
  const search = params.get('q') ?? ''
  const category = params.get('categoria') ?? ''
  const status = params.get('estado') ?? ''
  const stock = params.get('stock') ?? ''
  const featuredOnly = params.get('destacados') === 'si'
  const page = Math.max(1, Number(params.get('pagina')) || 1)

  // Cambia filtros en la URL; cualquier filtro nuevo vuelve a la primera página.
  const updateFilters = useCallback((changes: Record<string, string>, replace = false) => {
    setParams((current) => {
      const next = new URLSearchParams(current)
      for (const [key, value] of Object.entries(changes)) {
        if (value) next.set(key, value)
        else next.delete(key)
      }
      if (!('pagina' in changes)) next.delete('pagina')
      return next
    }, { replace })
  }, [setParams])

  const setPage = (next: number) => updateFilters({ pagina: next > 1 ? String(next) : '' })

  const [searchInput, setSearchInput] = useState(search)
  // Si la URL cambia desde afuera (Atrás, un enlace del menú), el buscador la acompaña.
  const [urlSearch, setUrlSearch] = useState(search)
  if (search !== urlSearch) {
    setUrlSearch(search)
    if (searchInput.trim() !== search) setSearchInput(search)
  }

  const [editing, setEditing] = useState<Product | null>(null)
  const [creating, setCreating] = useState(false)
  const [deleting, setDeleting] = useState<Product | null>(null)
  const [deleteBusy, setDeleteBusy] = useState(false)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [notice, setNotice] = useState<Notice | null>(null)

  const showNotice = useCallback((next: Notice) => setNotice(next), [])
  const clearNotice = useCallback(() => setNotice(null), [])

  // Debounce del buscador para no consultar ni llenar el historial en cada tecla.
  useEffect(() => {
    if (searchInput.trim() === search) return
    const timer = window.setTimeout(() => updateFilters({ q: searchInput.trim() }, true), 350)
    return () => window.clearTimeout(timer)
  }, [searchInput, search, updateFilters])

  // Sin categorías no se puede crear un producto: si fallan se avisa y se puede reintentar.
  useEffect(() => {
    const controller = new AbortController()
    fetchCategories(controller.signal)
      .then((result) => {
        setCategories(result)
        setCategoriesState('ready')
      })
      .catch(() => { if (!controller.signal.aborted) setCategoriesState('error') })
    return () => controller.abort()
  }, [categoriesReload])

  function retryCategories() {
    setCategoriesState('loading')
    setCategoriesReload((value) => value + 1)
  }

  useEffect(() => {
    if (!token) return
    const controller = new AbortController()
    setLoading(true)
    setLoadError('')
    const filters = {
      search,
      category,
      isActive: statusValues[status],
      inStock: stockValues[stock],
      isFeatured: featuredOnly || undefined,
      page,
      pageSize: PAGE_SIZE,
    }
    fetchAdminProducts(token, filters, controller.signal)
      .then((result) => {
        setProducts(result.items)
        setTotal(result.total)
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return
        setLoadError(errorMessage(error))
      })
      .finally(() => { if (!controller.signal.aborted) setLoading(false) })
    return () => controller.abort()
  }, [token, search, category, status, stock, featuredOnly, page, reload])

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const hasFilters = Boolean(search || category || status || stock || featuredOnly)

  function refresh() { setReload((value) => value + 1) }

  function handleSaved(product: Product, wasEdit: boolean) {
    setCreating(false)
    setEditing(null)
    showNotice({ kind: 'success', text: wasEdit ? `Se guardaron los cambios de “${product.name}”.` : `Se creó “${product.name}”.` })
    // Al crear, volvemos a la primera página: el nuevo producto es el más reciente.
    if (!wasEdit && page !== 1) setPage(1)
    else refresh()
  }

  async function toggleActive(product: Product) {
    setBusyId(product.id)
    try {
      const updated = await updateProduct(token, product.id, { isActive: !product.isActive })
      setProducts((current) => current.map((item) => item.id === product.id ? { ...item, isActive: updated.isActive } : item))
      showNotice({ kind: 'success', text: `“${product.name}” ${updated.isActive ? 'se publicó' : 'se ocultó y ya no se ve en el sitio'}.` })
    } catch (error) {
      showNotice({ kind: 'error', text: errorMessage(error) })
    } finally {
      setBusyId(null)
    }
  }

  async function confirmDelete() {
    if (!deleting) return
    setDeleteBusy(true)
    try {
      await deleteProduct(token, deleting.id)
      showNotice({ kind: 'success', text: `Se eliminó “${deleting.name}”.` })
      const emptiesPage = products.length === 1 && page > 1
      setDeleting(null)
      if (emptiesPage) setPage(page - 1)
      else refresh()
    } catch (error) {
      setDeleting(null)
      showNotice({ kind: 'error', text: errorMessage(error) })
    } finally {
      setDeleteBusy(false)
    }
  }

  function clearFilters() {
    setSearchInput('')
    setParams({})
  }

  return (
    <>
      <div className="admin-heading">
        <div>
          <h1>Productos</h1>
          <p>Creá, editá, publicá u ocultá los productos del catálogo.</p>
        </div>
        <button type="button" className="admin-primary" onClick={() => setCreating(true)}><Icon name="plus" /> Nuevo producto</button>
      </div>

      <AdminNotice notice={notice} onClose={clearNotice} />

      {categoriesState === 'error' && (
        <p className="admin-alert is-error" role="alert">
          No pudimos cargar las categorías: el filtro por categoría y la carga de productos no van a funcionar.{' '}
          <button type="button" className="admin-text-link" onClick={retryCategories}>Reintentar</button>
        </p>
      )}

      <section className="admin-panel" aria-label="Listado de productos">
        <div className="admin-toolbar">
          <div className="admin-search">
            <Icon name="search" />
            <label htmlFor="admin-search" className="visually-hidden">Buscar productos</label>
            <input id="admin-search" type="search" placeholder="Buscar por nombre o descripción" value={searchInput} onChange={(event) => setSearchInput(event.target.value)} />
          </div>
          <label htmlFor="admin-category" className="visually-hidden">Categoría</label>
          <select id="admin-category" className="admin-select" value={category} onChange={(event) => updateFilters({ categoria: event.target.value })}>
            <option value="">Todas las categorías</option>
            {categories.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
          </select>
          <label htmlFor="admin-status" className="visually-hidden">Estado</label>
          <select id="admin-status" className="admin-select" value={status} onChange={(event) => updateFilters({ estado: event.target.value })}>
            <option value="">Todos los estados</option>
            <option value="publicado">Publicados</option>
            <option value="oculto">Ocultos</option>
          </select>
          <label htmlFor="admin-stock" className="visually-hidden">Stock</label>
          <select id="admin-stock" className="admin-select" value={stock} onChange={(event) => updateFilters({ stock: event.target.value })}>
            <option value="">Con y sin stock</option>
            <option value="con-stock">Con stock</option>
            <option value="sin-stock">Sin stock</option>
          </select>
          <label className="admin-check admin-toolbar-check">
            <input type="checkbox" checked={featuredOnly} onChange={(event) => updateFilters({ destacados: event.target.checked ? 'si' : '' })} />
            Solo destacados
          </label>
          {hasFilters && <button type="button" className="admin-text-link" onClick={clearFilters}>Limpiar filtros</button>}
          <p className="admin-count" aria-live="polite">
            {loading ? 'Cargando…' : `${total} ${total === 1 ? 'producto' : 'productos'}${hasFilters ? (total === 1 ? ' encontrado' : ' encontrados') : ''}`}
          </p>
        </div>

        {loadError ? (
          <AdminEmpty icon="alert" title="No pudimos cargar los productos" isError action={<button type="button" className="admin-secondary" onClick={refresh}>Reintentar</button>}>
            {loadError}
          </AdminEmpty>
        ) : loading && products.length === 0 ? (
          <div className="admin-skeleton is-rows" role="status" aria-label="Cargando productos">
            {Array.from({ length: 6 }, (_, index) => <div key={index} />)}
          </div>
        ) : products.length === 0 ? (
          <AdminEmpty
            icon="products"
            title={hasFilters ? 'No encontramos productos' : 'Todavía no hay productos'}
            action={hasFilters
              ? <button type="button" className="admin-secondary" onClick={clearFilters}>Limpiar filtros</button>
              : <button type="button" className="admin-primary" onClick={() => setCreating(true)}><Icon name="plus" /> Nuevo producto</button>}
          >
            {hasFilters ? 'Probá con otra búsqueda o categoría.' : 'Cargá el primero para que aparezca en el catálogo.'}
          </AdminEmpty>
        ) : (
          <div className={`admin-table-wrap${loading ? ' is-loading' : ''}`}>
            <table className="admin-table">
              <thead>
                <tr>
                  <th scope="col">Producto</th>
                  <th scope="col">Categoría</th>
                  <th scope="col" className="is-numeric">Precio</th>
                  <th scope="col" className="is-numeric">Stock</th>
                  <th scope="col">Estado</th>
                  <th scope="col"><span className="visually-hidden">Acciones</span></th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => (
                  <tr key={product.id} className={product.isActive ? undefined : 'is-inactive'}>
                    <td data-label="Producto">
                      <div className="admin-product-cell">
                        {product.images?.[0]
                          ? <img src={product.images[0]} alt="" loading="lazy" />
                          : <span className="admin-thumb-placeholder" aria-hidden="true"><Icon name="products" /></span>}
                        <div>
                          <strong>{product.name}</strong>
                          {(product.isFeatured || product.images.length > 1) && (
                            <small>
                              {product.isFeatured && <span className="admin-tag">Destacado</span>}
                              {product.images.length > 1 && `${product.images.length} imágenes`}
                            </small>
                          )}
                        </div>
                      </div>
                    </td>
                    <td data-label="Categoría">{product.category?.name ?? 'Sin categoría'}</td>
                    <td data-label="Precio" className="is-numeric">{formatPrice(product.price)}</td>
                    <td data-label="Stock" className="is-numeric">
                      {product.availableQuantity > 0
                        ? product.availableQuantity
                        : <span className="admin-out-of-stock">Sin stock</span>}
                    </td>
                    <td data-label="Estado">
                      <span className={`admin-status ${product.isActive ? 'is-on' : 'is-off'}`}>{product.isActive ? 'Publicado' : 'Oculto'}</span>
                    </td>
                    <td className="admin-actions-cell">
                      <div className="admin-row-actions">
                        <button type="button" className="admin-icon-button" aria-label={`Editar ${product.name}`} title="Editar" onClick={() => setEditing(product)}>
                          <Icon name="edit" />
                        </button>
                        <button
                          type="button"
                          className="admin-icon-button"
                          aria-label={`${product.isActive ? 'Ocultar' : 'Publicar'} ${product.name}`}
                          title={product.isActive ? 'Ocultar del sitio' : 'Publicar en el sitio'}
                          aria-busy={busyId === product.id}
                          disabled={busyId === product.id}
                          onClick={() => void toggleActive(product)}
                        >
                          <Icon name={product.isActive ? 'hide' : 'show'} />
                        </button>
                        <button type="button" className="admin-icon-button is-danger" aria-label={`Eliminar ${product.name}`} title="Eliminar" onClick={() => setDeleting(product)}>
                          <Icon name="delete" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!loadError && totalPages > 1 && (
          <nav className="admin-pagination" aria-label="Paginación de productos">
            <span>Página {page} de {totalPages}</span>
            <button type="button" className="admin-secondary" disabled={page === 1} onClick={() => setPage(page - 1)}>Anterior</button>
            <button type="button" className="admin-secondary" disabled={page === totalPages} onClick={() => setPage(page + 1)}>Siguiente</button>
          </nav>
        )}
      </section>

      {(creating || editing) && (
        <ProductFormModal
          token={token}
          categories={categories}
          categoriesState={categoriesState}
          onRetryCategories={retryCategories}
          product={editing}
          onClose={() => { setCreating(false); setEditing(null) }}
          onSaved={handleSaved}
        />
      )}

      {deleting && (
        <Modal title="Eliminar producto" onClose={() => { if (!deleteBusy) setDeleting(null) }}>
          <p className="admin-confirm-text">
            ¿Seguro que querés eliminar <strong>{deleting.name}</strong>? Esta acción no se puede deshacer.
            Si solo querés que deje de verse en el sitio, usá <em>Ocultar</em>.
          </p>
          <div className="admin-form-actions">
            <button type="button" className="admin-secondary" disabled={deleteBusy} onClick={() => setDeleting(null)}>Cancelar</button>
            <button type="button" className="admin-danger" disabled={deleteBusy} onClick={() => void confirmDelete()}>
              {deleteBusy ? 'Eliminando...' : 'Sí, eliminar'}
            </button>
          </div>
        </Modal>
      )}
    </>
  )
}
