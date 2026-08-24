import type { Request } from "express";

export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function getRequestBody(req: Request): Record<string, unknown> {
  const body: unknown = req.body;
  return typeof body === "object" && body !== null
    ? (body as Record<string, unknown>)
    : {};
}

export function readString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

export function readRouteParam(value: string | string[] | undefined): string {
  return typeof value === "string" ? value : "";
}

export function readTrimmedString(value: unknown): string {
  return readString(value).trim();
}

export function normalizeEmail(value: unknown): string {
  return readTrimmedString(value).toLowerCase();
}

export function isValidEmail(email: string): boolean {
  return EMAIL_PATTERN.test(email);
}

export function readStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
}

export function readBoolean(value: unknown): boolean | undefined {
  return typeof value === "boolean" ? value : undefined;
}

/**
 * Devuelve `undefined` cuando el precio no vino en el body (es opcional),
 * y `null` cuando vino pero no es un numero valido, para que el caller
 * pueda distinguir "no enviado" de "invalido".
 */
export function readOptionalNonNegativeNumber(
  value: unknown,
): number | undefined | null {
  if (value === undefined) {
    return undefined;
  }

  return typeof value === "number" && value >= 0 ? value : null;
}
