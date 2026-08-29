import { Router } from "express";
import {
  createCategory,
  deleteCategory,
  listCategories,
  updateCategory,
} from "../controllers/category.controller.ts";
import { authenticate } from "../middleware/authenticate.ts";
import { requireAdmin } from "../middleware/authorize.ts";

const categoryRouter = Router();

categoryRouter.get("/", listCategories);

categoryRouter.post(
  "/",
  authenticate,
  requireAdmin,
  createCategory,
);

categoryRouter.patch(
  "/:id",
  authenticate,
  requireAdmin,
  updateCategory,
);

categoryRouter.delete(
  "/:id",
  authenticate,
  requireAdmin,
  deleteCategory,
);

export { categoryRouter };
