import type { ApiResponse, BusinessInfo } from '../types/business'

export class BusinessInfoError extends Error {
  readonly status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = 'BusinessInfoError'
    this.status = status
  }
}

export async function fetchBusinessInfo(signal?: AbortSignal): Promise<BusinessInfo> {
  let response: Response
  try {
    response = await fetch('/api/business-info', { signal })
  } catch (error) {
    if (signal?.aborted) throw error
    throw new BusinessInfoError('No se pudo conectar con el servidor.', 0)
  }

  let payload: ApiResponse<BusinessInfo>
  try {
    payload = (await response.json()) as ApiResponse<BusinessInfo>
  } catch {
    throw new BusinessInfoError('El servidor devolvió una respuesta inesperada.', response.status)
  }

  if (!response.ok || !payload.success || !payload.data) {
    throw new BusinessInfoError(
      payload.error?.message ?? 'No se pudo obtener la información del comercio.',
      response.status,
    )
  }

  return payload.data
}
