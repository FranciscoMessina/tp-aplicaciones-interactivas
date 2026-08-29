import { Router } from "express";
import {
  createCategory,
  deleteCategory,
  listCategories,
  updateCategory,
} from "../controllers/category.controller.ts";

const categoryRouter = Router();

categoryRouter.get("/", listCategories);
categoryRouter.post("/", createCategory);
categoryRouter.patch("/:id", updateCategory);
categoryRouter.delete("/:id", deleteCategory);

export { categoryRouter };
