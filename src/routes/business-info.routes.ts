import { Router } from "express";
import {
  getBusinessInfo,
  saveBusinessInfo,
} from "../controllers/business-info.controller.ts";

const businessInfoRouter = Router();

businessInfoRouter.get("/", getBusinessInfo);
businessInfoRouter.put("/", saveBusinessInfo);

export { businessInfoRouter };
