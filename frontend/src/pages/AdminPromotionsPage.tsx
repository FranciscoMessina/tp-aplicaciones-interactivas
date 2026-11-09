import { useCallback, useEffect, useRef, useState } from 'react'
import type { ChangeEvent, FormEvent } from 'react'
import AdminEmpty from '../components/AdminEmpty'
import AdminNotice from '../components/AdminNotice'
import type { Notice } from '../components/AdminNotice'
import Icon from '../components/Icon'
import Modal from '../components/Modal'
import { useAuth } from '../context/auth-context'
import { getErrorMessage as errorMessage } from '../services/api'
import { fetchCategories } from '../services/categories'
import { uploadImage } from '../services/images'
import { createPromotion, deletePromotion, fetchAdminPromotions, updatePromotion } from '../services/promotions'
import type { Category } from '../types/product'
import type { Promotion, PromotionInput } from '../types/promotion'
import { formatDay } from '../utils/format'

// Mismo día que usa el backend para decidir qué promociones están vigentes.
const today = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Argentina/Buenos_Aires' }).format(new Date())

// Lo que ve hoy un visitante de cada promoción.
function promotionStatus(promotion: Promotion): { label: string; isOn: boolean } {
  const day = today()
  if (!promotion.isActive) return { label: 'Apagada', isOn: false }
  if (promotion.startDate && promotion.startDate > day) return { label: `Empieza el ${formatDay(promotion.startDate)}`, isOn: false }
  if (promotion.endDate && promotion.endDate < day) return { label: 'Vencida', isOn: false }
  return { label: 'Visible en el sitio', isOn: true }
}

function validity(promotion: Promotion) {
  if (promotion.startDate && promotion.endDate) return `${formatDay(promotion.startDate)} al ${formatDay(promotion.endDate)}`
  if (promotion.startDate) return `Desde el ${formatDay(promotion.startDate)}`
  if (promotion.endDate) return `Hasta el ${formatDay(promotion.endDate)}`
  return 'Sin fechas'
}

interface PromotionFormModalProps {
  token: string
  categories: Category[]
  promotion: Promotion | null // null = crear
  onClose: () => void
  onSaved: (promotion: Promotion, wasEdit: boolean) => void
}

