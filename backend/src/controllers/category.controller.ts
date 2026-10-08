import type { Request, Response } from "express";
import { sendSuccess } from "../http/responses.ts";
import { validate } from "../http/validate.ts";
import { categorySchema } from "../schemas/category.schema.ts";
import { idParamsSchema } from "../schemas/common.schema.ts";
import * as catalog from "../services/catalog.service.ts";

export async function listCategories(
  _req: Request,
  res: Response,
): Promise<void> {
  sendSuccess(res, await catalog.listCategories());
}

export async function createCategory(
  req: Request,
  res: Response,
): Promise<void> {
  const body = validate(categorySchema, req.body);
  sendSuccess(res, await catalog.createCategory(body), 201);
}

export async function updateCategory(
  req: Request,
  res: Response,
): Promise<void> {
  const { id } = validate(idParamsSchema, req.params);
  const body = validate(categorySchema, req.body);
  sendSuccess(res, await catalog.updateCategory(id, body));
}

export async function deleteCategory(
  req: Request,
  res: Response,
): Promise<void> {
  const { id } = validate(idParamsSchema, req.params);
  await catalog.deleteCategory(id);
  res.status(204).send();
}
