import { z } from "zod";

export const objectIdSchema = z
  .string()
  .regex(/^[0-9a-fA-F]{24}$/, "Must be a valid identifier");

export const emailSchema = z.string().trim().toLowerCase().pipe(z.email());
