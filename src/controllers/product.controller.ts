import type { Request, Response } from "express";
import { z } from "zod";
import * as catalogAdministration from "../services/catalog.service.ts";
import type {
  CreateProductInput,
  UpdateProductInput,
} from "../services/catalog.service.ts";
import * as productService from "../services/product.service.ts";

const objectIdSchema = z
  .string()
  .regex(/^[0-9a-fA-F]{24}$/, "Must be a valid identifier");
const optionalTrimmedQueryString = z.preprocess(
  (value) =>
    typeof value === "string" && value.trim() === "" ? undefined : value,
  z.string().trim().optional(),
);
const optionalCategoryQuery = z.preprocess(
  (value) =>
    typeof value === "string" && value.trim() === "" ? undefined : value,
  objectIdSchema.optional(),
);
const productFields = {
  name: z.string().trim().min(1),
  category: objectIdSchema,
  description: z.string().trim().min(1),
  images: z.array(z.url()).min(1),
  price: z.number().nonnegative().optional(),
  isActive: z.boolean().optional(),
};
const listProductsRequestSchema = z.object({
  query: z.object({
    search: optionalTrimmedQueryString,
    category: optionalCategoryQuery,
  }),
});
const createProductRequestSchema = z.object({
  body: z.object(productFields),
});
const updateProductRequestSchema = z.object({
  params: z.object({ id: objectIdSchema }),
  body: z
    .object(productFields)
    .partial()
    .refine((value) => Object.keys(value).length > 0, {
      message: "Provide at least one field",
    }),
});
const productIdRequestSchema = z.object({
  params: z.object({ id: objectIdSchema }),
});

export async function getProducts(req: Request, res: Response): Promise<void> {
  const { query } = listProductsRequestSchema.parse({ query: req.query });
  const products = await productService.listProducts({
    ...(query.search ? { search: query.search } : {}),
    ...(query.category ? { category: query.category } : {}),
  });
  res.json(products);
}

export async function createProduct(
  req: Request,
  res: Response,
): Promise<void> {
  const requestBody: unknown = req.body;
  const { body } = createProductRequestSchema.parse({ body: requestBody });
  const input: CreateProductInput = {
    name: body.name,
    category: body.category,
    description: body.description,
    images: body.images,
    ...(body.price !== undefined ? { price: body.price } : {}),
    ...(body.isActive !== undefined ? { isActive: body.isActive } : {}),
  };
  res.status(201).json(await catalogAdministration.createProduct(input));
}

export async function updateProduct(
  req: Request,
  res: Response,
): Promise<void> {
  const requestBody: unknown = req.body;
  const { params, body } = updateProductRequestSchema.parse({
    params: req.params,
    body: requestBody,
  });
  const updates: UpdateProductInput = {
    ...(body.name !== undefined ? { name: body.name } : {}),
    ...(body.category !== undefined ? { category: body.category } : {}),
    ...(body.description !== undefined
      ? { description: body.description }
      : {}),
    ...(body.images !== undefined ? { images: body.images } : {}),
    ...(body.price !== undefined ? { price: body.price } : {}),
    ...(body.isActive !== undefined ? { isActive: body.isActive } : {}),
  };
  res.json(await catalogAdministration.updateProduct(params.id, updates));
}

export async function deleteProduct(
  req: Request,
  res: Response,
): Promise<void> {
  const { params } = productIdRequestSchema.parse({ params: req.params });
  await catalogAdministration.deleteProduct(params.id);
  res.status(204).send();
}
