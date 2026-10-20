import type { Product, ProductInput, ProductPage } from '../types/product'
import { apiRequest } from './api'

// Vite reenvía /api al backend local en el puerto 8080.
// No hacen falta credenciales MongoDB ni variables secretas en React.

export interface ProductFilters {
  search?: string
  category?: string
  isFeatured?: boolean
  inStock?: boolean
  sortBy?: 'publicationDate' | 'price' | 'name'
  sortOrder?: 'asc' | 'desc'
  page: number
  pageSize: number
}

// El backend filtra, ordena y pagina: solo viaja la página que se muestra.
function toQuery(filters: ProductFilters & { isActive?: boolean }) {
  const params = new URLSearchParams({
    page: String(filters.page),
    pageSize: String(filters.pageSize),
    sortBy: filters.sortBy ?? 'publicationDate',
    sortOrder: filters.sortOrder ?? 'desc',
  })
  if (filters.search) params.set('search', filters.search)
  if (filters.category) params.set('category', filters.category)
  for (const key of ['isActive', 'isFeatured', 'inStock'] as const) {
    if (filters[key] !== undefined) params.set(key, String(filters[key]))
  }
  return params
}

/** Una página del catálogo publicado. */
export function fetchProducts(filters: ProductFilters, signal?: AbortSignal) {
  return apiRequest<ProductPage>(`/api/products?${toQuery(filters)}`, { signal })
}

/** Un producto publicado; los ocultos responden 404. */
export function fetchProduct(id: string, signal?: AbortSignal) {
  return apiRequest<Product>(`/api/products/${id}`, { signal })
}

// ---- Administración (requiere token de administrador) ----

/** Lista paginada que incluye los productos desactivados. */
export function fetchAdminProducts(token: string, filters: ProductFilters & { isActive?: boolean }, signal?: AbortSignal) {
  const params = toQuery(filters)
  params.set('includeInactive', 'true')
  return apiRequest<ProductPage>(`/api/products?${params}`, { token, signal })
}

export function createProduct(token: string, input: ProductInput) {
  return apiRequest<Product>('/api/products', { method: 'POST', token, body: input })
}

export function updateProduct(token: string, id: string, changes: Partial<ProductInput>) {
  return apiRequest<Product>(`/api/products/${id}`, { method: 'PATCH', token, body: changes })
}

export function deleteProduct(token: string, id: string) {
  return apiRequest<void>(`/api/products/${id}`, { method: 'DELETE', token })
}

