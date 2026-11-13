import type { Category } from './product'

// De la colección vinculada solo viaja lo que muestra el aviso.
export type PromotionCollection = { id: string; title: string; isActive: boolean }

// Mismos campos que GET /api/promotions. Las fechas son AAAA-MM-DD.
export type Promotion = {
  id: string
  title: string
  description: string
  image?: string
  category?: Category | null
  linkedCollection?: PromotionCollection | null
  // Solo con colección: descuento para todos sus productos mientras la promoción esté vigente.
  discountPercent?: number
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
  linkedCollection: string | null
  discountPercent: number | null
  startDate: string | null
  endDate: string | null
  isActive: boolean
}
