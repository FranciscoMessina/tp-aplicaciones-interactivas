/**
 * Los tipos de error que puede producir la aplicacion. Los servicios hablan en
 * estos terminos ("no existe", "conflicto") y no en codigos HTTP: la traduccion
 * a 404, 409, etc. la hace el error handler, que es la unica pieza que sabe
 * de HTTP. Asi los servicios no dependen de Express.
 */
export const ApplicationErrorKind = {
  InvalidInput: "INVALID_INPUT",
  Unauthenticated: "UNAUTHENTICATED",
  Forbidden: "FORBIDDEN",
  NotFound: "NOT_FOUND",
  Conflict: "CONFLICT",
  Unexpected: "UNEXPECTED",
} as const;

export type ApplicationErrorKind =
  (typeof ApplicationErrorKind)[keyof typeof ApplicationErrorKind];

/**
 * Errores asociados a campos concretos del request. La clave es la ruta del
 * campo (`"email"`, `"images.0"`) y el valor la lista de problemas de ese
 * campo, para que el front pueda mostrar cada mensaje debajo de su input.
 */
export type FieldErrors = Record<string, string[]>;

export class ApplicationError extends Error {
  public readonly kind: ApplicationErrorKind;
  public readonly fields: FieldErrors | undefined;

  constructor(
    kind: ApplicationErrorKind,
    message: string,
    fields?: FieldErrors,
  ) {
    super(message);
    this.name = "ApplicationError";
    this.kind = kind;
    this.fields = fields;
  }
}
