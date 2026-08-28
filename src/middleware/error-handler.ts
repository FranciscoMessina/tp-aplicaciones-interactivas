import type { NextFunction, Request, Response } from "express";
import mongoose from "mongoose";
import { ZodError } from "zod";
import {
  ApplicationError,
  ApplicationErrorKind,
} from "../domain/application-error.ts";

/**
 * Ultimo eslabon de la cadena: traduce cualquier error que salga de un
 * controller o servicio a una respuesta HTTP.
 */
export function errorHandler(
  error: unknown,
  _req: Request,
  res: Response,
  next: NextFunction,
): void {
  if (res.headersSent) {
    next(error);
    return;
  }

  if (error instanceof ApplicationError) {
    const statusCode = applicationErrorStatus[error.kind];
    res.status(statusCode).json({ message: error.message });
    return;
  }

  if (error instanceof ZodError) {
    res.status(400).json({
      message: "Invalid request",
      errors: error.issues.map((issue) => ({
        field: issue.path.join("."),
        message: issue.message,
      })),
    });
    return;
  }

  if (error instanceof mongoose.Error.ValidationError) {
    res.status(400).json({ message: error.message });
    return;
  }

  if (error instanceof mongoose.Error.CastError) {
    res.status(400).json({ message: `Invalid value for ${error.path}` });
    return;
  }

  if (isMongoDuplicateKeyError(error)) {
    res.status(409).json({ message: "That resource already exists" });
    return;
  }

  console.error("Unhandled error:", error);
  res.status(500).json({ message: "Unexpected server error" });
}

const applicationErrorStatus: Record<ApplicationErrorKind, number> = {
  [ApplicationErrorKind.InvalidInput]: 400,
  [ApplicationErrorKind.Unauthenticated]: 401,
  [ApplicationErrorKind.Forbidden]: 403,
  [ApplicationErrorKind.NotFound]: 404,
  [ApplicationErrorKind.Conflict]: 409,
  [ApplicationErrorKind.Unexpected]: 500,
};

function isMongoDuplicateKeyError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === 11000
  );
}
