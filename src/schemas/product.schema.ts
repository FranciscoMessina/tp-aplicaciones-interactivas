import { z } from "zod";
import { objectIdSchema } from "./common.schema.ts";

const emptyStringAsUndefined = (value: unknown): unknown =>
  typeof value === "string" && value.trim() === "" ? undefined : value;

const productFields = {
  name: z.string().trim().min(1),
  category: objectIdSchema,
  description: z.string().trim().min(1),
  images: z.array(z.url()).min(1),
  price: z.number().nonnegative().optional(),
  isActive: z.boolean().optional(),
};

const productParams = z.object({ id: objectIdSchema });

export const searchProductsSchema = {
  query: z.object({
    search: z.preprocess(emptyStringAsUndefined, z.string().trim().optional()),
    category: z.preprocess(emptyStringAsUndefined, objectIdSchema.optional()),
    // Solo la tienen en cuenta los administradores; ver product.controller.
    includeInactive: z.preprocess((value) => value === "true", z.boolean()),
  }),
};

export const createProductSchema = { body: z.object(productFields) };

export const updateProductSchema = {
  params: productParams,
  body: z
    .object(productFields)
    .partial()
    .refine((value) => Object.keys(value).length > 0, {
      message: "Provide at least one field",
    }),
};

export const productIdSchema = { params: productParams };
