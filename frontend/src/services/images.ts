import { apiRequest } from './api'

/** Sube una imagen (JPG, PNG, WEBP o GIF, máx. 5 MB) y devuelve su URL pública. */
export async function uploadImage(token: string, file: File): Promise<string> {
  const form = new FormData()
  form.append('image', file)
  const { url } = await apiRequest<{ url: string }>('/api/images', { method: 'POST', token, body: form })
  return url
}
