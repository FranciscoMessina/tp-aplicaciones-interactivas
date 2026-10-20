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

const isProduction = process.env.NODE_ENV === "production";

// Sin SMTP los mails se escriben en la consola del servidor. Eso sirve para
// desarrollar, pero en produccion dejaria enlaces de recuperacion y datos de
// los visitantes en los logs, y nadie recibiria los correos.
function getSmtpConfig() {
  if (!process.env.SMTP_HOST) {
    if (isProduction) {
      throw new Error("SMTP_HOST is required in production");
    }

    return undefined;
  }

  return {
    host: process.env.SMTP_HOST,
    port: parsePositiveInteger(process.env.SMTP_PORT, 587, "SMTP_PORT"),
    user: process.env.SMTP_USER,
    password: process.env.SMTP_PASSWORD,
    from: process.env.MAIL_FROM ?? "TechStore <no-reply@techstore.com>",
  };
}

function getJwtSecret(): string {
  const secret = getRequiredEnvironmentVariable("JWT_SECRET");

  if (secret.length < 32) {
    throw new Error("JWT_SECRET must contain at least 32 characters");
  }

  return secret;
}

export const env = Object.freeze({
  isProduction,
  // Para armar los enlaces que se mandan por mail, como el de recuperacion.
  frontendUrl: process.env.FRONTEND_URL ?? "http://localhost:5173",
  // Opcional en desarrollo, obligatorio en produccion.
  smtp: getSmtpConfig(),
  jwtExpirationSeconds: parsePositiveInteger(
    process.env.JWT_EXPIRATION_SECONDS,
    DEFAULT_JWT_EXPIRATION_SECONDS,
    "JWT_EXPIRATION_SECONDS",
  ),
  jwtSecret: getJwtSecret(),
  mongoUri: getRequiredEnvironmentVariable("MONGODB_URI"),
  port: parsePort(process.env.PORT),
  // Cuantos proxies hay delante de la API (0 si ninguno). Con proxy, Express
  // tiene que leer la IP del cliente del header que agrega el proxy: si no, los
  // limites por IP cuentan a todos los visitantes como uno solo.
  trustProxyHops: process.env.TRUST_PROXY
    ? parsePositiveInteger(process.env.TRUST_PROXY, 1, "TRUST_PROXY")
    : 0,
});
