import { z } from "zod";
import { objectIdSchema } from "./common.schema.ts";

export const MAX_COLLECTION_PRODUCTS = 48;

// La descripcion acepta `null` para poder borrarla en un PATCH.
const collectionFields = {
  title: z.string().trim().min(1).max(80),
  description: z.string().trim().max(300).nullable().optional(),
  // En el orden en que se muestran.
  products: z
    .array(objectIdSchema)
    .min(1, "Agregá al menos un producto")
    .max(
      MAX_COLLECTION_PRODUCTS,
      `Una colección puede tener hasta ${MAX_COLLECTION_PRODUCTS} productos`,
    )
    .refine((ids) => new Set(ids).size === ids.length, {
      message: "Hay productos repetidos",
    }),
  isActive: z.boolean().optional(),
};

export const listCollectionsSchema = z.object({
  // Solo la tienen en cuenta los administradores; ver collection.controller.
  includeInactive: z.stringbool().optional(),
});

export const createCollectionSchema = z.object(collectionFields);

export const updateCollectionSchema = z
  .object(collectionFields)
  .partial()
  .refine((value) => Object.keys(value).length > 0, {
    message: "Enviá al menos un campo para modificar",
  });
