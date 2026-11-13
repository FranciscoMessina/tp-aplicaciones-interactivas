import { Router } from "express";
import {
  createPromotion,
  deletePromotion,
  listPromotions,
  updatePromotion,
} from "../controllers/promotion.controller.ts";
import {
  authenticate,
  optionalAuthenticate,
  requireAdmin,
} from "../middleware/auth.ts";

const promotionRouter = Router();

promotionRouter.get("/", optionalAuthenticate, listPromotions);
promotionRouter.post("/", authenticate, requireAdmin, createPromotion);
promotionRouter.patch("/:id", authenticate, requireAdmin, updatePromotion);
promotionRouter.delete("/:id", authenticate, requireAdmin, deletePromotion);

export { promotionRouter };
