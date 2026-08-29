import { z } from "zod";
import { objectIdSchema } from "./common.schema.ts";

const emptyStringAsUndefined = (value: unknown): unknown =>
  typeof value === "string" && value.trim() === "" ? undefined : value;

const optionalNonnegativeNumber = z.preprocess(
  emptyStringAsUndefined,
  z.coerce.number().nonnegative().optional(),
);

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
  query: z
    .object({
      search: z.preprocess(
        emptyStringAsUndefined,
        z.string().trim().optional(),
      ),
      category: z.preprocess(emptyStringAsUndefined, objectIdSchema.optional()),
      minPrice: optionalNonnegativeNumber,
      maxPrice: optionalNonnegativeNumber,
      sortBy: z
        .enum(["publicationDate", "price", "relevance"])
        .default("publicationDate"),
      sortOrder: z.enum(["asc", "desc"]).default("desc"),
      // Solo la tienen en cuenta los administradores; ver product.controller.
      includeInactive: z.stringbool().optional(),
    })
    .superRefine(({ minPrice, maxPrice, search, sortBy }, context) => {
      if (
        minPrice !== undefined &&
        maxPrice !== undefined &&
        minPrice > maxPrice
      ) {
        context.addIssue({
          code: "custom",
          path: ["maxPrice"],
          message: "Must be greater than or equal to minPrice",
        });
      }

      if (sortBy === "relevance" && search === undefined) {
        context.addIssue({
          code: "custom",
          path: ["sortBy"],
          message: "Relevance sorting requires search",
        });
      }
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
