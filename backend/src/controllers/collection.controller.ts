import type { Request, Response } from "express";
import { sendSuccess } from "../http/responses.ts";
import { validate } from "../http/validate.ts";
import { UserRole } from "../models/user.model.ts";
import {
  createCollectionSchema,
  listCollectionsSchema,
  updateCollectionSchema,
} from "../schemas/collection.schema.ts";
import { idParamsSchema } from "../schemas/common.schema.ts";
import * as collections from "../services/collection.service.ts";

export async function listCollections(
  req: Request,
  res: Response,
): Promise<void> {
  const query = validate(listCollectionsSchema, req.query);
  // Como en los productos: el flag solo vale con un token de administrador.
  const includeInactive =
    query.includeInactive === true && req.user?.role === UserRole.Admin;

  sendSuccess(res, await collections.listCollections(includeInactive));
}

export async function getCollection(
  req: Request,
  res: Response,
): Promise<void> {
  const { id } = validate(idParamsSchema, req.params);
  const includeInactive = req.user?.role === UserRole.Admin;

  sendSuccess(res, await collections.getCollection(id, includeInactive));
}

export async function createCollection(
  req: Request,
  res: Response,
): Promise<void> {
  const body = validate(createCollectionSchema, req.body);
  sendSuccess(res, await collections.createCollection(body), 201);
}

export async function updateCollection(
  req: Request,
  res: Response,
): Promise<void> {
  const { id } = validate(idParamsSchema, req.params);
  const body = validate(updateCollectionSchema, req.body);
  sendSuccess(res, await collections.updateCollection(id, body));
}

export async function deleteCollection(
  req: Request,
  res: Response,
): Promise<void> {
  const { id } = validate(idParamsSchema, req.params);
  await collections.deleteCollection(id);
  res.status(204).send();
}
