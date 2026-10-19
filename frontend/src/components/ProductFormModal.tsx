import { useRef, useState } from 'react'
import type { ChangeEvent, FormEvent } from 'react'
import { ApiRequestError } from '../services/auth'
import { uploadImage } from '../services/images'
import { createProduct, updateProduct } from '../services/products'
import type { Category, Product, ProductInput } from '../types/product'
import Modal from './Modal'

const MAX_IMAGE_MB = 5
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']

type Errors = Partial<Record<'name' | 'category' | 'description' | 'price' | 'availableQuantity' | 'images', string>>

interface Props {
  token: string
  categories: Category[]
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

export default function ProductFormModal({ token, categories, product, onClose, onSaved }: Props) {
  const isEdit = product !== null
  const fileInput = useRef<HTMLInputElement>(null)

  const [name, setName] = useState(product?.name ?? '')
  const [categoryId, setCategoryId] = useState(product?.category?.id ?? '')
  const [description, setDescription] = useState(product?.description ?? '')
  const [price, setPrice] = useState(product ? String(product.price) : '')
  const [stock, setStock] = useState(product ? String(product.availableQuantity) : '0')
  const [isActive, setIsActive] = useState(product?.isActive ?? true)
  const [images, setImages] = useState<string[]>(product?.images ?? [])
  const [urlInput, setUrlInput] = useState('')

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
        const detail = error instanceof ApiRequestError
          ? Object.values(error.fields ?? {})[0]?.[0] ?? error.message
          : 'error inesperado.'
        problems.push(`${file.name}: ${detail}`)
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

  function makePrimary(index: number) {
    setImages((current) => [current[index], ...current.filter((_, position) => position !== index)])
  }

  function removeImage(index: number) {
    setImages((current) => current.filter((_, position) => position !== index))
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (saving || uploading) return
    setFormError('')

    const found = validate()
    setErrors(found)
    if (Object.keys(found).length > 0) return

    const input: ProductInput = {
      name: name.trim(),
      category: categoryId,
      description: description.trim(),
      images,
      price: Number(price),
      availableQuantity: Number(stock),
      isActive,
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
        setErrors(fromServer)
        setFormError(Object.keys(fromServer).length > 0 ? 'Revisá los campos marcados.' : error.message)
      } else {
        setFormError('Ocurrió un error inesperado. Intentá de nuevo.')
      }
    } finally {
      setSaving(false)
    }
  }

  const fieldClass = (key: keyof Errors) => (errors[key] ? 'admin-field has-error' : 'admin-field')

  return (
    <Modal title={isEdit ? 'Editar producto' : 'Nuevo producto'} onClose={saving ? () => undefined : onClose} wide>
      <form className="admin-form" onSubmit={(event) => void submit(event)} noValidate>
        {formError && <div className="auth-alert auth-alert-error" role="alert">{formError}</div>}

        <div className={fieldClass('name')}>
          <label htmlFor="pf-name">Nombre *</label>
          <input id="pf-name" maxLength={150} value={name} onChange={(event) => setName(event.target.value)} aria-invalid={Boolean(errors.name)} />
          {errors.name && <span className="admin-error">{errors.name}</span>}
        </div>

        <div className="admin-form-row">
          <div className={fieldClass('category')}>
            <label htmlFor="pf-category">Categoría *</label>
            <select id="pf-category" value={categoryId} onChange={(event) => setCategoryId(event.target.value)} aria-invalid={Boolean(errors.category)}>
              <option value="">Elegí una categoría</option>
              {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
            </select>
            {errors.category && <span className="admin-error">{errors.category}</span>}
          </div>
          <div className={fieldClass('price')}>
            <label htmlFor="pf-price">Precio (ARS) *</label>
            <input id="pf-price" type="number" inputMode="decimal" min={0} step="0.01" value={price} onChange={(event) => setPrice(event.target.value)} aria-invalid={Boolean(errors.price)} />
            {errors.price && <span className="admin-error">{errors.price}</span>}
          </div>
          <div className={fieldClass('availableQuantity')}>
            <label htmlFor="pf-stock">Stock *</label>
            <input id="pf-stock" type="number" inputMode="numeric" min={0} step={1} value={stock} onChange={(event) => setStock(event.target.value)} aria-invalid={Boolean(errors.availableQuantity)} />
            {errors.availableQuantity
              ? <span className="admin-error">{errors.availableQuantity}</span>
              : <span className="admin-hint">Con 0 se muestra como “Sin stock”.</span>}
          </div>
        </div>

        <div className={fieldClass('description')}>
          <label htmlFor="pf-description">Descripción *</label>
          <textarea id="pf-description" rows={4} value={description} onChange={(event) => setDescription(event.target.value)} aria-invalid={Boolean(errors.description)} />
          {errors.description && <span className="admin-error">{errors.description}</span>}
        </div>

        <div className={fieldClass('images')}>
          <label htmlFor="pf-files">Imágenes * <span className="admin-hint-inline">La primera es la principal</span></label>

          {images.length > 0 && (
            <ul className="admin-images">
              {images.map((url, index) => (
                <li key={url} className={index === 0 ? 'is-primary' : undefined}>
                  <img src={url} alt={`Imagen ${index + 1}`} />
                  {index === 0 && <span className="admin-image-badge">Principal</span>}
                  <div className="admin-image-actions">
                    {index !== 0 && <button type="button" onClick={() => makePrimary(index)}>Hacer principal</button>}
                    <button type="button" className="danger" onClick={() => removeImage(index)}>Quitar</button>
                  </div>
                </li>
              ))}
            </ul>
          )}

          <div className="admin-upload">
            <input ref={fileInput} id="pf-files" type="file" accept={ACCEPTED_TYPES.join(',')} multiple hidden onChange={(event) => void handleFiles(event)} />
            <button type="button" className="admin-secondary" disabled={uploading} onClick={() => fileInput.current?.click()}>
              {uploading ? 'Subiendo...' : '⬆ Subir imágenes'}
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
          {errors.images && <span className="admin-error">{errors.images}</span>}
        </div>

        <label className="admin-check">
          <input type="checkbox" checked={isActive} onChange={(event) => setIsActive(event.target.checked)} />
          <span><strong>Publicado</strong> — si lo desmarcás, el producto no se muestra en el sitio público.</span>
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
