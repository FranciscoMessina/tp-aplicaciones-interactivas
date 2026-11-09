import { z } from "zod";
import { objectIdSchema } from "./common.schema.ts";

// Los campos opcionales aceptan `null` para poder borrarlos en un PATCH. Que el
// fin no sea anterior al inicio lo controla el servicio, porque en un PATCH
// puede llegar una sola de las dos fechas. Lo mismo con la coleccion, la
// categoria y el descuento.
const promotionFields = {
  title: z.string().trim().min(1).max(80),
  description: z.string().trim().min(1).max(300),
  image: z.url().nullable().optional(),
  category: objectIdSchema.nullable().optional(),
  linkedCollection: objectIdSchema.nullable().optional(),
  // Porcentaje entero para los productos de la coleccion.
  discountPercent: z.number().int().min(1).max(90).nullable().optional(),
  startDate: z.iso.date().nullable().optional(),
  endDate: z.iso.date().nullable().optional(),
  isActive: z.boolean().optional(),
};

export const listPromotionsSchema = z.object({
  // Solo la tienen en cuenta los administradores; ver promotion.controller.
  includeInactive: z.stringbool().optional(),
});

export const createPromotionSchema = z.object(promotionFields);

export const updatePromotionSchema = z
  .object(promotionFields)
  .partial()
  .refine((value) => Object.keys(value).length > 0, {
    message: "Enviá al menos un campo para modificar",
  });
