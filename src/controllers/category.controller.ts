import type { Request, Response } from "express";
import { handler } from "../http/handler.ts";
import {
  categoryIdSchema,
  createCategorySchema,
  updateCategorySchema,
} from "../schemas/category.schema.ts";
import * as catalog from "../services/catalog.service.ts";

export const listCategories = handler(
  {},
  async (_req: Request, res: Response) => {
    res.json(await catalog.listCategories());
  },
);

export const createCategory = handler(
  { schema: createCategorySchema, auth: "admin" },
  async (_req: Request, res: Response, { input }) => {
    res.status(201).json(await catalog.createCategory(input.body));
  },
);

export const updateCategory = handler(
  { schema: updateCategorySchema, auth: "admin" },
  async (_req: Request, res: Response, { input }) => {
    res.json(await catalog.updateCategory(input.params.id, input.body));
  },
);

export const deleteCategory = handler(
  { schema: categoryIdSchema, auth: "admin" },
  async (_req: Request, res: Response, { input }) => {
    await catalog.deleteCategory(input.params.id);
    res.status(204).send();
  },
);
