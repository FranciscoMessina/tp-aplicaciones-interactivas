import { useRef, useState } from 'react'
import type { ChangeEvent, FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { ApiRequestError, getErrorMessage } from '../services/api'
import { uploadImage } from '../services/images'
import { createProduct, updateProduct } from '../services/products'
import type { Category, Product, ProductInput } from '../types/product'
import Icon from './Icon'
import Modal from './Modal'

const MAX_IMAGE_MB = 5
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']

type Errors = Partial<Record<'name' | 'category' | 'description' | 'price' | 'availableQuantity' | 'images', string>>

export type CategoriesState = 'loading' | 'ready' | 'error'

// Id del control de cada campo, en el orden del formulario: sirve para asociar el
// mensaje de error (aria-describedby) y para enfocar el primer campo inválido.
const fieldIds = {
  name: 'pf-name',
  category: 'pf-category',
  price: 'pf-price',
  availableQuantity: 'pf-stock',
  description: 'pf-description',
  images: 'pf-upload',
} as const

interface Props {
  token: string
  categories: Category[]
  categoriesState: CategoriesState
  onRetryCategories: () => void
  product: Product | null // null = crear
  onClose: () => void
  onSaved: (product: Product, wasEdit: boolean) => void
}

function isHttpUrl(value: string) {
  try {
    return ['http:', 'https:'].includes(new URL(value).protocol)
  } catch {
    return false
  }
}

export default function ProductFormModal({ token, categories, categoriesState, onRetryCategories, product, onClose, onSaved }: Props) {
  const isEdit = product !== null
  const fileInput = useRef<HTMLInputElement>(null)

  const [name, setName] = useState(product?.name ?? '')
  const [categoryId, setCategoryId] = useState(product?.category?.id ?? '')
  const [description, setDescription] = useState(product?.description ?? '')
  const [price, setPrice] = useState(product ? String(product.price) : '')
  const [stock, setStock] = useState(product ? String(product.availableQuantity) : '0')
  const [isActive, setIsActive] = useState(product?.isActive ?? true)
  const [isFeatured, setIsFeatured] = useState(product?.isFeatured ?? false)
  const [images, setImages] = useState<string[]>(product?.images ?? [])
  const [urlInput, setUrlInput] = useState('')
  // Reordenar con arrastrar y soltar: la imagen que se arrastra y sobre cuál se va a soltar.
  const [dragIndex, setDragIndex] = useState<number | null>(null)
  const [dropIndex, setDropIndex] = useState<number | null>(null)

  const [errors, setErrors] = useState<Errors>({})
  const [formError, setFormError] = useState('')
  const [uploadError, setUploadError] = useState('')
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)

  function validate(): Errors {
    const found: Errors = {}
    if (!name.trim()) found.name = 'Ingresá el nombre del producto.'
    else if (name.trim().length > 150) found.name = 'El nombre no puede superar los 150 caracteres.'
    if (!categoryId) found.category = 'Elegí una categoría.'
    if (!description.trim()) found.description = 'Ingresá una descripción.'
    if (price.trim() === '' || Number.isNaN(Number(price))) found.price = 'Ingresá un precio válido.'
    else if (Number(price) < 0) found.price = 'El precio no puede ser negativo.'
    if (stock.trim() === '' || !Number.isInteger(Number(stock)) || Number(stock) < 0) {
      found.availableQuantity = 'Ingresá una cantidad entera (0 o más).'
    }
    if (images.length === 0) found.images = 'Agregá al menos una imagen.'
    return found
  }

  async function handleFiles(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? [])
    event.target.value = ''
    if (files.length === 0) return

    setUploadError('')
    setUploading(true)
    const problems: string[] = []
    const uploaded: string[] = []

    for (const file of files) {
      if (!ACCEPTED_TYPES.includes(file.type)) {
        problems.push(`${file.name}: debe ser JPG, PNG, WEBP o GIF.`)
        continue
      }
      if (file.size > MAX_IMAGE_MB * 1024 * 1024) {
        problems.push(`${file.name}: no puede pesar más de ${MAX_IMAGE_MB} MB.`)
        continue
      }
      try {
        uploaded.push(await uploadImage(token, file))
      } catch (error) {
        problems.push(`${file.name}: ${getErrorMessage(error)}`)
      }
    }

    if (uploaded.length > 0) {
      setImages((current) => [...current, ...uploaded])
      setErrors((current) => ({ ...current, images: undefined }))
    }
    setUploadError(problems.join(' '))
    setUploading(false)
  }

  function addUrl() {
    const value = urlInput.trim()
    if (!value) return
    if (!isHttpUrl(value)) { setUploadError('La URL de la imagen no es válida (debe empezar con http:// o https://).'); return }
    if (images.includes(value)) { setUploadError('Esa imagen ya está en la lista.'); return }
    setUploadError('')
    setImages((current) => [...current, value])
    setErrors((current) => ({ ...current, images: undefined }))
    setUrlInput('')
  }

  // Saca la imagen de su lugar y la inserta en `to`; la primera es la principal.
  function moveImage(from: number, to: number) {
    if (from === to) return
    setImages((current) => {
      const next = [...current]
      const [moved] = next.splice(from, 1)
      next.splice(to, 0, moved)
      return next
    })
  }

  function endDrag() {
    setDragIndex(null)
    setDropIndex(null)
  }

  function removeImage(index: number) {
    setImages((current) => current.filter((_, position) => position !== index))
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (saving || uploading) return
    setFormError('')

    const found = validate()
    showErrors(found)
    if (Object.keys(found).length > 0) return

    const input: ProductInput = {
      name: name.trim(),
      category: categoryId,
      description: description.trim(),
      images,
      price: Number(price),
      availableQuantity: Number(stock),
      isActive,
      isFeatured,
    }

    setSaving(true)
    try {
      const saved = isEdit ? await updateProduct(token, product.id, input) : await createProduct(token, input)
      onSaved(saved, isEdit)
    } catch (error) {
      if (error instanceof ApiRequestError) {
        // Errores por campo que devuelve el backend (validación de Zod).
        const fields = error.fields ?? {}
        const fromServer: Errors = {}
        for (const key of ['name', 'category', 'description', 'price', 'availableQuantity'] as const) {
          if (fields[key]?.[0]) fromServer[key] = fields[key][0]
        }
        const imagesKey = Object.keys(fields).find((key) => key.startsWith('images'))
        if (imagesKey) fromServer.images = fields[imagesKey][0]
        showErrors(fromServer)
        setFormError(Object.keys(fromServer).length > 0 ? 'Revisá los campos marcados.' : error.message)
      } else {
        setFormError('Ocurrió un error inesperado. Intentá de nuevo.')
      }
    } finally {
      setSaving(false)
    }
  }

  // Muestra los errores y lleva el foco al primero, para que se lea su mensaje.
  function showErrors(found: Errors) {
    setErrors(found)
    const first = (Object.keys(fieldIds) as (keyof Errors)[]).find((key) => found[key])
    if (first) document.getElementById(fieldIds[first])?.focus()
  }

  const errorProps = (key: keyof Errors) => ({
    'aria-invalid': Boolean(errors[key]),
    'aria-describedby': errors[key] ? `${fieldIds[key]}-error` : undefined,
  })

  const fieldClass = (key: keyof Errors) => (errors[key] ? 'admin-field has-error' : 'admin-field')

  return (
    <Modal title={isEdit ? 'Editar producto' : 'Nuevo producto'} onClose={saving ? () => undefined : onClose} wide>
      <form className="admin-form" onSubmit={(event) => void submit(event)} noValidate>
        {formError && <p className="admin-alert is-error" role="alert">{formError}</p>}

        <div className={fieldClass('name')}>
          <label htmlFor="pf-name">Nombre *</label>
          <input id="pf-name" maxLength={150} value={name} onChange={(event) => setName(event.target.value)} {...errorProps('name')} />
          {errors.name && <span id={`${fieldIds.name}-error`} className="admin-error">{errors.name}</span>}
        </div>

        <div className="admin-form-row">
          <div className={fieldClass('category')}>
            <label htmlFor="pf-category">Categoría *</label>
            <select id="pf-category" value={categoryId} onChange={(event) => setCategoryId(event.target.value)} disabled={categoriesState !== 'ready'} {...errorProps('category')}>
              <option value="">{categoriesState === 'loading' ? 'Cargando categorías...' : 'Elegí una categoría'}</option>
              {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
            </select>
            {errors.category && <span id={`${fieldIds.category}-error`} className="admin-error">{errors.category}</span>}
            {categoriesState === 'error' && (
              <span className="admin-error" role="alert">
                No se pudieron cargar las categorías. <button type="button" className="admin-text-link" onClick={onRetryCategories}>Reintentar</button>
              </span>
            )}
            {categoriesState === 'ready' && categories.length === 0 && (
              <span className="admin-hint">Todavía no hay categorías. <Link to="/admin/categorias">Creá una</Link> para poder cargar productos.</span>
            )}
          </div>
          <div className={fieldClass('price')}>
            <label htmlFor="pf-price">Precio (ARS) *</label>
            <input id="pf-price" type="number" inputMode="decimal" min={0} step="0.01" value={price} onChange={(event) => setPrice(event.target.value)} {...errorProps('price')} />
            {errors.price && <span id={`${fieldIds.price}-error`} className="admin-error">{errors.price}</span>}
          </div>
          <div className={fieldClass('availableQuantity')}>
            <label htmlFor="pf-stock">Stock *</label>
            <input id="pf-stock" type="number" inputMode="numeric" min={0} step={1} value={stock} onChange={(event) => setStock(event.target.value)} {...errorProps('availableQuantity')} />
            {errors.availableQuantity
              ? <span id={`${fieldIds.availableQuantity}-error`} className="admin-error">{errors.availableQuantity}</span>
              : <span className="admin-hint">Con 0 se muestra como “Sin stock”.</span>}
          </div>
        </div>

        <div className={fieldClass('description')}>
          <label htmlFor="pf-description">Descripción *</label>
          <textarea id="pf-description" rows={4} value={description} onChange={(event) => setDescription(event.target.value)} {...errorProps('description')} />
          {errors.description && <span id={`${fieldIds.description}-error`} className="admin-error">{errors.description}</span>}
        </div>

        <div className={fieldClass('images')}>
          <label htmlFor="pf-files">Imágenes * <span className="admin-hint-inline">Arrastralas para ordenarlas. La primera es la principal.</span></label>

          {images.length > 0 && (
            <ul className="admin-images">
              {images.map((url, index) => (
                <li
                  key={url}
                  className={[
                    index === 0 && 'is-primary',
                    index === dragIndex && 'is-dragging',
                    index === dropIndex && index !== dragIndex && 'is-drop-target',
                  ].filter(Boolean).join(' ') || undefined}
                  draggable
                  onDragStart={(event) => {
                    event.dataTransfer.effectAllowed = 'move'
                    event.dataTransfer.setData('text/plain', String(index))
                    setDragIndex(index)
                  }}
                  onDragOver={(event) => {
                    if (dragIndex === null) return
                    event.preventDefault()
                    if (dropIndex !== index) setDropIndex(index)
                  }}
                  onDrop={(event) => {
                    event.preventDefault()
                    if (dragIndex !== null) moveImage(dragIndex, index)
                    endDrag()
                  }}
                  onDragEnd={endDrag}
                >
                  <img src={url} alt={`Imagen ${index + 1}`} draggable={false} />
                  {index === 0 && <span className="admin-image-badge">Principal</span>}
                  {/* Alternativa al arrastre para teclado y pantallas táctiles. */}
                  <div className="admin-image-actions">
                    <button type="button" className="admin-icon-button" aria-label={index === 1 ? `Hacer principal la imagen ${index + 1}` : `Mover antes la imagen ${index + 1}`} title={index === 1 ? 'Hacer principal' : 'Mover antes'} disabled={index === 0} onClick={() => moveImage(index, index - 1)}>
                      <Icon name="back" />
                    </button>
                    <button type="button" className="admin-icon-button" aria-label={`Mover después la imagen ${index + 1}`} title="Mover después" disabled={index === images.length - 1} onClick={() => moveImage(index, index + 1)}>
                      <Icon name="forward" />
                    </button>
                    <button type="button" className="admin-icon-button is-danger" aria-label={`Quitar la imagen ${index + 1}`} title="Quitar" onClick={() => removeImage(index)}>
                      <Icon name="delete" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}

          <div className="admin-upload">
            <input ref={fileInput} id="pf-files" type="file" accept={ACCEPTED_TYPES.join(',')} multiple hidden onChange={(event) => void handleFiles(event)} />
            <button id={fieldIds.images} type="button" className="admin-secondary" disabled={uploading} onClick={() => fileInput.current?.click()} aria-describedby={errors.images ? `${fieldIds.images}-error` : undefined}>
              {uploading ? 'Subiendo...' : 'Subir imágenes'}
            </button>
            <span className="admin-hint">JPG, PNG, WEBP o GIF · máx. {MAX_IMAGE_MB} MB c/u</span>
          </div>

          <div className="admin-url-row">
            <input
              type="url"
              placeholder="…o pegá la URL de una imagen"
              aria-label="URL de una imagen"
              value={urlInput}
              onChange={(event) => setUrlInput(event.target.value)}
              onKeyDown={(event) => { if (event.key === 'Enter') { event.preventDefault(); addUrl() } }}
            />
            <button type="button" className="admin-secondary" onClick={addUrl}>Agregar</button>
          </div>

          {uploadError && <span className="admin-error" role="alert">{uploadError}</span>}
          {errors.images && <span id={`${fieldIds.images}-error`} className="admin-error">{errors.images}</span>}
        </div>

        <label className="admin-check">
          <input type="checkbox" checked={isActive} onChange={(event) => setIsActive(event.target.checked)} />
          <span><strong>Publicado</strong> — si lo desmarcás, el producto no se muestra en el sitio público.</span>
        </label>

        <label className="admin-check">
          <input type="checkbox" checked={isFeatured} onChange={(event) => setIsFeatured(event.target.checked)} />
          <span><strong>Destacado</strong> — aparece en la sección de destacados de la página de inicio.</span>
        </label>

        <div className="admin-form-actions">
          <button type="button" className="admin-secondary" onClick={onClose} disabled={saving}>Cancelar</button>
          <button type="submit" className="admin-primary" disabled={saving || uploading}>
            {saving ? 'Guardando...' : isEdit ? 'Guardar cambios' : 'Crear producto'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
