import type { Request, Response } from "express";
import { sendSuccess } from "../http/responses.ts";
import { validate } from "../http/validate.ts";
import { saveBusinessInfoSchema } from "../schemas/business-info.schema.ts";
import * as businessInfoService from "../services/business-info.service.ts";

export async function getBusinessInfo(
  _req: Request,
  res: Response,
): Promise<void> {
  sendSuccess(res, await businessInfoService.getBusinessInfo());
}

export async function saveBusinessInfo(
  req: Request,
  res: Response,
): Promise<void> {
  const body = validate(saveBusinessInfoSchema, req.body);
  sendSuccess(res, await businessInfoService.upsertBusinessInfo(body));
}
