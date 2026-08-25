import type { Request, Response } from "express";
import * as categoryService from "../services/category.service.ts";
import type {
  CreateCategoryInput,
  UpdateCategoryInput,
} from "../services/category.service.ts";
import {
  getRequestBody,
  readRouteParam,
  readTrimmedString,
} from "../utils/validation.ts";

function getCategoryId(req: Request): string {
  return readRouteParam(req.params.id);
}

export async function getCategories(
  _req: Request,
  res: Response,
): Promise<void> {
  const categories = await categoryService.listCategories();
  res.json(categories);
}

export async function createCategory(
  req: Request,
  res: Response,
): Promise<void> {
  const body = getRequestBody(req);
  const name = readTrimmedString(body.name);

  if (!name) {
    res.status(400).json({
      message: "name is required",
    });
    return;
  }

  const input: CreateCategoryInput = { name };

  const category = await categoryService.createCategory(input);
  res.status(201).json(category);
}

export async function updateCategory(
  req: Request,
  res: Response,
): Promise<void> {
  const body = getRequestBody(req);
  const name = readTrimmedString(body.name);

  if (!name) {
    res.status(400).json({
      message: "Provide a valid name",
    });
    return;
  }

  const updates: UpdateCategoryInput = { name };

  const category = await categoryService.updateCategory(
    getCategoryId(req),
    updates,
  );

  res.json(category);
}

export async function deleteCategory(
  req: Request,
  res: Response,
): Promise<void> {
  await categoryService.deleteCategory(getCategoryId(req));
  res.status(204).send();
}