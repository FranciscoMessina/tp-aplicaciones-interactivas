import type { Request, Response } from "express";
import * as productService from "../services/product.service.ts";
import { getRequestBody, readTrimmedString } from "../utils/validation.ts";

export async function getProducts(_req: Request, res: Response): Promise<void> {
  const products = await productService.listProducts();
  res.json(products);
}

export async function createProduct(
  req: Request,
  res: Response,
): Promise<void> {
  const body = getRequestBody(req);
  const name = readTrimmedString(body.name);
  const description = readTrimmedString(body.description);
  const stock = typeof body.stock === "number" ? body.stock : Number.NaN;

  if (!name || !description || !Number.isInteger(stock) || stock < 0) {
    res.status(400).json({
      message:
        "name, description and a stock greater than or equal to 0 are required",
    });
    return;
  }

  const product = await productService.createProduct({
    name,
    description,
    stock,
  });
  res.status(201).json(product);
}
