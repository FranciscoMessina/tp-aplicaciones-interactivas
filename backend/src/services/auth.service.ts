import { createHash, randomBytes, randomUUID } from "node:crypto";
import bcrypt from "bcryptjs";
import jwt, { type JwtPayload } from "jsonwebtoken";
import { env } from "../config/env.ts";
import { UserRole } from "../models/user.model.ts";

const PASSWORD_SALT_ROUNDS = 12;

export interface AccessTokenPayload extends JwtPayload {
  sub: string;
  jti: string;
  type: "access";
  role: UserRole;
  // La `sessionVersion` del usuario al emitir el token.
  ver: number;
}

/**
 * Las contraseñas nunca se guardan tal cual: se guarda un hash de bcrypt, que
 * no se puede revertir. Para el login se vuelve a hashear lo que escribio el
 * usuario y se compara con el guardado.
 */
export function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, PASSWORD_SALT_ROUNDS);
}

export function verifyPassword(
  password: string,
  passwordHash: string,
): Promise<boolean> {
  return bcrypt.compare(password, passwordHash);
}

/**
 * Un JWT es un texto con datos (id y rol del usuario, vencimiento) y una firma
 * hecha con `JWT_SECRET`. Cualquiera puede leer los datos, pero sin el secreto
 * nadie puede modificarlos sin romper la firma. Igual, en cada request se
 * consulta al usuario (ver `authenticate`): asi un token deja de servir si la
 * cuenta se elimino o si se cambio la contraseña.
 */
export function createAccessToken(
  userId: string,
  role: UserRole,
  sessionVersion: number,
): string {
  return jwt.sign(
    { type: "access", role, ver: sessionVersion },
    env.jwtSecret,
    {
      expiresIn: env.jwtExpirationSeconds,
      jwtid: randomUUID(),
      subject: userId,
    },
  );
}

/**
 * Verifica firma y vencimiento, y despues que el contenido tenga la forma que
 * esperamos. Tira un error si algo no cierra.
 */
export function verifyAccessToken(token: string): AccessTokenPayload {
  const payload = jwt.verify(token, env.jwtSecret, {
    algorithms: ["HS256"],
  });

  if (
    typeof payload === "string" ||
    payload.type !== "access" ||
    typeof payload.sub !== "string" ||
    typeof payload.jti !== "string" ||
    typeof payload.ver !== "number" ||
    !Object.values(UserRole).includes(payload.role as UserRole)
  ) {
    throw new Error("Invalid access token payload");
  }

  return payload as AccessTokenPayload;
}

/**
 * El token de recuperacion es un valor aleatorio que se le da al usuario. En la
 * base se guarda solo su hash SHA-256, asi alguien que lea la base no puede
 * usarlo. Aca alcanza con SHA-256 (no bcrypt) porque el token es largo y
 * aleatorio, no una contraseña que se pueda adivinar.
 */
export function createPasswordResetToken(): {
  token: string;
  tokenHash: string;
} {
  const token = randomBytes(32).toString("hex");
  return { token, tokenHash: hashResetToken(token) };
}

export function hashResetToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}
