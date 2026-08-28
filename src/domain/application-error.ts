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

export class ApplicationError extends Error {
  public readonly kind: ApplicationErrorKind;

  constructor(kind: ApplicationErrorKind, message: string) {
    super(message);
    this.name = "ApplicationError";
    this.kind = kind;
  }
}
