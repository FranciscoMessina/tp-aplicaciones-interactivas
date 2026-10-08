import type { Request, Response } from "express";
import {
  ApplicationError,
  ApplicationErrorKind,
} from "../domain/application-error.ts";
import { sendSuccess } from "../http/responses.ts";

export function uploadImage(req: Request, res: Response): void {
  if (!req.file) {
    throw new ApplicationError(
      ApplicationErrorKind.InvalidInput,
      "Hay campos con errores",
      { image: ["Es obligatoria"] },
    );
  }

  // Devolvemos la URL absoluta porque los productos guardan sus imagenes como
  // URLs: el front la agrega directamente al array `images`.
  const url = `${req.protocol}://${req.get("host")}/uploads/${req.file.filename}`;

  sendSuccess(res, { url }, 201);
}
