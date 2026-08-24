import type { NextFunction, Request, Response } from "express";
import mongoose from "mongoose";
import { HttpError, isMongoDuplicateKeyError } from "../utils/http-error.ts";

/**
 * Ultimo eslabon de la cadena: traduce cualquier error que salga de un
 * controller o servicio a una respuesta HTTP. Express 5 le pasa a este
 * middleware los errores de los handlers async automaticamente.
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

  if (error instanceof HttpError) {
    res.status(error.statusCode).json({ message: error.message });
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
