import type { DocumentType } from "@typegoose/typegoose";
import { env } from "../config/env.ts";
import { User, UserModel, type UserRole } from "../models/user.model.ts";
import { HttpError, isMongoDuplicateKeyError } from "../utils/http-error.ts";
import {
  createAccessToken,
  createPasswordResetToken,
  hashPassword,
  hashResetToken,
  verifyPassword,
} from "./auth.service.ts";

const RESET_TOKEN_DURATION_MS = 15 * 60 * 1000;

// Campos que se pueden devolver al cliente sin exponer datos sensibles.
const PUBLIC_USER_FIELDS = "fullName email phone role createdAt updatedAt";

export interface RegisterUserInput {
  fullName: string;
  email: string;
  phone: string;
  password: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface UpdateProfileInput {
  fullName?: string;
  email?: string;
  phone?: string;
}

export interface AuthenticatedUser {
  accessToken: string;
  user: {
    id: string;
    fullName: string;
    email: string;
    phone: string;
    role: UserRole;
  };
}

function toAuthenticatedUser(user: DocumentType<User>): AuthenticatedUser {
  return {
    accessToken: createAccessToken(user.id, user.role),
    user: {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      phone: user.phone,
      role: user.role,
    },
  };
}

export async function registerUser(
  input: RegisterUserInput,
): Promise<AuthenticatedUser> {
  const passwordHash = await hashPassword(input.password);

  try {
    const user = await UserModel.create({
      fullName: input.fullName,
      email: input.email,
      phone: input.phone,
      passwordHash,
    });

    return toAuthenticatedUser(user);
  } catch (error) {
    if (isMongoDuplicateKeyError(error)) {
      throw new HttpError(409, "An account with that email already exists");
    }

    throw error;
  }
}

export async function loginUser(input: LoginInput): Promise<AuthenticatedUser> {
  const user = await UserModel.findOne({ email: input.email }).select(
    "+passwordHash",
  );

  if (!user || !(await verifyPassword(input.password, user.passwordHash))) {
    throw new HttpError(401, "Invalid email or password");
  }

  return toAuthenticatedUser(user);
}

export async function getUserProfile(
  userId: string,
): Promise<DocumentType<User>> {
  const user = await UserModel.findById(userId).select(PUBLIC_USER_FIELDS);

  if (!user) {
    throw new HttpError(404, "User not found");
  }

  return user;
}

export async function updateUserProfile(
  userId: string,
  updates: UpdateProfileInput,
): Promise<DocumentType<User>> {
  try {
    const user = await UserModel.findByIdAndUpdate(
      userId,
      { $set: updates },
      { new: true, runValidators: true },
    ).select(PUBLIC_USER_FIELDS);

    if (!user) {
      throw new HttpError(404, "User not found");
    }

    return user;
  } catch (error) {
    if (isMongoDuplicateKeyError(error)) {
      throw new HttpError(409, "An account with that email already exists");
    }

    throw error;
  }
}

/**
 * Genera un token de recuperacion si el email pertenece a una cuenta.
 * Devuelve el token solo fuera de produccion, donde todavia no hay envio de
 * mails; en produccion siempre devuelve null para no filtrar el token.
 */
export async function requestPasswordReset(email: string): Promise<{
  resetToken: string | null;
}> {
  const { token, tokenHash } = createPasswordResetToken();
  const user = await UserModel.findOneAndUpdate(
    { email },
    {
      $set: {
        passwordResetTokenHash: tokenHash,
        passwordResetExpiresAt: new Date(Date.now() + RESET_TOKEN_DURATION_MS),
      },
    },
  );

  return {
    resetToken: user && !env.isProduction ? token : null,
  };
}

export async function resetPassword(
  token: string,
  password: string,
): Promise<void> {
  const passwordHash = await hashPassword(password);
  const user = await UserModel.findOneAndUpdate(
    {
      passwordResetTokenHash: hashResetToken(token),
      passwordResetExpiresAt: { $gt: new Date() },
    },
    {
      $set: { passwordHash },
      $unset: { passwordResetExpiresAt: 1, passwordResetTokenHash: 1 },
    },
  );

  if (!user) {
    throw new HttpError(400, "Invalid or expired reset token");
  }
}
