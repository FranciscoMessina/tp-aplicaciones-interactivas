import type { Category } from './product'

// Mismos campos que GET /api/promotions. Las fechas son AAAA-MM-DD.
export type Promotion = {
  id: string
  title: string
  description: string
  image?: string
  category?: Category | null
  startDate?: string
  endDate?: string
  isActive: boolean
}

// Lo que se envía al crear o modificar; `null` borra el campo.
export type PromotionInput = {
  title: string
  description: string
  image: string | null
  category: string | null
  startDate: string | null
  endDate: string | null
  isActive: boolean
}
