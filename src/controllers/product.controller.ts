import type { Request, Response } from "express";
import { handler } from "../http/handler.ts";
import { UserRole } from "../models/user.model.ts";
import {
  createProductSchema,
  productIdSchema,
  searchProductsSchema,
  updateProductSchema,
} from "../schemas/product.schema.ts";
import * as catalog from "../services/catalog.service.ts";

export const searchProducts = handler(
  { schema: searchProductsSchema, auth: "optional" },
  async (_req: Request, res: Response, { input, auth }) => {
    // Un visitante anonimo, o uno autenticado que no sea admin, siempre ve el
    // catalogo publico: el flag se ignora en silencio en vez de responder 403.
    const includeInactive =
      input.query.includeInactive && auth?.role === UserRole.Admin;

    res.json(await catalog.searchProducts({ ...input.query, includeInactive }));
  },
);

export const createProduct = handler(
  { schema: createProductSchema, auth: "admin" },
  async (_req: Request, res: Response, { input }) => {
    res.status(201).json(await catalog.createProduct(input.body));
  },
);

export const updateProduct = handler(
  { schema: updateProductSchema, auth: "admin" },
  async (_req: Request, res: Response, { input }) => {
    res.json(await catalog.updateProduct(input.params.id, input.body));
  },
);

export const deleteProduct = handler(
  { schema: productIdSchema, auth: "admin" },
  async (_req: Request, res: Response, { input }) => {
    await catalog.deleteProduct(input.params.id);
    res.status(204).send();
  },
);
