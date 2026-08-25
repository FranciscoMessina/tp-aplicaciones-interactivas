import type { Request, Response } from "express";
import * as productService from "../services/product.service.ts";
import type {
  CreateProductInput,
  UpdateProductInput,
} from "../services/product.service.ts";
import {
  getRequestBody,
  readBoolean,
  readOptionalNonNegativeNumber,
  readRouteParam,
  readStringArray,
  readTrimmedString,
} from "../utils/validation.ts";

function getProductId(req: Request): string {
  return readRouteParam(req.params.id);
}

export async function getProducts(
  req: Request,
  res: Response,
): Promise<void> {
  const search =
    typeof req.query.search === "string"
      ? req.query.search.trim()
      : undefined;

  const category =
    typeof req.query.category === "string"
      ? req.query.category.trim()
      : undefined;

  const filters: productService.ProductFilters = {};

if (search) {
  filters.search = search;
}

if (category) {
  filters.category = category;
}

const products = await productService.listProducts(filters);

  res.json(products);
}

export async function createProduct(
  req: Request,
  res: Response,
): Promise<void> {
  const body = getRequestBody(req);
  const name = readTrimmedString(body.name);
  const category = readTrimmedString(body.category);
  const description = readTrimmedString(body.description);
  const images = readStringArray(body.images);
  const price = readOptionalNonNegativeNumber(body.price);

  if (!name || !category || !description || price === null) {
    res.status(400).json({
      message:
        "name, category, description are required and price, if provided, must be a number greater than or equal to 0",
    });
    return;
  }

  const input: CreateProductInput = { name, category, description, images };
  if (price !== undefined) {
    input.price = price;
  }

  const product = await productService.createProduct(input);
  res.status(201).json(product);
}

export async function updateProduct(
  req: Request,
  res: Response,
): Promise<void> {
  const body = getRequestBody(req);
  const updates: UpdateProductInput = {};

  if (body.name !== undefined) {
    updates.name = readTrimmedString(body.name);
  }
  if (body.category !== undefined) {
    updates.category = readTrimmedString(body.category);
  }
  if (body.description !== undefined) {
    updates.description = readTrimmedString(body.description);
  }
  if (body.images !== undefined) {
    updates.images = readStringArray(body.images);
  }

  const price = readOptionalNonNegativeNumber(body.price);
  if (price === null) {
    res
      .status(400)
      .json({ message: "price must be a number greater than or equal to 0" });
    return;
  }
  if (price !== undefined) {
    updates.price = price;
  }

  if (
    Object.keys(updates).length === 0 ||
    (updates.name !== undefined && !updates.name) ||
    (updates.category !== undefined && !updates.category) ||
    (updates.description !== undefined && !updates.description)
  ) {
    res.status(400).json({
      message:
        "Provide a valid name, category, description, images and/or price",
    });
    return;
  }

  const product = await productService.updateProduct(
    getProductId(req),
    updates,
  );
  res.json(product);
}

export async function deleteProduct(
  req: Request,
  res: Response,
): Promise<void> {
  await productService.deleteProduct(getProductId(req));
  res.status(204).send();
}

export async function setProductActive(
  req: Request,
  res: Response,
): Promise<void> {
  const isActive = readBoolean(getRequestBody(req).isActive);

  if (isActive === undefined) {
    res.status(400).json({ message: "isActive must be a boolean" });
    return;
  }

  const product = await productService.setProductActive(
    getProductId(req),
    isActive,
  );
  res.json(product);
}
