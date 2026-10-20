// Mismas reglas que el backend. bcrypt solo usa los primeros 72 bytes, y una
// letra con tilde ocupa 2: por eso se mide en bytes y no en caracteres.
const MIN_LENGTH = 8
const MAX_BYTES = 72

/** El problema de la nueva contraseña, o '' si se puede enviar. */
export function newPasswordProblem(password: string, confirmation: string): string {
  if (password.length < MIN_LENGTH) return `La contraseña debe tener al menos ${MIN_LENGTH} caracteres.`
  if (new TextEncoder().encode(password).length > MAX_BYTES) return 'La contraseña es demasiado larga: usá hasta 72 caracteres sin tildes ni emojis.'
  if (password !== confirmation) return 'Las contraseñas no coinciden.'
  return ''
}
