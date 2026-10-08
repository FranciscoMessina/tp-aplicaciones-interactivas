import { randomUUID } from "node:crypto";
import type { RequestHandler } from "express";
import multer from "multer";
import {
  ApplicationError,
  ApplicationErrorKind,
} from "../domain/application-error.ts";

const MAX_IMAGE_SIZE_MB = 5;

// Formatos aceptados y la extension con la que se guarda cada uno. La
// extension sale del tipo y no del nombre original, que lo elige el cliente.
const imageExtensions: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/gif": ".gif",
};

/**
 * Multer lee los requests `multipart/form-data` (el formato que usan los
 * formularios para mandar archivos), guarda el archivo en disco y deja sus
 * datos en `req.file`. Las imagenes quedan dentro de `public`, que Express
 * sirve como archivos estaticos (ver app.ts).
 */
const upload = multer({
  storage: multer.diskStorage({
    destination: "public/uploads",
    // Un nombre aleatorio evita choques entre archivos con el mismo nombre.
    filename: (_req, file, callback) => {
      callback(null, `${randomUUID()}${imageExtensions[file.mimetype]}`);
    },
  }),
  limits: { fileSize: MAX_IMAGE_SIZE_MB * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, callback) => {
    if (!(file.mimetype in imageExtensions)) {
      callback(
        new ApplicationError(
          ApplicationErrorKind.InvalidInput,
          "Hay campos con errores",
          { image: ["Debe ser una imagen JPG, PNG, WEBP o GIF"] },
        ),
      );
      return;
    }

    callback(null, true);
  },
}).single("image");

/** Recibe una imagen en el campo `image` del formulario. */
export const receiveImage: RequestHandler = (req, res, next) => {
  upload(req, res, (error: unknown) => {
    // Los errores propios de Multer (archivo muy grande, campo inesperado)
    // vienen en ingles y sin tipo de la aplicacion: los traducimos aca.
    if (error instanceof multer.MulterError) {
      const message =
        error.code === "LIMIT_FILE_SIZE"
          ? `No puede pesar más de ${MAX_IMAGE_SIZE_MB} MB`
          : "Enviá una sola imagen en el campo image";

      next(
        new ApplicationError(
          ApplicationErrorKind.InvalidInput,
          "Hay campos con errores",
          { image: [message] },
        ),
      );
      return;
    }

    next(error);
  });
};
