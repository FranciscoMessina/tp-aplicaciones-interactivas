import { z } from "zod";
import { emailSchema } from "./common.schema.ts";

export const registerSchema = {
  body: z.object({
    fullName: z.string().trim().min(1),
    email: emailSchema,
    phone: z.string().trim().min(1),
    password: z.string().min(8),
  }),
};

export const loginSchema = {
  body: z.object({ email: emailSchema, password: z.string().min(1) }),
};

export const updateProfileSchema = {
  body: z
    .object({
      fullName: z.string().trim().min(1).optional(),
      email: emailSchema.optional(),
      phone: z.string().trim().min(1).optional(),
    })
    .refine((value) => Object.keys(value).length > 0, {
      message: "Provide at least one field",
    }),
};

export const forgotPasswordSchema = { body: z.object({ email: emailSchema }) };

export const resetPasswordSchema = {
  body: z.object({
    token: z.string().trim().min(1),
    password: z.string().min(8),
  }),
};
