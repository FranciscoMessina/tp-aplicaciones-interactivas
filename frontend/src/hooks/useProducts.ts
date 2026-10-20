import { useEffect, useState } from 'react'
import { fetchProducts } from '../services/products'
import type { Product } from '../types/product'

// Catálogo publicado completo. Lo usan el inicio y la página de catálogo.
export function useProducts() {
  const [products, setProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [retryCount, setRetryCount] = useState(0)

  useEffect(() => {
    const controller = new AbortController()

    async function loadProducts() {
      setIsLoading(true)
      setError('')
      try {
        const result = await fetchProducts(controller.signal)
        if (!controller.signal.aborted) setProducts(result)
      } catch (cause) {
        if (!controller.signal.aborted) {
          setError(cause instanceof Error ? cause.message : 'No se pudieron cargar los productos.')
        }
      } finally {
        if (!controller.signal.aborted) setIsLoading(false)
      }
    }

    void loadProducts()
    return () => controller.abort()
  }, [retryCount])

  const retry = () => setRetryCount((previous) => previous + 1)

  return { products, isLoading, error, retry }
}
