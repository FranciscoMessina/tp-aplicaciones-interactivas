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
  jwtExpirationSeconds: parsePositiveInteger(
    process.env.JWT_EXPIRATION_SECONDS,
    DEFAULT_JWT_EXPIRATION_SECONDS,
    "JWT_EXPIRATION_SECONDS",
  ),
  jwtSecret: getJwtSecret(),
  mongoUri: getRequiredEnvironmentVariable("MONGODB_URI"),
  port: parsePort(process.env.PORT),
});
