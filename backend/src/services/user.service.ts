import type { DocumentType } from "@typegoose/typegoose";
import {
  ApplicationError,
  ApplicationErrorKind,
} from "../domain/application-error.ts";
import { User, UserModel, UserRole } from "../models/user.model.ts";
import {
  createAccessToken,
  createPasswordResetToken,
  hashPassword,
  hashResetToken,
  verifyPassword,
} from "./auth.service.ts";
import { sendPasswordResetEmail } from "./mail.service.ts";

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

export interface PublicUser {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  role: UserRole;
}

export interface AuthenticatedUser {
  accessToken: string;
  user: PublicUser;
}

// Un documento recien creado todavia tiene `passwordHash` en memoria (el
// `select: false` solo aplica a las consultas), asi que no se puede devolver
// tal cual.
function toPublicUser(user: DocumentType<User>): PublicUser {
  return {
    id: user.id,
    fullName: user.fullName,
    email: user.email,
    phone: user.phone,
    role: user.role,
  };
}

function toAuthenticatedUser(user: DocumentType<User>): AuthenticatedUser {
  return {
    accessToken: createAccessToken(user.id, user.role),
    user: toPublicUser(user),
  };
}

async function createUser(
  input: RegisterUserInput,
  role: UserRole,
): Promise<DocumentType<User>> {
  return UserModel.create({
    fullName: input.fullName,
    email: input.email,
    phone: input.phone,
    passwordHash: await hashPassword(input.password),
    role,
  });
}

export async function registerUser(
  input: RegisterUserInput,
): Promise<AuthenticatedUser> {
  return toAuthenticatedUser(await createUser(input, UserRole.Customer));
}

/**
 * Nadie se registra como administrador: el primero lo crea el seed y los
 * demas los crea un administrador desde `POST /api/users/admins`. No devuelve
 * token porque la cuenta es para otra persona.
 */
export async function createAdmin(
  input: RegisterUserInput,
): Promise<PublicUser> {
  return toPublicUser(await createUser(input, UserRole.Admin));
}

export async function loginUser(input: LoginInput) {
  const user = await UserModel.findOne({ email: input.email }).select(
    "+passwordHash",
  );

  if (!user || !(await verifyPassword(input.password, user.passwordHash))) {
    throw new ApplicationError(
      ApplicationErrorKind.Unauthenticated,
      "El email o la contraseña son incorrectos",
    );
  }

  return toAuthenticatedUser(user);
}

export async function getUserProfile(
  userId: string,
): Promise<DocumentType<User>> {
  const user = await UserModel.findById(userId).select(PUBLIC_USER_FIELDS);

  if (!user) {
    throw new ApplicationError(
      ApplicationErrorKind.NotFound,
      "No se encontró el usuario",
    );
  }

  return user;
}

export async function updateUserProfile(
  userId: string,
  updates: UpdateProfileInput,
): Promise<DocumentType<User>> {
  const user = await UserModel.findByIdAndUpdate(
    userId,
    { $set: updates },
    { returnDocument: "after", runValidators: true },
  ).select(PUBLIC_USER_FIELDS);

  if (!user) {
    throw new ApplicationError(
      ApplicationErrorKind.NotFound,
      "No se encontró el usuario",
    );
  }

  return user;
}

export async function changePassword(
  userId: string,
  currentPassword: string,
  newPassword: string,
): Promise<void> {
  const user = await UserModel.findById(userId).select("+passwordHash");

  if (!user) {
    throw new ApplicationError(
      ApplicationErrorKind.NotFound,
      "No se encontró el usuario",
    );
  }

  if (!(await verifyPassword(currentPassword, user.passwordHash))) {
    throw new ApplicationError(
      ApplicationErrorKind.InvalidInput,
      "Hay campos con errores",
      { currentPassword: ["La contraseña actual es incorrecta"] },
    );
  }

  user.passwordHash = await hashPassword(newPassword);
  await user.save();
}

/**
 * Si el email pertenece a una cuenta, genera un token de recuperacion y se lo
 * envia. Si no, no hace nada: quien llama no tiene que poder distinguir los
 * dos casos.
 */
export async function requestPasswordReset(email: string): Promise<void> {
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

  if (user) {
    sendPasswordResetEmail(email, token);
  }
}

/**
 * Busca al usuario por el hash del token y verifica que no este vencido, todo
 * en la misma consulta. Al cambiar la contraseña borra el token, asi no se
 * puede usar dos veces.
 */
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
    throw new ApplicationError(
      ApplicationErrorKind.InvalidInput,
      "El token de recuperación es inválido o está vencido",
    );
  }
}
