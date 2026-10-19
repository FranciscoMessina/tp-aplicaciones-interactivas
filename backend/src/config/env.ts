const DEFAULT_PORT = 8080;
const DEFAULT_JWT_EXPIRATION_SECONDS = 60 * 60;

function getRequiredEnvironmentVariable(name: string): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(`${name} is not defined`);
  }

  return value;
}

function parsePort(value: string | undefined): number {
  if (!value) {
    return DEFAULT_PORT;
  }

  const port = Number(value);

  if (!Number.isInteger(port) || port < 1 || port > 65_535) {
    throw new Error("PORT must be an integer between 1 and 65535");
  }

  return port;
}

function parsePositiveInteger(
  value: string | undefined,
  fallback: number,
  name: string,
): number {
  if (!value) {
    return fallback;
  }

  const parsedValue = Number(value);

  if (!Number.isSafeInteger(parsedValue) || parsedValue < 1) {
    throw new Error(`${name} must be a positive integer`);
  }

  return parsedValue;
}

function getJwtSecret(): string {
  const secret = getRequiredEnvironmentVariable("JWT_SECRET");

  if (secret.length < 32) {
    throw new Error("JWT_SECRET must contain at least 32 characters");
  }

  return secret;
}

export const env = Object.freeze({
  isProduction: process.env.NODE_ENV === "production",
  // Para armar los enlaces que se mandan por mail, como el de recuperacion.
  frontendUrl: process.env.FRONTEND_URL ?? "http://localhost:5173",
  // Opcional: sin SMTP_HOST los mails se escriben en la consola del servidor.
  smtp: process.env.SMTP_HOST
    ? {
        host: process.env.SMTP_HOST,
        port: parsePositiveInteger(process.env.SMTP_PORT, 587, "SMTP_PORT"),
        user: process.env.SMTP_USER,
        password: process.env.SMTP_PASSWORD,
        from: process.env.MAIL_FROM ?? "TechStore <no-reply@techstore.com>",
      }
    : undefined,
  jwtExpirationSeconds: parsePositiveInteger(
    process.env.JWT_EXPIRATION_SECONDS,
    DEFAULT_JWT_EXPIRATION_SECONDS,
    "JWT_EXPIRATION_SECONDS",
  ),
  jwtSecret: getJwtSecret(),
  mongoUri: getRequiredEnvironmentVariable("MONGODB_URI"),
  port: parsePort(process.env.PORT),
});
