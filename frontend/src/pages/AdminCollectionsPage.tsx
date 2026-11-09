import { useCallback, useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { Link } from 'react-router-dom'
import AdminEmpty from '../components/AdminEmpty'
import AdminNotice from '../components/AdminNotice'
import type { Notice } from '../components/AdminNotice'
import Icon from '../components/Icon'
import Modal from '../components/Modal'
import { useAuth } from '../context/auth-context'
import { ApiRequestError, getErrorMessage as errorMessage } from '../services/api'
import { createCollection, deleteCollection, fetchAdminCollections, updateCollection } from '../services/collections'
import { fetchAdminProducts } from '../services/products'
import type { Collection, CollectionInput } from '../types/collection'
import type { Product } from '../types/product'

// Mismo límite que valida el backend.
const MAX_PRODUCTS = 48
const SEARCH_RESULTS = 8

type Errors = Partial<Record<'title' | 'description' | 'products', string>>

// Ids de los campos, para asociar cada uno con su mensaje de error y enfocar el primero inválido.
const fieldIds = { title: 'co-title', description: 'co-description', products: 'co-search' } as const

// Lo que ve hoy un visitante de cada colección.
function collectionStatus(collection: Collection): { label: string; isOn: boolean } {
  if (!collection.isActive) return { label: 'Apagada', isOn: false }
  if (!collection.products.some((product) => product.isActive)) return { label: 'Sin productos publicados', isOn: false }
  return { label: 'Visible en el sitio', isOn: true }
}

interface CollectionFormModalProps {
  token: string
  collection: Collection | null // null = crear
  onClose: () => void
  onSaved: (collection: Collection, wasEdit: boolean) => void
}

function CollectionFormModal({ token, collection, onClose, onSaved }: CollectionFormModalProps) {
  const isEdit = collection !== null
  const [title, setTitle] = useState(collection?.title ?? '')
  const [description, setDescription] = useState(collection?.description ?? '')
  const [products, setProducts] = useState<Product[]>(collection?.products ?? [])
  const [isActive, setIsActive] = useState(collection?.isActive ?? true)
  const [errors, setErrors] = useState<Errors>({})
  const [formError, setFormError] = useState('')
  const [saving, setSaving] = useState(false)

  // Buscador de productos: la respuesta guarda para qué texto fue, así una vieja no pisa a una nueva.
  const [search, setSearch] = useState('')
  const query = search.trim()
  const [results, setResults] = useState<{ query: string; items: Product[]; error: string }>({ query: '', items: [], error: '' })
  const searching = query !== '' && results.query !== query

  useEffect(() => {
    if (!query) return
    const controller = new AbortController()
    const timer = window.setTimeout(() => {
      fetchAdminProducts(token, { search: query, sortBy: 'relevance', page: 1, pageSize: SEARCH_RESULTS }, controller.signal)
        .then((page) => setResults({ query, items: page.items, error: '' }))
        .catch((error: unknown) => { if (!controller.signal.aborted) setResults({ query, items: [], error: errorMessage(error) }) })
    }, 300)
    return () => { window.clearTimeout(timer); controller.abort() }
  }, [token, query])

  function addProduct(product: Product) {
    setProducts((current) => [...current, product])
    setErrors((current) => ({ ...current, products: undefined }))
  }

  // Saca el producto de su lugar y lo inserta en `to`.
  function moveProduct(from: number, to: number) {
    setProducts((current) => {
      const next = [...current]
      const [moved] = next.splice(from, 1)
      next.splice(to, 0, moved)
      return next
    })
  }

  function removeProduct(id: string) {
    setProducts((current) => current.filter((product) => product.id !== id))
  }

  function validate(): Errors {
    const found: Errors = {}
    if (!title.trim()) found.title = 'Ingresá un título.'
    else if (title.trim().length > 80) found.title = 'Usá hasta 80 caracteres.'
    if (description.trim().length > 300) found.description = 'Usá hasta 300 caracteres.'
    if (products.length === 0) found.products = 'Agregá al menos un producto.'
    else if (products.length > MAX_PRODUCTS) found.products = `Una colección puede tener hasta ${MAX_PRODUCTS} productos.`
    return found
  }

  // Muestra los errores y lleva el foco al primero, para que se lea su mensaje.
  function showErrors(found: Errors) {
    setErrors(found)
    const first = (Object.keys(fieldIds) as (keyof Errors)[]).find((key) => found[key])
    if (first) document.getElementById(fieldIds[first])?.focus()
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (saving) return
    setFormError('')

    const found = validate()
    showErrors(found)
    if (Object.keys(found).length > 0) return

    const input: CollectionInput = {
      title: title.trim(),
      description: description.trim() || null,
      products: products.map((product) => product.id),
      isActive,
    }

    setSaving(true)
    try {
      const saved = isEdit ? await updateCollection(token, collection.id, input) : await createCollection(token, input)
      onSaved(saved, isEdit)
    } catch (error) {
      // Errores por campo que devuelve el backend (validación de Zod).
      const fields = error instanceof ApiRequestError ? error.fields ?? {} : {}
      const fromServer: Errors = {}
      for (const key of ['title', 'description'] as const) {
        if (fields[key]?.[0]) fromServer[key] = fields[key][0]
      }
      const productsKey = Object.keys(fields).find((key) => key.startsWith('products'))
      if (productsKey) fromServer.products = fields[productsKey][0]
      showErrors(fromServer)
      setFormError(Object.keys(fromServer).length > 0 ? 'Revisá los campos marcados.' : errorMessage(error))
    } finally {
      setSaving(false)
    }
  }

  const errorProps = (key: keyof Errors) => ({
    'aria-invalid': Boolean(errors[key]),
    'aria-describedby': errors[key] ? `${fieldIds[key]}-error` : undefined,
  })
  const fieldClass = (key: keyof Errors) => (errors[key] ? 'admin-field has-error' : 'admin-field')
  const selectedIds = new Set(products.map((product) => product.id))
  const isFull = products.length >= MAX_PRODUCTS

  return (
    <Modal title={isEdit ? 'Editar colección' : 'Nueva colección'} onClose={saving ? () => undefined : onClose} wide>
      <form className="admin-form" onSubmit={(event) => void submit(event)} noValidate>
        {formError && <p className="admin-alert is-error" role="alert">{formError}</p>}

        <div className={fieldClass('title')}>
          <label htmlFor={fieldIds.title}>Título *</label>
          <input id={fieldIds.title} maxLength={80} value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Ej.: Armá tu setup gamer" {...errorProps('title')} />
          {errors.title && <span id={`${fieldIds.title}-error`} className="admin-error">{errors.title}</span>}
        </div>

        <div className={fieldClass('description')}>
          <label htmlFor={fieldIds.description}>Descripción <span className="admin-hint-inline">Opcional</span></label>
          <textarea id={fieldIds.description} rows={2} maxLength={300} value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Para quién es o qué tienen en común estos productos." {...errorProps('description')} />
          {errors.description && <span id={`${fieldIds.description}-error`} className="admin-error">{errors.description}</span>}
        </div>

        <div className={fieldClass('products')}>
          <label htmlFor={fieldIds.products}>Productos * <span className="admin-hint-inline">{products.length} de {MAX_PRODUCTS}</span></label>
          <div className="admin-search">
            <Icon name="search" />
            <input id={fieldIds.products} type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscá un producto por nombre para agregarlo" autoComplete="off" {...errorProps('products')} />
          </div>
          {errors.products && <span id={`${fieldIds.products}-error`} className="admin-error">{errors.products}</span>}

          {query && (
            <div className="collection-results" aria-live="polite">
              {searching ? (
                <p className="admin-hint">Buscando...</p>
              ) : results.error ? (
                <p className="admin-error">{results.error}</p>
              ) : results.items.length === 0 ? (
                <p className="admin-hint">No hay productos que coincidan con “{query}”.</p>
              ) : (
                <ul className="collection-items">
                  {results.items.map((product) => (
                    <li key={product.id}>
                      <img src={product.images[0]} alt="" loading="lazy" />
                      <span className="collection-item-name">
                        {product.name}
                        <small>{product.category.name}{product.isActive ? '' : ' · Oculto'}</small>
                      </span>
                      <button
                        type="button"
                        className="admin-secondary"
                        disabled={selectedIds.has(product.id) || isFull}
                        onClick={() => addProduct(product)}
                      >
                        {selectedIds.has(product.id) ? 'Agregado' : 'Agregar'}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {products.length > 0 && (
            <ol className="collection-items is-selected" aria-label="Productos de la colección, en el orden en que se muestran">
              {products.map((product, index) => (
                <li key={product.id}>
                  <img src={product.images[0]} alt="" loading="lazy" />
                  <span className="collection-item-name">
                    {product.name}
                    {!product.isActive && <small>Oculto: no se muestra en el sitio</small>}
                  </span>
                  <span className="admin-row-actions">
                    <button type="button" className="admin-icon-button" aria-label={`Subir ${product.name}`} title="Subir" disabled={index === 0} onClick={() => moveProduct(index, index - 1)}>
                      <Icon name="up" />
                    </button>
                    <button type="button" className="admin-icon-button" aria-label={`Bajar ${product.name}`} title="Bajar" disabled={index === products.length - 1} onClick={() => moveProduct(index, index + 1)}>
                      <Icon name="down" />
                    </button>
                    <button type="button" className="admin-icon-button is-danger" aria-label={`Quitar ${product.name}`} title="Quitar" onClick={() => removeProduct(product.id)}>
                      <Icon name="close" />
                    </button>
                  </span>
                </li>
              ))}
            </ol>
          )}
          <span className="admin-hint">Se muestran en este orden. En el inicio aparecen los primeros cuatro.</span>
        </div>

        <label className="admin-check">
          <input type="checkbox" checked={isActive} onChange={(event) => setIsActive(event.target.checked)} />
          <span><strong>Encendida</strong>: se muestra en el inicio del sitio y tiene su propia página.</span>
        </label>

        <div className="admin-form-actions">
          <button type="button" className="admin-secondary" onClick={onClose} disabled={saving}>Cancelar</button>
          <button type="submit" className="admin-primary" disabled={saving}>
            {saving ? 'Guardando...' : isEdit ? 'Guardar cambios' : 'Crear colección'}
          </button>
        </div>
      </form>
    </Modal>
  )
}

export default function AdminCollectionsPage() {
  const { accessToken } = useAuth()
  const token = accessToken ?? ''

  const [collections, setCollections] = useState<Collection[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [reload, setReload] = useState(0)

  const [editing, setEditing] = useState<Collection | null>(null)
  const [creating, setCreating] = useState(false)
  const [deleting, setDeleting] = useState<Collection | null>(null)
  const [busyId, setBusyId] = useState('')
  const [notice, setNotice] = useState<Notice | null>(null)

  const clearNotice = useCallback(() => setNotice(null), [])

  useEffect(() => {
    const controller = new AbortController()
    fetchAdminCollections(token, controller.signal)
      .then(setCollections)
      .catch((error: unknown) => { if (!controller.signal.aborted) setLoadError(errorMessage(error)) })
      .finally(() => { if (!controller.signal.aborted) setLoading(false) })
    return () => controller.abort()
  }, [token, reload])

  function retry() {
    setLoading(true)
    setLoadError('')
    setReload((value) => value + 1)
  }

  function handleSaved(saved: Collection, wasEdit: boolean) {
    setCreating(false)
    setEditing(null)
    setCollections((current) => wasEdit ? current.map((item) => (item.id === saved.id ? saved : item)) : [saved, ...current])
    setNotice({ kind: 'success', text: wasEdit ? `Se guardaron los cambios de “${saved.title}”.` : `Se creó “${saved.title}”.` })
  }

  async function toggleActive(collection: Collection) {
    setBusyId(collection.id)
    try {
      const updated = await updateCollection(token, collection.id, { isActive: !collection.isActive })
      setCollections((current) => current.map((item) => (item.id === updated.id ? updated : item)))
      setNotice({ kind: 'success', text: `“${collection.title}” ${updated.isActive ? 'se encendió' : 'se apagó y ya no se ve en el sitio'}.` })
    } catch (error) {
      setNotice({ kind: 'error', text: errorMessage(error) })
    } finally {
      setBusyId('')
    }
  }

  async function confirmDelete() {
    if (!deleting) return
    setBusyId(deleting.id)
    try {
      await deleteCollection(token, deleting.id)
      setCollections((current) => current.filter((item) => item.id !== deleting.id))
      setNotice({ kind: 'success', text: `Se eliminó “${deleting.title}”. Sus productos siguen en el catálogo.` })
    } catch (error) {
      setNotice({ kind: 'error', text: errorMessage(error) })
    } finally {
      setDeleting(null)
      setBusyId('')
    }
  }

  const newButton = <button type="button" className="admin-primary" onClick={() => setCreating(true)}><Icon name="plus" /> Nueva colección</button>

  return (
    <>
      <div className="admin-heading">
        <div>
          <h1>Colecciones</h1>
          <p>Selecciones de productos armadas a mano, como “Setup gamer” o “Para regalar”. Se muestran en el inicio.</p>
        </div>
        {newButton}
      </div>

      <AdminNotice notice={notice} onClose={clearNotice} />

      <section className="admin-panel" aria-label="Listado de colecciones">
        {loadError ? (
          <AdminEmpty icon="alert" title="No pudimos cargar las colecciones" isError action={<button type="button" className="admin-secondary" onClick={retry}>Reintentar</button>}>
            {loadError}
          </AdminEmpty>
        ) : loading ? (
          <div className="admin-skeleton is-rows" role="status" aria-label="Cargando colecciones">
            {Array.from({ length: 3 }, (_, index) => <div key={index} />)}
          </div>
        ) : collections.length === 0 ? (
          <AdminEmpty icon="collections" title="Todavía no hay colecciones" action={newButton}>
            Armá la primera eligiendo productos que vayan bien juntos.
          </AdminEmpty>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th scope="col">Colección</th>
                  <th scope="col">Productos</th>
                  <th scope="col">Estado</th>
                  <th scope="col"><span className="visually-hidden">Acciones</span></th>
                </tr>
              </thead>
              <tbody>
                {collections.map((collection) => {
                  const status = collectionStatus(collection)
                  const published = collection.products.filter((product) => product.isActive).length
                  return (
                    <tr key={collection.id} className={status.isOn ? undefined : 'is-inactive'}>
                      <td data-label="Colección">
                        <div className="admin-product-cell">
                          {collection.products[0]
                            ? <img src={collection.products[0].images[0]} alt="" loading="lazy" />
                            : <span className="admin-thumb-placeholder" aria-hidden="true"><Icon name="collections" /></span>}
                          <div>
                            <strong>{collection.title}</strong>
                            {collection.description && <small>{collection.description}</small>}
                          </div>
                        </div>
                      </td>
                      <td data-label="Productos">
                        {collection.products.length}
                        {published < collection.products.length && <small className="admin-hint"> ({published} publicados)</small>}
                      </td>
                      <td data-label="Estado">
                        <span className={`admin-status ${status.isOn ? 'is-on' : 'is-off'}`}>{status.label}</span>
                      </td>
                      <td className="admin-actions-cell">
                        <div className="admin-row-actions">
                          {status.isOn && (
                            <Link className="admin-icon-button" to={`/colecciones/${collection.id}`} target="_blank" aria-label={`Ver ${collection.title} en el sitio`} title="Ver en el sitio">
                              <Icon name="external" />
                            </Link>
                          )}
                          <button type="button" className="admin-icon-button" aria-label={`Editar ${collection.title}`} title="Editar" onClick={() => setEditing(collection)}>
                            <Icon name="edit" />
                          </button>
                          <button
                            type="button"
                            className="admin-icon-button"
                            aria-label={`${collection.isActive ? 'Apagar' : 'Encender'} ${collection.title}`}
                            title={collection.isActive ? 'Apagar' : 'Encender'}
                            aria-busy={busyId === collection.id}
                            disabled={busyId === collection.id}
                            onClick={() => void toggleActive(collection)}
                          >
                            <Icon name={collection.isActive ? 'hide' : 'show'} />
                          </button>
                          <button type="button" className="admin-icon-button is-danger" aria-label={`Eliminar ${collection.title}`} title="Eliminar" onClick={() => setDeleting(collection)}>
                            <Icon name="delete" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {(creating || editing) && (
        <CollectionFormModal
          token={token}
          collection={editing}
          onClose={() => { setCreating(false); setEditing(null) }}
          onSaved={handleSaved}
        />
      )}

      {deleting && (
        <Modal title="Eliminar colección" onClose={() => { if (!busyId) setDeleting(null) }}>
          <p className="admin-confirm-text">¿Seguro que querés eliminar <strong>{deleting.title}</strong>? Los productos no se borran. Si solo querés sacarla del sitio, podés apagarla.</p>
          <div className="admin-form-actions">
            <button type="button" className="admin-secondary" disabled={Boolean(busyId)} onClick={() => setDeleting(null)}>Cancelar</button>
            <button type="button" className="admin-danger" disabled={Boolean(busyId)} onClick={() => void confirmDelete()}>
              {busyId ? 'Eliminando...' : 'Sí, eliminar'}
            </button>
          </div>
        </Modal>
      )}
    </>
  )
}
