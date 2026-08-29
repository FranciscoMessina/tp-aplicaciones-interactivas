import type { Request, Response } from "express";
import { handler } from "../http/handler.ts";
import { saveBusinessInfoSchema } from "../schemas/business-info.schema.ts";
import * as businessInfoService from "../services/business-info.service.ts";

export const getBusinessInfo = handler(
  {},
  async (_req: Request, res: Response) => {
    res.json(await businessInfoService.getBusinessInfo());
  },
);

export const saveBusinessInfo = handler(
  { schema: saveBusinessInfoSchema, auth: "admin" },
  async (_req: Request, res: Response, { input }) => {
    res.json(await businessInfoService.upsertBusinessInfo(input.body));
  },
);
