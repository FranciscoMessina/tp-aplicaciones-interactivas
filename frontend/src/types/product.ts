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
  // Precio de lista; el que se paga es `finalPrice`, con el descuento aplicado.
  price: number
  discountPercent: number
  finalPrice: number
  availableQuantity: number
  isActive: boolean
  isFeatured: boolean
  createdAt: string
  // La promoción que le baja el precio hoy (por estar en su colección), o null. Cuando hay una,
  // `finalPrice` ya tiene aplicado su descuento.
  promotion?: AppliedPromotion | null
}

export type AppliedPromotion = {
  id: string
  title: string
  discountPercent: number
  collection: string
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
  discountPercent: number
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

// GET /api/products agrega el precio final más bajo y más alto con los filtros
// actuales salvo el de precio (`null` si no hay productos).
export type ProductPage = Page<Product> & {
  priceRange: { min: number; max: number } | null
}
