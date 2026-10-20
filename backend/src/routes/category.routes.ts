import { Router } from "express";
import {
  createCategory,
  deleteCategory,
  listCategories,
  listCategorySummaries,
  updateCategory,
} from "../controllers/category.controller.ts";
import { authenticate, requireAdmin } from "../middleware/auth.ts";

const categoryRouter = Router();

categoryRouter.get("/", listCategories);
categoryRouter.get("/summary", listCategorySummaries);
categoryRouter.post("/", authenticate, requireAdmin, createCategory);
categoryRouter.patch("/:id", authenticate, requireAdmin, updateCategory);
categoryRouter.delete("/:id", authenticate, requireAdmin, deleteCategory);

export { categoryRouter };
