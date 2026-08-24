import { Router } from "express";
import {
  createProduct,
  deleteProduct,
  getProducts,
  setProductActive,
  updateProduct,
} from "../controllers/product.controller.ts";
import { authenticate } from "../middleware/authenticate.ts";
import { requireAdmin } from "../middleware/authorize.ts";

const productRouter = Router();

productRouter.get("/", getProducts);
productRouter.post("/", authenticate, requireAdmin, createProduct);
// Tiene sentido tener un endpoint especifico para cambiar el estado del producto? O
// O que se haga directo como una actualización de los datos del mismo, y el front se
// encarga de mostrarlo como una acción separada? Para mi no tiene sentido que un endpoint extra.
productRouter.patch("/:id", authenticate, requireAdmin, updateProduct);
productRouter.delete("/:id", authenticate, requireAdmin, deleteProduct);
productRouter.patch(
  "/:id/status",
  authenticate,
  requireAdmin,
  setProductActive,
);

export { productRouter };