function PromotionFormModal({ token, categories, promotion, onClose, onSaved }: PromotionFormModalProps) {
  const isEdit = promotion !== null
  const fileInput = useRef<HTMLInputElement>(null)
  const [title, setTitle] = useState(promotion?.title ?? '')
  const [description, setDescription] = useState(promotion?.description ?? '')
  const [image, setImage] = useState(promotion?.image ?? '')
  const [categoryId, setCategoryId] = useState(promotion?.category?.id ?? '')
  const [startDate, setStartDate] = useState(promotion?.startDate ?? '')
  const [endDate, setEndDate] = useState(promotion?.endDate ?? '')
  const [isActive, setIsActive] = useState(promotion?.isActive ?? true)
  const [error, setError] = useState('')
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)

  async function handleFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    setUploading(true)
    setError('')
    try {
      setImage(await uploadImage(token, file))
    } catch (caught) {
      setError(errorMessage(caught))
    } finally {
      setUploading(false)
    }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (saving || uploading) return

    if (!title.trim() || !description.trim()) return setError('Completá el título y la descripción.')
    if (startDate && endDate && startDate > endDate) return setError('La fecha de fin tiene que ser igual o posterior a la de inicio.')

    const input: PromotionInput = {
      title: title.trim(),
      description: description.trim(),
      image: image || null,
      category: categoryId || null,
      startDate: startDate || null,
      endDate: endDate || null,
      isActive,
    }

    setError('')
    setSaving(true)
    try {
      const saved = isEdit ? await updatePromotion(token, promotion.id, input) : await createPromotion(token, input)
      onSaved(saved, isEdit)
    } catch (caught) {
      setError(errorMessage(caught))
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal title={isEdit ? 'Editar promoción' : 'Nueva promoción'} onClose={saving ? () => undefined : onClose} wide>
      <form className="admin-form" onSubmit={(event) => void submit(event)} noValidate>
        {error && <p className="admin-alert is-error" role="alert">{error}</p>}

        <div className="admin-field">
          <label htmlFor="pr-title">Título *</label>
          <input id="pr-title" maxLength={80} value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Ej.: Semana del audio" />
        </div>

        <div className="admin-field">
          <label htmlFor="pr-description">Descripción *</label>
          <textarea id="pr-description" rows={3} maxLength={300} value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Contá de qué se trata y hasta cuándo vale." />
        </div>

        <div className="admin-form-row">
          <div className="admin-field">
            <label htmlFor="pr-category">Lleva a</label>
            <select id="pr-category" value={categoryId} onChange={(event) => setCategoryId(event.target.value)}>
              <option value="">Productos en oferta</option>
              {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
            </select>
          </div>
          <div className="admin-field">
            <label htmlFor="pr-start">Desde</label>
            <input id="pr-start" type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} />
          </div>
          <div className="admin-field">
            <label htmlFor="pr-end">Hasta</label>
            <input id="pr-end" type="date" value={endDate} min={startDate || undefined} onChange={(event) => setEndDate(event.target.value)} />
          </div>
        </div>
        <span className="admin-hint">Las dos fechas son opcionales: sin fechas, la promoción se ve mientras esté encendida.</span>

        <div className="admin-field">
          <label htmlFor="pr-file">Imagen <span className="admin-hint-inline">Opcional</span></label>
          {image && (
            <ul className="admin-images">
              <li>
                <img src={image} alt="Imagen de la promoción" />
                <div className="admin-image-actions">
                  <button type="button" className="admin-icon-button is-danger" aria-label="Quitar la imagen" title="Quitar" onClick={() => setImage('')}>
                    <Icon name="delete" />
                  </button>
                </div>
              </li>
            </ul>
          )}
          <div className="admin-upload">
            <input ref={fileInput} id="pr-file" type="file" accept="image/jpeg,image/png,image/webp,image/gif" hidden onChange={(event) => void handleFile(event)} />
            <button type="button" className="admin-secondary" disabled={uploading} onClick={() => fileInput.current?.click()}>
              {uploading ? 'Subiendo...' : image ? 'Cambiar imagen' : 'Subir imagen'}
            </button>
            <span className="admin-hint">JPG, PNG, WEBP o GIF · máx. 5 MB</span>
          </div>
        </div>

        <label className="admin-check">
          <input type="checkbox" checked={isActive} onChange={(event) => setIsActive(event.target.checked)} />
          <span><strong>Encendida</strong> — se muestra en el inicio del sitio dentro de sus fechas.</span>
        </label>

        <div className="admin-form-actions">
          <button type="button" className="admin-secondary" onClick={onClose} disabled={saving}>Cancelar</button>
          <button type="submit" className="admin-primary" disabled={saving || uploading}>
            {saving ? 'Guardando...' : isEdit ? 'Guardar cambios' : 'Crear promoción'}
          </button>
        </div>
      </form>
    </Modal>
  )
}

