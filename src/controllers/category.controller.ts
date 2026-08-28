import type { Request, Response } from "express";
import { z } from "zod";
import * as categoryService from "../services/category.service.ts";
import * as catalogAdministration from "../services/catalog.service.ts";

const objectIdSchema = z
  .string()
  .regex(/^[0-9a-fA-F]{24}$/, "Must be a valid identifier");
const categoryBodySchema = z.object({ name: z.string().trim().min(1) });
const createCategoryRequestSchema = z.object({ body: categoryBodySchema });
const updateCategoryRequestSchema = z.object({
  params: z.object({ id: objectIdSchema }),
  body: categoryBodySchema,
});
const categoryIdRequestSchema = z.object({
  params: z.object({ id: objectIdSchema }),
});

export async function getCategories(
  _req: Request,
  res: Response,
): Promise<void> {
  res.json(await categoryService.listCategories());
}

export async function createCategory(
  req: Request,
  res: Response,
): Promise<void> {
  const requestBody: unknown = req.body;
  const { body } = createCategoryRequestSchema.parse({ body: requestBody });
  res.status(201).json(await catalogAdministration.createCategory(body));
}

export async function updateCategory(
  req: Request,
  res: Response,
): Promise<void> {
  const requestBody: unknown = req.body;
  const { params, body } = updateCategoryRequestSchema.parse({
    params: req.params,
    body: requestBody,
  });
  res.json(await catalogAdministration.updateCategory(params.id, body));
}

export async function deleteCategory(
  req: Request,
  res: Response,
): Promise<void> {
  const { params } = categoryIdRequestSchema.parse({ params: req.params });
  await catalogAdministration.deleteCategory(params.id);
  res.status(204).send();
}
