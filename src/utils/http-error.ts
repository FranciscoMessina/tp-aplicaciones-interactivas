/**
 * Error que los servicios lanzan cuando una regla de negocio falla y ya se sabe
 * con que codigo HTTP hay que responder. El manejador de errores de Express lo
 * traduce a una respuesta, asi los controllers no necesitan try/catch.
 */
export class HttpError extends Error {
  public readonly statusCode: number;

  constructor(statusCode: number, message: string) {
    super(message);
    this.name = "HttpError";
    this.statusCode = statusCode;
  }
}

export function isMongoDuplicateKeyError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === 11000
  );
}
