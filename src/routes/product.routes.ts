import { Router } from "express";
import {
  createProduct,
  deleteProduct,
  searchProducts,
  updateProduct,
} from "../controllers/product.controller.ts";

const productRouter = Router();

productRouter.get("/", searchProducts);
productRouter.post("/", createProduct);
productRouter.patch("/:id", updateProduct);
productRouter.delete("/:id", deleteProduct);

export { productRouter };
