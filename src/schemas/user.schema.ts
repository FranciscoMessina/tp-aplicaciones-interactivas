import { z } from "zod";
import { emailSchema } from "./common.schema.ts";

export const registerSchema = z.object({
  fullName: z.string().trim().min(1),
  email: emailSchema,
  phone: z.string().trim().min(1),
  password: z.string().min(8),
});

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1),
});

export const updateProfileSchema = z
  .object({
    fullName: z.string().trim().min(1).optional(),
    email: emailSchema.optional(),
    phone: z.string().trim().min(1).optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "Enviá al menos un campo para modificar",
  });

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8),
});

export const forgotPasswordSchema = z.object({ email: emailSchema });

export const resetPasswordSchema = z.object({
  token: z.string().trim().min(1),
  password: z.string().min(8),
});
