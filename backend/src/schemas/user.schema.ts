import { z } from "zod";
import { emailSchema } from "./common.schema.ts";

// bcrypt solo usa los primeros 72 bytes: el resto de una contraseña mas larga
// se ignoraria sin avisar. El limite es en bytes, no en caracteres: una letra
// con tilde ocupa 2.
const MAX_PASSWORD_BYTES = 72;

const passwordSchema = z
  .string()
  .min(8)
  .refine((value) => Buffer.byteLength(value) <= MAX_PASSWORD_BYTES, {
    message: "Es demasiado larga: usá hasta 72 caracteres sin tildes ni emojis",
  });

export const createUserSchema = z.object({
  fullName: z.string().trim().min(1),
  email: emailSchema,
  phone: z.string().trim().min(1),
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
  newPassword: passwordSchema,
});

export const forgotPasswordSchema = z.object({ email: emailSchema });

export const resetPasswordSchema = z.object({
  token: z.string().trim().min(1),
  password: passwordSchema,
});
