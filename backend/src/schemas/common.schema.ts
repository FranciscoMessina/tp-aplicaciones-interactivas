import { z } from "zod";

export const objectIdSchema = z
  .string()
  .regex(/^[0-9a-fA-F]{24}$/, "Debe ser un identificador válido");

export const emailSchema = z.string().trim().toLowerCase().pipe(z.email());

/**
 * Pagina pedida en el query string (`?page=2&pageSize=20`). Todo listado de algo
 * que puede crecer sin limite se pide de a paginas.
 */
export function paginationFields(defaultPageSize: number, maxPageSize: number) {
  return {
    page: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce
      .number()
      .int()
      .min(1)
      .max(maxPageSize)
      .default(defaultPageSize),
  };
}

/** Para las rutas con `/:id` en la URL. */
export const idParamsSchema = z.object({ id: objectIdSchema });
