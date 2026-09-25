import type { Request, Response } from "express";
import { sendSuccess } from "../http/responses.ts";
import { validate } from "../http/validate.ts";
import { UserRole } from "../models/user.model.ts";
import { idParamsSchema } from "../schemas/common.schema.ts";
import {
  createProductSchema,
  searchProductsSchema,
  updateProductSchema,
} from "../schemas/product.schema.ts";
import * as catalog from "../services/catalog.service.ts";

export async function searchProducts(
  req: Request,
  res: Response,
): Promise<void> {
  const query = validate(searchProductsSchema, req.query);
  // La ruta usa `optionalAuthenticate`, asi que `req.user` solo existe si el
  // visitante mando un token valido. Un visitante anonimo, o uno autenticado
  // que no sea admin, siempre ve el catalogo publico: el flag se ignora en
  // silencio en vez de responder 403.
  const includeInactive =
    query.includeInactive === true && req.user?.role === UserRole.Admin;

  sendSuccess(res, await catalog.searchProducts({ ...query, includeInactive }));
}

export async function getProduct(req: Request, res: Response): Promise<void> {
  const { id } = validate(idParamsSchema, req.params);
  // Igual que en el listado: solo un administrador ve los inactivos.
  const includeInactive = req.user?.role === UserRole.Admin;

  sendSuccess(res, await catalog.getProduct(id, includeInactive));
}

export async function createProduct(
  req: Request,
  res: Response,
): Promise<void> {
  const body = validate(createProductSchema, req.body);
  sendSuccess(res, await catalog.createProduct(body), 201);
}

export async function updateProduct(
  req: Request,
  res: Response,
): Promise<void> {
  const { id } = validate(idParamsSchema, req.params);
  const body = validate(updateProductSchema, req.body);
  sendSuccess(res, await catalog.updateProduct(id, body));
}

export async function deleteProduct(
  req: Request,
  res: Response,
): Promise<void> {
  const { id } = validate(idParamsSchema, req.params);
  await catalog.deleteProduct(id);
  res.status(204).send();
}
