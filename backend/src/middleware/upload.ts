import { randomUUID } from "node:crypto";
import { open, rm } from "node:fs/promises";
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

// El tipo que declara el cliente no prueba nada: se puede subir cualquier
// archivo diciendo que es "image/png". Por eso, ya guardado, se comparan sus
// primeros bytes con la firma de cada formato.
const imageSignatures: Record<string, (header: Buffer) => boolean> = {
  "image/jpeg": (header) =>
    header.subarray(0, 3).equals(Buffer.from([0xff, 0xd8, 0xff])),
  "image/png": (header) =>
    header
      .subarray(0, 8)
      .equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])),
  "image/webp": (header) =>
    header.toString("latin1", 0, 4) === "RIFF" &&
    header.toString("latin1", 8, 12) === "WEBP",
  "image/gif": (header) =>
    ["GIF87a", "GIF89a"].includes(header.toString("latin1", 0, 6)),
};

async function hasImageSignature(file: Express.Multer.File): Promise<boolean> {
  const handle = await open(file.path);

  try {
    const header = Buffer.alloc(12);
    await handle.read(header, 0, header.length, 0);
    return imageSignatures[file.mimetype]?.(header) ?? false;
  } finally {
    await handle.close();
  }
}

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

    if (error || !req.file) {
      next(error);
      return;
    }

    const file = req.file;

    hasImageSignature(file)
      .then(async (isImage) => {
        if (isImage) {
          next();
          return;
        }

        await rm(file.path, { force: true });
        next(
          new ApplicationError(
            ApplicationErrorKind.InvalidInput,
            "Hay campos con errores",
            { image: ["El archivo no es una imagen válida"] },
          ),
        );
      })
      .catch(next);
  });
};
