import type { Request, Response } from "express";
import { sendSuccess } from "../http/responses.ts";
import { validate } from "../http/validate.ts";
import { UserRole } from "../models/user.model.ts";
import { idParamsSchema } from "../schemas/common.schema.ts";
import {
  createPromotionSchema,
  listPromotionsSchema,
  updatePromotionSchema,
} from "../schemas/promotion.schema.ts";
import * as promotions from "../services/promotion.service.ts";

export async function listPromotions(
  req: Request,
  res: Response,
): Promise<void> {
  const query = validate(listPromotionsSchema, req.query);
  // Como en los productos: el flag solo vale con un token de administrador.
  const includeInactive =
    query.includeInactive === true && req.user?.role === UserRole.Admin;

  sendSuccess(res, await promotions.listPromotions(includeInactive));
}

export async function createPromotion(
  req: Request,
  res: Response,
): Promise<void> {
  const body = validate(createPromotionSchema, req.body);
  sendSuccess(res, await promotions.createPromotion(body), 201);
}

export async function updatePromotion(
  req: Request,
  res: Response,
): Promise<void> {
  const { id } = validate(idParamsSchema, req.params);
  const body = validate(updatePromotionSchema, req.body);
  sendSuccess(res, await promotions.updatePromotion(id, body));
}

export async function deletePromotion(
  req: Request,
  res: Response,
): Promise<void> {
  const { id } = validate(idParamsSchema, req.params);
  await promotions.deletePromotion(id);
  res.status(204).send();
}
