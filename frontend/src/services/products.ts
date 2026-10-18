import type { ApiResponse, Product, ProductPage } from '../types/product'

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

    const response = await fetch(`/api/products?${params}`, { signal })
    if (!response.ok) {
      throw new Error(`No se pudieron cargar los productos (HTTP ${response.status}).`)
    }

    const payload: ApiResponse<ProductPage> = await response.json()
    if (!payload.success) {
      throw new Error(payload.error?.message || 'No se pudieron cargar los productos.')
    }

    const { items, total } = payload.data
    products.push(...items)

    if (items.length === 0 || products.length >= total) break
    page += 1
  }

  return products
}
