import { z } from "zod";
import { objectIdSchema } from "./common.schema.ts";

// Los filtros llegan como query string (`?minPrice=&category=`), asi que un
// campo vacio se trata como si no se hubiera mandado.
const emptyStringAsUndefined = (value: unknown): unknown =>
  typeof value === "string" && value.trim() === "" ? undefined : value;

// En el query string todo es texto: `z.coerce` convierte "100" en 100.
const optionalNonnegativeNumber = z.preprocess(
  emptyStringAsUndefined,
  z.coerce.number().nonnegative().optional(),
);

const productFields = {
  name: z.string().trim().min(1),
  category: objectIdSchema,
  description: z.string().trim().min(1),
  images: z.array(z.url()).min(1),
  // La consigna lo deja opcional segun el rubro; en el nuestro es obligatorio.
  price: z.number().nonnegative(),
  isActive: z.boolean().optional(),
};

export const searchProductsSchema = z
  .object({
    search: z.preprocess(emptyStringAsUndefined, z.string().trim().optional()),
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
  // Validaciones que dependen de mas de un campo a la vez.
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
  });

export const createProductSchema = z.object(productFields);

// En un PATCH todos los campos son opcionales, pero tiene que venir al menos uno.
export const updateProductSchema = z
  .object(productFields)
  .partial()
  .refine((value) => Object.keys(value).length > 0, {
    message: "Provide at least one field",
  });
