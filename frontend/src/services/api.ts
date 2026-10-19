import type { ApiEnvelope } from '../types/auth'
import { ApiRequestError } from './auth'

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE'
  token?: string | null
  // Objeto => se envía como JSON. FormData => se envía tal cual (subida de archivos).
  body?: unknown
  signal?: AbortSignal
}

/**
 * Cliente genérico para la API. Agrega el token, interpreta el sobre
 * `{ success, data, error }` del backend y lanza `ApiRequestError`.
 */
export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', token, body, signal } = options
  const headers: Record<string, string> = {}
  if (token) headers.Authorization = `Bearer ${token}`

  let payload: BodyInit | undefined
  if (body instanceof FormData) {
    payload = body // el navegador completa el Content-Type con el boundary
  } else if (body !== undefined) {
    headers['Content-Type'] = 'application/json'
    payload = JSON.stringify(body)
  }

  let response: Response
  try {
    response = await fetch(path, { method, headers, body: payload, signal })
  } catch (error) {
    if (signal?.aborted) throw error
    throw new ApiRequestError('No se pudo conectar con el servidor. Revisá que el backend esté iniciado.', 0)
  }

  if (response.status === 204) return undefined as T

  let envelope: ApiEnvelope<T>
  try {
    envelope = (await response.json()) as ApiEnvelope<T>
  } catch {
    throw new ApiRequestError('El servidor devolvió una respuesta inesperada.', response.status)
  }

  if (!response.ok || !envelope.success || envelope.data === undefined) {
    throw new ApiRequestError(
      envelope.error?.message ?? 'No se pudo completar la operación.',
      response.status,
      envelope.error?.fields,
    )
  }
  return envelope.data
}
