import { useCallback, useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import AdminEmpty from '../components/AdminEmpty'
import AdminNotice from '../components/AdminNotice'
import type { Notice } from '../components/AdminNotice'
import Icon from '../components/Icon'
import Modal from '../components/Modal'
import { useAuth } from '../context/auth-context'
import { ApiRequestError, getErrorMessage as errorMessage } from '../services/api'
import { createCategory, deleteCategory, fetchCategories, updateCategory } from '../services/categories'
import type { Category } from '../types/product'

const MAX_NAME = 80

function sortByName(items: Category[]) {
  return [...items].sort((a, b) => a.name.localeCompare(b.name, 'es'))
}

interface CategoryFormModalProps {
  token: string
  category: Category | null // null = crear
  onClose: () => void
  onSaved: (category: Category, wasEdit: boolean) => void
}

function CategoryFormModal({ token, category, onClose, onSaved }: CategoryFormModalProps) {
  const isEdit = category !== null
  const [name, setName] = useState(category?.name ?? '')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (saving) return

    const trimmed = name.trim()
    if (!trimmed) return setError('Ingresá el nombre de la categoría.')
    if (trimmed.length > MAX_NAME) return setError(`El nombre no puede superar los ${MAX_NAME} caracteres.`)

    setError('')
    setSaving(true)
    try {
      const saved = isEdit ? await updateCategory(token, category.id, trimmed) : await createCategory(token, trimmed)
      onSaved(saved, isEdit)
    } catch (caught) {
      const duplicated = caught instanceof ApiRequestError && caught.status === 409
      setError(duplicated ? 'Ya existe una categoría con ese nombre.' : errorMessage(caught))
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal title={isEdit ? 'Editar categoría' : 'Nueva categoría'} onClose={saving ? () => undefined : onClose}>
      <form className="admin-form" onSubmit={(event) => void submit(event)} noValidate>
        <div className={error ? 'admin-field has-error' : 'admin-field'}>
          <label htmlFor="cf-name">Nombre *</label>
          <input id="cf-name" maxLength={MAX_NAME} value={name} onChange={(event) => setName(event.target.value)} aria-invalid={Boolean(error)} />
          {error && <span className="admin-error">{error}</span>}
        </div>

        <div className="admin-form-actions">
          <button type="button" className="admin-secondary" onClick={onClose} disabled={saving}>Cancelar</button>
          <button type="submit" className="admin-primary" disabled={saving}>
            {saving ? 'Guardando...' : isEdit ? 'Guardar cambios' : 'Crear categoría'}
          </button>
        </div>
      </form>
    </Modal>
  )
}

export default function AdminCategoriesPage() {
  const { accessToken } = useAuth()
  const token = accessToken ?? ''

  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [reload, setReload] = useState(0)

  const [editing, setEditing] = useState<Category | null>(null)
  const [creating, setCreating] = useState(false)
  const [deleting, setDeleting] = useState<Category | null>(null)
  const [deleteBusy, setDeleteBusy] = useState(false)
  const [notice, setNotice] = useState<Notice | null>(null)

  const clearNotice = useCallback(() => setNotice(null), [])

  useEffect(() => {
    const controller = new AbortController()
    fetchCategories(controller.signal)
      .then((result) => setCategories(sortByName(result)))
      .catch((error: unknown) => {
        if (!controller.signal.aborted) setLoadError(errorMessage(error))
      })
      .finally(() => { if (!controller.signal.aborted) setLoading(false) })
    return () => controller.abort()
  }, [reload])

  function retry() {
    setLoading(true)
    setLoadError('')
    setReload((value) => value + 1)
  }

  function handleSaved(saved: Category, wasEdit: boolean) {
    setCreating(false)
    setEditing(null)
    setCategories((current) => sortByName(wasEdit
      ? current.map((item) => (item.id === saved.id ? saved : item))
      : [...current, saved]))
    setNotice({ kind: 'success', text: wasEdit ? `Se guardaron los cambios de “${saved.name}”.` : `Se creó “${saved.name}”.` })
  }

  async function confirmDelete() {
    if (!deleting) return
    setDeleteBusy(true)
    try {
      await deleteCategory(token, deleting.id)
      setCategories((current) => current.filter((item) => item.id !== deleting.id))
      setNotice({ kind: 'success', text: `Se eliminó “${deleting.name}”.` })
    } catch (error) {
      setNotice({ kind: 'error', text: errorMessage(error) })
    } finally {
      setDeleting(null)
      setDeleteBusy(false)
    }
  }

  return (
    <>
      <div className="admin-heading">
        <div>
          <h1>Categorías</h1>
          <p>Organizá el catálogo: cada producto pertenece a una categoría.</p>
        </div>
        <button type="button" className="admin-primary" onClick={() => setCreating(true)}><Icon name="plus" /> Nueva categoría</button>
      </div>

      <AdminNotice notice={notice} onClose={clearNotice} />

      <section className="admin-panel" aria-label="Listado de categorías">
        {loadError ? (
          <AdminEmpty icon="alert" title="No pudimos cargar las categorías" isError action={<button type="button" className="admin-secondary" onClick={retry}>Reintentar</button>}>
            {loadError}
          </AdminEmpty>
        ) : loading ? (
          <div className="admin-skeleton is-rows" role="status" aria-label="Cargando categorías">
            {Array.from({ length: 5 }, (_, index) => <div key={index} />)}
          </div>
        ) : categories.length === 0 ? (
          <AdminEmpty icon="categories" title="Todavía no hay categorías" action={<button type="button" className="admin-primary" onClick={() => setCreating(true)}><Icon name="plus" /> Nueva categoría</button>}>
            Creá la primera para poder asignarle productos.
          </AdminEmpty>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th scope="col">Nombre</th>
                  <th scope="col"><span className="visually-hidden">Acciones</span></th>
                </tr>
              </thead>
              <tbody>
                {categories.map((category) => (
                  <tr key={category.id}>
                    <td data-label="Nombre"><strong>{category.name}</strong></td>
                    <td className="admin-actions-cell">
                      <div className="admin-row-actions">
                        <button type="button" className="admin-icon-button" aria-label={`Editar ${category.name}`} title="Editar" onClick={() => setEditing(category)}>
                          <Icon name="edit" />
                        </button>
                        <button type="button" className="admin-icon-button is-danger" aria-label={`Eliminar ${category.name}`} title="Eliminar" onClick={() => setDeleting(category)}>
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
      </section>

      {(creating || editing) && (
        <CategoryFormModal
          token={token}
          category={editing}
          onClose={() => { setCreating(false); setEditing(null) }}
          onSaved={handleSaved}
        />
      )}

      {deleting && (
        <Modal title="Eliminar categoría" onClose={() => { if (!deleteBusy) setDeleting(null) }}>
          <p className="admin-confirm-text">
            ¿Seguro que querés eliminar <strong>{deleting.name}</strong>? Solo se pueden eliminar categorías sin productos asociados.
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
