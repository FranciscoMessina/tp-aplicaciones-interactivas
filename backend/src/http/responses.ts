import type { Response } from "express";
import type {
  ApplicationErrorKind,
  FieldErrors,
} from "../domain/application-error.ts";

/**
 * Todas las respuestas de la API tienen la misma forma, asi el front siempre
 * sabe donde buscar el resultado o el error:
 *
 *   exito: { "success": true,  "data": ... }
 *   error: { "success": false, "error": { "code", "message", "fields"? } }
 *
 * La unica excepcion son las respuestas 204 (No Content), que por definicion
 * de HTTP no tienen cuerpo.
 */
export interface SuccessResponse<TData> {
  success: true;
  data: TData;
}

export interface ErrorResponse {
  success: false;
  error: {
    code: ApplicationErrorKind;
    message: string;
    fields?: FieldErrors;
  };
}

export function sendSuccess<TData>(
  res: Response,
  data: TData,
  statusCode = 200,
): void {
  const body: SuccessResponse<TData> = { success: true, data };
  res.status(statusCode).json(body);
}
