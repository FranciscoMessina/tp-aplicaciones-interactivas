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

export type ProductPage = {
  items: Product[]
  page: number
  pageSize: number
  total: number
}

export type ApiResponse<T> =
  | { success: true; data: T }
  | { success: false; error?: { message?: string } }
