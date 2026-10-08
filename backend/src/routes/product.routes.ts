import { Router } from "express";
import {
  createProduct,
  deleteProduct,
  getProduct,
  searchProducts,
  updateProduct,
} from "../controllers/product.controller.ts";
import {
  authenticate,
  optionalAuthenticate,
  requireAdmin,
} from "../middleware/auth.ts";

const productRouter = Router();

// Cada ruta es una cadena de funciones que Express ejecuta en orden: primero
// los middlewares (quien sos, que podes hacer) y al final el controller.
productRouter.get("/", optionalAuthenticate, searchProducts);
productRouter.get("/:id", optionalAuthenticate, getProduct);
productRouter.post("/", authenticate, requireAdmin, createProduct);
productRouter.patch("/:id", authenticate, requireAdmin, updateProduct);
productRouter.delete("/:id", authenticate, requireAdmin, deleteProduct);

export { productRouter };
