import { Router } from "express";
import {
  getBusinessInfo,
  saveBusinessInfo,
} from "../controllers/business-info.controller.ts";
import { authenticate, requireAdmin } from "../middleware/auth.ts";

const businessInfoRouter = Router();

businessInfoRouter.get("/", getBusinessInfo);
businessInfoRouter.put("/", authenticate, requireAdmin, saveBusinessInfo);

export { businessInfoRouter };
