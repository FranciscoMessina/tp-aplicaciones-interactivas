import { Router } from "express";
import { uploadImage } from "../controllers/image.controller.ts";
import { authenticate, requireAdmin } from "../middleware/auth.ts";
import { receiveImage } from "../middleware/upload.ts";

const imageRouter = Router();

// `receiveImage` va despues de los chequeos de permisos para no guardar en
// disco archivos de usuarios que no pueden subirlos.
imageRouter.post("/", authenticate, requireAdmin, receiveImage, uploadImage);

export { imageRouter };
