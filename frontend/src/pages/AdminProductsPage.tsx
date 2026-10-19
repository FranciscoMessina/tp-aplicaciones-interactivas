import { useCallback, useEffect, useState } from 'react'
import AdminNotice from '../components/AdminNotice'
import type { Notice } from '../components/AdminNotice'
import Modal from '../components/Modal'
import ProductFormModal from '../components/ProductFormModal'
import { useAuth } from '../context/auth-context'
import { getErrorMessage as errorMessage } from '../services/api'
import { fetchCategories } from '../services/categories'
import { deleteProduct, fetchAdminProducts, updateProduct } from '../services/products'
import type { Category, Product } from '../types/product'
import { formatPrice } from '../utils/format'

const PAGE_SIZE = 10

export default function AdminProductsPage() {
  const { accessToken } = useAuth()
  const token = accessToken ?? ''

  const [products, setProducts] = useState<Product[]>([])
  const [total, setTotal] = useState(0)
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [reload, setReload] = useState(0)

  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('')
  const [page, setPage] = useState(1)

  const [editing, setEditing] = useState<Product | null>(null)
  const [creating, setCreating] = useState(false)
  const [deleting, setDeleting] = useState<Product | null>(null)
  const [deleteBusy, setDeleteBusy] = useState(false)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [notice, setNotice] = useState<Notice | null>(null)

  const showNotice = useCallback((next: Notice) => setNotice(next), [])
  const clearNotice = useCallback(() => setNotice(null), [])

  // Debounce del buscador para no consultar en cada tecla.
  useEffect(() => {
    const timer = window.setTimeout(() => {
      setSearch(searchInput.trim())
      setPage(1)
    }, 350)
    return () => window.clearTimeout(timer)
  }, [searchInput])

  useEffect(() => {
    const controller = new AbortController()
    fetchCategories(controller.signal)
      .then(setCategories)
      .catch(() => { /* el filtro y el formulario quedan sin opciones; el listado avisa si el back falla */ })
    return () => controller.abort()
  }, [])

  useEffect(() => {
    if (!token) return
    const controller = new AbortController()
    setLoading(true)
    setLoadError('')
    fetchAdminProducts(token, { search, category, page, pageSize: PAGE_SIZE }, controller.signal)
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
  }, [token, search, category, page, reload])

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const hasFilters = Boolean(search || category)

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
      showNotice({ kind: 'success', text: `“${product.name}” ${updated.isActive ? 'se publicó' : 'se desactivó y ya no se ve en el sitio'}.` })
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
    setSearch('')
    setCategory('')
    setPage(1)
  }

  return (
    <>
        <div className="admin-heading">
          <div>
            <span className="section-kicker">ADMINISTRACIÓN</span>
            <h1>Productos</h1>
            <p>Creá, editá, publicá u ocultá los productos del catálogo.</p>
          </div>
          <button type="button" className="admin-primary" onClick={() => setCreating(true)}>+ Nuevo producto</button>
        </div>

        <AdminNotice notice={notice} onClose={clearNotice} />

        <div className="admin-toolbar">
          <div className="admin-field admin-search">
            <label htmlFor="admin-search">Buscar</label>
            <input id="admin-search" type="search" placeholder="Nombre o descripción…" value={searchInput} onChange={(event) => setSearchInput(event.target.value)} />
          </div>
          <div className="admin-field">
            <label htmlFor="admin-category">Categoría</label>
            <select id="admin-category" value={category} onChange={(event) => { setCategory(event.target.value); setPage(1) }}>
              <option value="">Todas</option>
              {categories.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
            </select>
          </div>
          {hasFilters && <button type="button" className="clear-button" onClick={clearFilters}>Limpiar filtros</button>}
        </div>

        <p className="admin-count" aria-live="polite">
          {loading ? 'Cargando…' : `${total} ${total === 1 ? 'producto' : 'productos'}${hasFilters ? ' encontrados' : ''}`}
        </p>

        {loadError ? (
          <div className="empty-state" role="alert">
            <span aria-hidden="true">⚠️</span>
            <h3>No pudimos cargar los productos</h3>
            <p>{loadError}</p>
            <button type="button" className="primary-button empty-button" onClick={refresh}>Reintentar</button>
          </div>
        ) : loading && products.length === 0 ? (
          <div className="admin-skeleton" role="status" aria-label="Cargando productos">
            {Array.from({ length: 5 }, (_, index) => <div key={index} />)}
          </div>
        ) : products.length === 0 ? (
          <div className="empty-state">
            <span aria-hidden="true">📦</span>
            <h3>{hasFilters ? 'No encontramos productos' : 'Todavía no hay productos'}</h3>
            <p>{hasFilters ? 'Probá con otra búsqueda o categoría.' : 'Creá el primero con el botón “Nuevo producto”.'}</p>
          </div>
        ) : (
          <div className={`admin-table-wrap${loading ? ' is-loading' : ''}`}>
            <table className="admin-table">
              <thead>
                <tr>
                  <th scope="col">Producto</th>
                  <th scope="col">Categoría</th>
                  <th scope="col">Precio</th>
                  <th scope="col">Stock</th>
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
                          : <span className="admin-thumb-placeholder" aria-hidden="true">💻</span>}
                        <div>
                          <strong>{product.name}</strong>
                          {product.images.length > 1 && <small>{product.images.length} imágenes</small>}
                        </div>
                      </div>
                    </td>
                    <td data-label="Categoría">{product.category?.name ?? 'Sin categoría'}</td>
                    <td data-label="Precio">{formatPrice(product.price)}</td>
                    <td data-label="Stock">
                      <span className={product.availableQuantity > 0 ? 'product-available' : 'product-unavailable'}>
                        {product.availableQuantity > 0 ? `${product.availableQuantity} u.` : 'Sin stock'}
                      </span>
                    </td>
                    <td data-label="Estado">
                      <span className={`admin-status ${product.isActive ? 'on' : 'off'}`}>{product.isActive ? 'Publicado' : 'Oculto'}</span>
                    </td>
                    <td className="admin-actions-cell">
                      <div className="admin-row-actions">
                        <button type="button" onClick={() => setEditing(product)}>Editar</button>
                        <button type="button" disabled={busyId === product.id} onClick={() => void toggleActive(product)}>
                          {busyId === product.id ? '…' : product.isActive ? 'Desactivar' : 'Activar'}
                        </button>
                        <button type="button" className="danger" onClick={() => setDeleting(product)}>Eliminar</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!loadError && totalPages > 1 && (
          <div className="pagination" aria-label="Paginación de productos">
            <button type="button" disabled={page === 1} onClick={() => setPage((current) => current - 1)}>Anterior</button>
            <span>Página {page} de {totalPages}</span>
            <button type="button" disabled={page === totalPages} onClick={() => setPage((current) => current + 1)}>Siguiente</button>
          </div>
        )}

      {(creating || editing) && (
        <ProductFormModal
          token={token}
          categories={categories}
          product={editing}
          onClose={() => { setCreating(false); setEditing(null) }}
          onSaved={handleSaved}
        />
      )}

      {deleting && (
        <Modal title="Eliminar producto" onClose={() => { if (!deleteBusy) setDeleting(null) }}>
          <p className="admin-confirm-text">
            ¿Seguro que querés eliminar <strong>{deleting.name}</strong>? Esta acción no se puede deshacer.
            Si solo querés que deje de verse en el sitio, usá <em>Desactivar</em>.
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
