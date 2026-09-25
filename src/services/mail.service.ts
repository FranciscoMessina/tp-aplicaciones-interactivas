/**
 * Todavia no hay envio de mails: por ahora el token se escribe en la consola
 * del servidor. Cuando se configure un proveedor alcanza con cambiar esta
 * funcion, quien la llama no se entera.
 */
export function sendPasswordResetEmail(email: string, token: string): void {
  console.log(`[mail] Token de recuperación para ${email}: ${token}`);
}
