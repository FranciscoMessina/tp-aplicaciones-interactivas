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

// Una contraseña que solo se compara con la guardada (login, contraseña
// actual): el tope es solo para no procesar textos enormes.
const enteredPasswordSchema = z.string().min(1).max(200);

const userFields = {
  fullName: z.string().trim().min(1).max(120),
  email: emailSchema,
  phone: z.string().trim().min(1).max(40),
};

export const createUserSchema = z.object(userFields);

export const loginSchema = z.object({
  email: emailSchema,
  password: enteredPasswordSchema,
});

// `currentPassword` solo es obligatoria si cambia el email (ver
// `updateUserProfile`): con el email se puede recuperar la cuenta.
export const updateProfileSchema = z
  .object({
    ...z.object(userFields).partial().shape,
    currentPassword: enteredPasswordSchema.optional(),
  })
  .refine(
    (value) => Object.keys(value).some((field) => field !== "currentPassword"),
    { message: "Enviá al menos un campo para modificar" },
  );

export const changePasswordSchema = z.object({
  currentPassword: enteredPasswordSchema,
  newPassword: passwordSchema,
});

export const forgotPasswordSchema = z.object({ email: emailSchema });

export const resetPasswordSchema = z.object({
  token: z.string().trim().min(1).max(200),
  password: passwordSchema,
});