export default function AdminPromotionsPage() {
  const { accessToken } = useAuth()
  const token = accessToken ?? ''

  const [promotions, setPromotions] = useState<Promotion[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [reload, setReload] = useState(0)

  const [editing, setEditing] = useState<Promotion | null>(null)
  const [creating, setCreating] = useState(false)
  const [deleting, setDeleting] = useState<Promotion | null>(null)
  const [busyId, setBusyId] = useState('')
  const [notice, setNotice] = useState<Notice | null>(null)

  const clearNotice = useCallback(() => setNotice(null), [])

  useEffect(() => {
    const controller = new AbortController()
    Promise.all([fetchAdminPromotions(token, controller.signal), fetchCategories(controller.signal)])
      .then(([promotionList, categoryList]) => {
        setPromotions(promotionList)
        setCategories(categoryList)
      })
      .catch((error: unknown) => { if (!controller.signal.aborted) setLoadError(errorMessage(error)) })
      .finally(() => { if (!controller.signal.aborted) setLoading(false) })
    return () => controller.abort()
  }, [token, reload])

  function retry() {
    setLoading(true)
    setLoadError('')
    setReload((value) => value + 1)
  }

  function handleSaved(saved: Promotion, wasEdit: boolean) {
    setCreating(false)
    setEditing(null)
    setPromotions((current) => wasEdit ? current.map((item) => (item.id === saved.id ? saved : item)) : [saved, ...current])
    setNotice({ kind: 'success', text: wasEdit ? `Se guardaron los cambios de “${saved.title}”.` : `Se creó “${saved.title}”.` })
  }

  async function toggleActive(promotion: Promotion) {
    setBusyId(promotion.id)
    try {
      const updated = await updatePromotion(token, promotion.id, { isActive: !promotion.isActive })
      setPromotions((current) => current.map((item) => (item.id === updated.id ? updated : item)))
      setNotice({ kind: 'success', text: `“${promotion.title}” ${updated.isActive ? 'se encendió' : 'se apagó y ya no se ve en el sitio'}.` })
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
      await deletePromotion(token, deleting.id)
      setPromotions((current) => current.filter((item) => item.id !== deleting.id))
      setNotice({ kind: 'success', text: `Se eliminó “${deleting.title}”.` })
    } catch (error) {
      setNotice({ kind: 'error', text: errorMessage(error) })
    } finally {
      setDeleting(null)
      setBusyId('')
    }
  }

  const newButton = <button type="button" className="admin-primary" onClick={() => setCreating(true)}><Icon name="plus" /> Nueva promoción</button>

  return (
    <>
      <div className="admin-heading">
        <div>
          <h1>Promociones</h1>
          <p>Avisos que se muestran en el inicio. Los descuentos de cada producto se cargan en Productos.</p>
        </div>
        {newButton}
      </div>

      <AdminNotice notice={notice} onClose={clearNotice} />

      <section className="admin-panel" aria-label="Listado de promociones">
        {loadError ? (
          <AdminEmpty icon="alert" title="No pudimos cargar las promociones" isError action={<button type="button" className="admin-secondary" onClick={retry}>Reintentar</button>}>
            {loadError}
          </AdminEmpty>
        ) : loading ? (
          <div className="admin-skeleton is-rows" role="status" aria-label="Cargando promociones">
            {Array.from({ length: 3 }, (_, index) => <div key={index} />)}
          </div>
        ) : promotions.length === 0 ? (
          <AdminEmpty icon="promotions" title="Todavía no hay promociones" action={newButton}>
            Creá la primera, por ejemplo “2x1 en auriculares todo noviembre”.
          </AdminEmpty>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th scope="col">Promoción</th>
                  <th scope="col">Lleva a</th>
                  <th scope="col">Vigencia</th>
                  <th scope="col">Estado</th>
                  <th scope="col"><span className="visually-hidden">Acciones</span></th>
                </tr>
              </thead>
              <tbody>
                {promotions.map((promotion) => {
                  const status = promotionStatus(promotion)
                  return (
                    <tr key={promotion.id} className={status.isOn ? undefined : 'is-inactive'}>
                      <td data-label="Producto">
                        <div className="admin-product-cell">
                          {promotion.image
                            ? <img src={promotion.image} alt="" loading="lazy" />
                            : <span className="admin-thumb-placeholder" aria-hidden="true"><Icon name="promotions" /></span>}
                          <div>
                            <strong>{promotion.title}</strong>
                            <small>{promotion.description}</small>
                          </div>
                        </div>
                      </td>
                      <td data-label="Lleva a">{promotion.category?.name ?? 'Ofertas'}</td>
                      <td data-label="Vigencia">{validity(promotion)}</td>
                      <td data-label="Estado">
                        <span className={`admin-status ${status.isOn ? 'is-on' : 'is-off'}`}>{status.label}</span>
                      </td>
                      <td className="admin-actions-cell">
                        <div className="admin-row-actions">
                          <button type="button" className="admin-icon-button" aria-label={`Editar ${promotion.title}`} title="Editar" onClick={() => setEditing(promotion)}>
                            <Icon name="edit" />
                          </button>
                          <button
                            type="button"
                            className="admin-icon-button"
                            aria-label={`${promotion.isActive ? 'Apagar' : 'Encender'} ${promotion.title}`}
                            title={promotion.isActive ? 'Apagar' : 'Encender'}
                            aria-busy={busyId === promotion.id}
                            disabled={busyId === promotion.id}
                            onClick={() => void toggleActive(promotion)}
                          >
                            <Icon name={promotion.isActive ? 'hide' : 'show'} />
                          </button>
                          <button type="button" className="admin-icon-button is-danger" aria-label={`Eliminar ${promotion.title}`} title="Eliminar" onClick={() => setDeleting(promotion)}>
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
        <PromotionFormModal
          token={token}
          categories={categories}
          promotion={editing}
          onClose={() => { setCreating(false); setEditing(null) }}
          onSaved={handleSaved}
        />
      )}

      {deleting && (
        <Modal title="Eliminar promoción" onClose={() => { if (!busyId) setDeleting(null) }}>
          <p className="admin-confirm-text">¿Seguro que querés eliminar <strong>{deleting.title}</strong>? Si solo querés sacarla del sitio, podés apagarla.</p>
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
