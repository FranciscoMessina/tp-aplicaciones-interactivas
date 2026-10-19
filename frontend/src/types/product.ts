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
  createdAt: string
}

export type Category = {
  id: string
  name: string
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
}

export type ProductPage = {
  items: Product[]
  page: number
  pageSize: number
  total: number
}
