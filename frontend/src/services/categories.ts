import type { Category } from '../types/product'
import { apiRequest } from './api'

export function fetchCategories(signal?: AbortSignal) {
  return apiRequest<Category[]>('/api/categories', { signal })
}
