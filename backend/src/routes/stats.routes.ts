import { Router } from "express";
import { getDashboardStats } from "../controllers/stats.controller.ts";
import { authenticate, requireAdmin } from "../middleware/auth.ts";

const statsRouter = Router();

statsRouter.get("/", authenticate, requireAdmin, getDashboardStats);

export { statsRouter };
