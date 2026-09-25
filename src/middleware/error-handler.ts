import type { NextFunction, Request, Response } from "express";
import mongoose from "mongoose";
import {
  ApplicationError,
  ApplicationErrorKind,
  type FieldErrors,
} from "../domain/application-error.ts";
import type { ErrorResponse } from "../http/responses.ts";

// Para traducir los tipos de errores de la aplicacion a codigos de error HTTP
const applicationErrorStatus: Record<ApplicationErrorKind, number> = {
  [ApplicationErrorKind.InvalidInput]: 400,
  [ApplicationErrorKind.Unauthenticated]: 401,
  [ApplicationErrorKind.Forbidden]: 403,
  [ApplicationErrorKind.NotFound]: 404,
  [ApplicationErrorKind.Conflict]: 409,
  [ApplicationErrorKind.Unexpected]: 500,
};

/**
 * Ultimo eslabon de la cadena. Express reconoce que es un manejador de errores
 * porque recibe 4 parametros: cuando un controller o middleware tira un error
 * (o una funcion async falla), Express saltea el resto de la cadena y llama
 * directamente a esta funcion.
 *
 * Primero convierte cualquier error a un `ApplicationError` y despues arma
 * siempre la misma respuesta, asi el front recibe un unico formato de error.
 */
export function errorHandler(
  error: unknown,
  _req: Request,
  res: Response,
  next: NextFunction,
): void {
  // Si ya se empezo a mandar la respuesta no se puede cambiar el status; se lo
  // dejamos al manejador por defecto de Express, que corta la conexion.
  if (res.headersSent) {
    next(error);
    return;
  }

  const applicationError = toApplicationError(error);

  if (applicationError.kind === ApplicationErrorKind.Unexpected) {
    console.error("Unhandled error:", error);
  }

  const body: ErrorResponse = {
    success: false,
    error: {
      code: applicationError.kind,
      message: applicationError.message,
      ...(applicationError.fields && { fields: applicationError.fields }),
    },
  };

  res.status(applicationErrorStatus[applicationError.kind]).json(body);
}

function toApplicationError(error: unknown): ApplicationError {
  if (error instanceof ApplicationError) {
    return error;
  }

  // `express.json()` tira este error cuando el cuerpo no es un JSON valido.
  if (
    error instanceof SyntaxError &&
    "type" in error &&
    error.type === "entity.parse.failed"
  ) {
    return new ApplicationError(
      ApplicationErrorKind.InvalidInput,
      "The request body is not valid JSON",
    );
  }

  // Validaciones del modelo de Mongoose que no cubrio el schema de Zod.
  if (error instanceof mongoose.Error.ValidationError) {
    const fields: FieldErrors = {};

    for (const [field, fieldError] of Object.entries(error.errors)) {
      fields[field] = [fieldError.message];
    }

    return new ApplicationError(
      ApplicationErrorKind.InvalidInput,
      "Some fields are invalid",
      fields,
    );
  }

  // Un valor que Mongoose no pudo convertir, por ejemplo un id mal formado.
  if (error instanceof mongoose.Error.CastError) {
    return new ApplicationError(
      ApplicationErrorKind.InvalidInput,
      `Invalid value for ${error.path}`,
      { [error.path]: ["Invalid value"] },
    );
  }

  const duplicatedFields = getDuplicatedFields(error);

  if (duplicatedFields) {
    return new ApplicationError(
      ApplicationErrorKind.Conflict,
      "That resource already exists",
      duplicatedFields,
    );
  }

  return new ApplicationError(
    ApplicationErrorKind.Unexpected,
    "Unexpected server error",
  );
}

/**
 * MongoDB responde con el codigo 11000 cuando se viola un indice unico (por
 * ejemplo, registrar un email que ya existe). En `keyValue` viene que campos
 * chocaron, y con eso armamos un error por campo para el front.
 */
function getDuplicatedFields(error: unknown): FieldErrors | undefined {
  if (
    typeof error !== "object" ||
    error === null ||
    !("code" in error) ||
    error.code !== 11000
  ) {
    return undefined;
  }

  const fields: FieldErrors = {};

  if (
    "keyValue" in error &&
    typeof error.keyValue === "object" &&
    error.keyValue !== null
  ) {
    for (const field of Object.keys(error.keyValue)) {
      fields[field] = ["Already in use"];
    }
  }

  return fields;
}
