import { createHash, randomBytes, randomUUID } from "node:crypto";
import bcrypt from "bcryptjs";
import jwt, { type JwtPayload } from "jsonwebtoken";
import { env } from "../config/env.ts";

const PASSWORD_SALT_ROUNDS = 12;

export interface AccessTokenPayload extends JwtPayload {
  sub: string;
  jti: string;
  type: "access";
}

export function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, PASSWORD_SALT_ROUNDS);
}

export function verifyPassword(
  password: string,
  passwordHash: string,
): Promise<boolean> {
  return bcrypt.compare(password, passwordHash);
}

export function createAccessToken(userId: string): string {
  return jwt.sign({ type: "access" }, env.jwtSecret, {
    expiresIn: env.jwtExpirationSeconds,
    jwtid: randomUUID(),
    subject: userId,
  });
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  const payload = jwt.verify(token, env.jwtSecret, {
    algorithms: ["HS256"],
  });

  if (
    typeof payload === "string" ||
    payload.type !== "access" ||
    typeof payload.sub !== "string" ||
    typeof payload.jti !== "string"
  ) {
    throw new Error("Invalid access token payload");
  }

  return payload as AccessTokenPayload;
}

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
