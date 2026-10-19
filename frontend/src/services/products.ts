import type { Product, ProductInput, ProductPage } from '../types/product'
import { apiRequest } from './api'

// Vite reenvía /api al backend local en el puerto 8080.
// No hacen falta credenciales MongoDB ni variables secretas en React.
const PAGE_SIZE = 100

export async function fetchProducts(signal?: AbortSignal): Promise<Product[]> {
  const products: Product[] = []
  let page = 1

  // El backend pagina los resultados. Recorremos todas las páginas para que
  // búsqueda, stock y ordenamiento abarquen todo el catálogo, no solo la primera.
  while (true) {
    const params = new URLSearchParams({
      page: String(page),
      pageSize: String(PAGE_SIZE),
      sortBy: 'publicationDate',
      sortOrder: 'desc',
    })

    const { items, total } = await apiRequest<ProductPage>(`/api/products?${params}`, { signal })
    products.push(...items)

    if (items.length === 0 || products.length >= total) break
    page += 1
  }

  return products
}

// ---- Administración (requiere token de administrador) ----

export interface AdminProductFilters {
  search?: string
  category?: string
  page: number
  pageSize: number
}

/** Lista paginada que incluye los productos desactivados. */
export function fetchAdminProducts(token: string, filters: AdminProductFilters, signal?: AbortSignal) {
  const params = new URLSearchParams({
    page: String(filters.page),
    pageSize: String(filters.pageSize),
    includeInactive: 'true',
    sortBy: 'publicationDate',
    sortOrder: 'desc',
  })
  if (filters.search) params.set('search', filters.search)
  if (filters.category) params.set('category', filters.category)
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

