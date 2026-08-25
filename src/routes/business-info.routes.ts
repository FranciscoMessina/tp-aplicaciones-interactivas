import { Router } from "express";
import {
  getBusinessInfo,
  saveBusinessInfo,
} from "../controllers/business-info.controller.ts";
import { authenticate } from "../middleware/authenticate.ts";
import { requireAdmin } from "../middleware/authorize.ts";

const businessInfoRouter = Router();

businessInfoRouter.get("/", getBusinessInfo);

businessInfoRouter.put(
  "/",
  authenticate,
  requireAdmin,
  saveBusinessInfo,
);

export { businessInfoRouter };