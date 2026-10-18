import type { ApiResponse, EnquiryInput } from '../types/business'

export class EnquiryRequestError extends Error {
  readonly fields?: Record<string, string[]>

  constructor(message: string, fields?: Record<string, string[]>) {
    super(message)
    this.name = 'EnquiryRequestError'
    this.fields = fields
  }
}

export async function sendEnquiry(input: EnquiryInput): Promise<void> {
  let response: Response
  try {
    response = await fetch('/api/enquiries', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    })
  } catch {
    throw new EnquiryRequestError('No se pudo conectar con el servidor. Revisá que el backend esté iniciado.')
  }

  let payload: ApiResponse<unknown>
  try {
    payload = (await response.json()) as ApiResponse<unknown>
  } catch {
    throw new EnquiryRequestError('El servidor devolvió una respuesta inesperada.')
  }

  if (!response.ok || !payload.success) {
    throw new EnquiryRequestError(
      payload.error?.message ?? 'No se pudo enviar la consulta.',
      payload.error?.fields,
    )
  }
}
