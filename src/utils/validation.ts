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

export function readTrimmedString(value: unknown): string {
  return readString(value).trim();
}

export function normalizeEmail(value: unknown): string {
  return readTrimmedString(value).toLowerCase();
}

export function isValidEmail(email: string): boolean {
  return EMAIL_PATTERN.test(email);
}
