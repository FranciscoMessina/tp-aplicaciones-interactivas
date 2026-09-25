import { z } from "zod";

export const objectIdSchema = z
  .string()
  .regex(/^[0-9a-fA-F]{24}$/, "Must be a valid identifier");

export const emailSchema = z.string().trim().toLowerCase().pipe(z.email());

/** Para las rutas con `/:id` en la URL. */
export const idParamsSchema = z.object({ id: objectIdSchema });
