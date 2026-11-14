import type { ProductFilters } from '../services/products'

// Cada opción del selector "Ordenar por" (catálogo y panel) y cómo se la pide al backend.
// "Relevancia" solo existe cuando hay texto buscado: el backend la rechaza sin `search`.
export const sortOptions: Record<
  string,
  { label: string; sortBy: ProductFilters['sortBy']; sortOrder: ProductFilters['sortOrder'] }
> = {
  relevance: { label: 'Relevancia', sortBy: 'relevance', sortOrder: 'desc' },
  recent: { label: 'Más recientes', sortBy: 'publicationDate', sortOrder: 'desc' },
  'price-asc': { label: 'Menor precio', sortBy: 'price', sortOrder: 'asc' },
  'price-desc': { label: 'Mayor precio', sortBy: 'price', sortOrder: 'desc' },
  name: { label: 'Nombre (A-Z)', sortBy: 'name', sortOrder: 'asc' },
}

/**
 * El orden que corresponde a lo pedido en la URL. El orden por defecto no se escribe en la
 * URL: relevancia con búsqueda, más recientes sin ella. Un valor desconocido, o "relevancia"
 * sin texto buscado, cae al orden por defecto.
 */
export function resolveSort(requested: string | null, search: string) {
  const defaultSort = search ? 'relevance' : 'recent'
  const isValid =
    requested !== null && sortOptions[requested] && (requested !== 'relevance' || search)
  const sort = isValid ? requested : defaultSort
  // Las opciones que se ofrecen en el selector.
  const options = Object.entries(sortOptions).filter(([value]) => value !== 'relevance' || search)

  return { sort, defaultSort, options }
}
