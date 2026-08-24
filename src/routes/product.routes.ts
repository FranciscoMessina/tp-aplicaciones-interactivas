import { Router } from "express";
import {
  createProduct,
  getProducts,
} from "../controllers/product.controller.ts";

const productRouter = Router();

productRouter.get("/", getProducts);
productRouter.post("/", createProduct);

export { productRouter };
