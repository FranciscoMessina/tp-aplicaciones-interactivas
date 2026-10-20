// Los nombres de campos coinciden con GET /api/products del backend.
export type Product = {
  id: string
  name: string
  category: {
    id: string
    name: string
  }
  description: string
  images: string[]
  price: number
  availableQuantity: number
  isActive: boolean
  isFeatured: boolean
  createdAt: string
}

export type Category = {
  id: string
  name: string
}

// GET /api/categories/summary: solo cuenta productos publicados.
export type CategorySummary = Category & {
  productCount: number
  minPrice: number
  examples: string[]
}

// Lo que se envía al crear o modificar un producto (POST / PATCH /api/products).
export type ProductInput = {
  name: string
  category: string
  description: string
  images: string[]
  price: number
  availableQuantity: number
  isActive: boolean
  isFeatured: boolean
}

// Forma de todos los listados paginados de la API.
export type Page<T> = {
  items: T[]
  page: number
  pageSize: number
  total: number
}

export type ProductPage = Page<Product>
