import type { Product } from './product'

// Mismos campos que GET /api/collections. Los productos vienen en el orden en que se muestran;
// el público solo recibe los publicados.
export type Collection = {
  id: string
  title: string
  description?: string
  products: Product[]
  isActive: boolean
}

// Lo que se envía al crear o modificar; `null` borra la descripción.
export type CollectionInput = {
  title: string
  description: string | null
  products: string[]
  isActive: boolean
}
