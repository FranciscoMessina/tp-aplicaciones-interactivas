import type { DocumentType } from "@typegoose/typegoose";
import {
  ApplicationError,
  ApplicationErrorKind,
} from "../domain/application-error.ts";
import { User, UserModel, UserRole } from "../models/user.model.ts";
import {
  type AccessTokenPayload,
  createAccessToken,
  createPasswordResetToken,
  hashPassword,
  hashResetToken,
  verifyPassword,
} from "./auth.service.ts";
import { sendInvitationEmail, sendPasswordResetEmail } from "./mail.service.ts";

const RESET_TOKEN_DURATION_MS = 15 * 60 * 1000;
// La invitacion dura mas que una recuperacion: quien la recibe no la pidio y
// puede tardar en ver el mail.
const INVITATION_DURATION_MS = 72 * 60 * 60 * 1000;

// Campos que se pueden devolver al cliente sin exponer datos sensibles.
const PUBLIC_USER_FIELDS = "fullName email phone role createdAt updatedAt";

export interface CreateUserInput {
  fullName: string;
  email: string;
  phone: string;
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
    accessToken: createAccessToken(user.id, user.role, user.sessionVersion),
    user: toPublicUser(user),
  };
}

/**
 * Las unicas cuentas son las de los administradores del comercio, y solo otro
 * administrador las puede crear. La cuenta nace sin contraseña: se le manda a
 * la persona un enlace para elegirla, que usa el mismo mecanismo que la
 * recuperacion. Asi quien la crea nunca conoce la contraseña.
 */
export async function createUser(input: CreateUserInput): Promise<PublicUser> {
  const { token, tokenHash } = createPasswordResetToken();
  const user = await UserModel.create({
    ...input,
    role: UserRole.Admin,
    passwordResetTokenHash: tokenHash,
    passwordResetExpiresAt: new Date(Date.now() + INVITATION_DURATION_MS),
  });

  sendInvitationEmail(user.email, user.fullName, token);
  return toPublicUser(user);
}

export function listUsers(): Promise<DocumentType<User>[]> {
  return UserModel.find().select(PUBLIC_USER_FIELDS).sort({ fullName: 1 });
}

export async function deleteUser(
  requesterId: string,
  userId: string,
): Promise<void> {
  // Ademas de evitar quedarse afuera, garantiza que siempre quede al menos un
  // administrador: quien elimina sigue existiendo.
  if (requesterId === userId) {
    throw new ApplicationError(
      ApplicationErrorKind.Conflict,
      "No podés eliminar tu propia cuenta",
    );
  }

  const user = await UserModel.findByIdAndDelete(userId);

  if (!user) {
    throw new ApplicationError(
      ApplicationErrorKind.NotFound,
      "No se encontró el usuario",
    );
  }
}

/**
 * La firma del token prueba que lo emitimos nosotros, pero no que siga
 * vigente: la cuenta pudo eliminarse o la contraseña pudo cambiar despues.
 */
export async function ensureSessionIsCurrent(
  payload: AccessTokenPayload,
): Promise<void> {
  const user = await UserModel.findById(payload.sub).select("+sessionVersion");

  if (!user || user.sessionVersion !== payload.ver) {
    throw new ApplicationError(
      ApplicationErrorKind.Unauthenticated,
      "Tu sesión ya no es válida. Volvé a iniciar sesión",
    );
  }
}

/** Destinatarios de los avisos del comercio, como las consultas nuevas. */
export async function listAdminEmails(): Promise<string[]> {
  const admins = await UserModel.find({ role: UserRole.Admin }).select("email");
  return admins.map((admin) => admin.email);
}

export async function loginUser(input: LoginInput) {
  const user = await UserModel.findOne({ email: input.email }).select(
    "+passwordHash +sessionVersion",
  );

  if (
    !user?.passwordHash ||
    !(await verifyPassword(input.password, user.passwordHash))
  ) {
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

/**
 * Cierra las demas sesiones y anula los enlaces de recuperacion pendientes.
 * Devuelve un token nuevo para que la sesion desde la que se cambio siga.
 */
export async function changePassword(
  userId: string,
  currentPassword: string,
  newPassword: string,
): Promise<string> {
  const user = await UserModel.findById(userId).select(
    "+passwordHash +sessionVersion",
  );

  if (!user) {
    throw new ApplicationError(
      ApplicationErrorKind.NotFound,
      "No se encontró el usuario",
    );
  }

  if (
    !user.passwordHash ||
    !(await verifyPassword(currentPassword, user.passwordHash))
  ) {
    throw new ApplicationError(
      ApplicationErrorKind.InvalidInput,
      "Hay campos con errores",
      { currentPassword: ["La contraseña actual es incorrecta"] },
    );
  }

  user.passwordHash = await hashPassword(newPassword);
  user.sessionVersion += 1;
  user.passwordResetTokenHash = undefined;
  user.passwordResetExpiresAt = undefined;
  await user.save();

  return createAccessToken(user.id, user.role, user.sessionVersion);
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
 * puede usar dos veces, y cierra las sesiones abiertas. Tambien completa las
 * invitaciones, que usan el mismo token.
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
      $inc: { sessionVersion: 1 },
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
