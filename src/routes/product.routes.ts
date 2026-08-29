import { Router } from "express";
import {
  createProduct,
  deleteProduct,
  getProducts,
  updateProduct,
} from "../controllers/product.controller.ts";
import { authenticate } from "../middleware/authenticate.ts";
import { requireAdmin } from "../middleware/authorize.ts";

const productRouter = Router();

productRouter.get("/", getProducts);
productRouter.post("/", authenticate, requireAdmin, createProduct);

productRouter.patch("/:id", authenticate, requireAdmin, updateProduct);
productRouter.delete("/:id", authenticate, requireAdmin, deleteProduct);

export { productRouter };
