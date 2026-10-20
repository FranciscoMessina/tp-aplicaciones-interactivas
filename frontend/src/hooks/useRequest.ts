import { useEffect, useState } from 'react'
import { getErrorMessage } from '../services/api'

/**
 * Carga datos de la API y expone carga, error y reintento. Vuelve a pedir
 * cuando cambia `key`, que resume los parámetros de la petición; si cambia
 * antes de que termine, la petición anterior se cancela.
 */
export function useRequest<T>(load: (signal: AbortSignal) => Promise<T>, key: string) {
  const [data, setData] = useState<T | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [retryCount, setRetryCount] = useState(0)

  useEffect(() => {
    const controller = new AbortController()
    setIsLoading(true)
    setError('')
    load(controller.signal)
      .then((result) => { if (!controller.signal.aborted) setData(result) })
      .catch((cause: unknown) => { if (!controller.signal.aborted) setError(getErrorMessage(cause)) })
      .finally(() => { if (!controller.signal.aborted) setIsLoading(false) })
    return () => controller.abort()
    // `load` se arma en cada render; lo que define la petición es `key`.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, retryCount])

  const retry = () => setRetryCount((previous) => previous + 1)

  return { data, isLoading, error, retry }
}
