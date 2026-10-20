import { rateLimit, type RateLimitRequestHandler } from "express-rate-limit";
import {
  ApplicationError,
  ApplicationErrorKind,
} from "../domain/application-error.ts";

/**
 * Limita cuantas veces una misma IP puede llamar a un endpoint publico en una
 * ventana de tiempo, para frenar a quien prueba contraseñas o manda consultas
 * en masa. Cada limitador lleva su propia cuenta, en memoria del proceso.
 *
 * Si la API se publica detras de un proxy, hay que definir `TRUST_PROXY` (ver
 * env.ts): si no, todas las requests llegan con la IP del proxy.
 */
function limitPerIp(
  limit: number,
  windowMinutes: number,
  options: { skipSuccessfulRequests?: boolean } = {},
): RateLimitRequestHandler {
  return rateLimit({
    windowMs: windowMinutes * 60 * 1000,
    limit,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    ...options,
    handler: (_req, _res, next) => {
      next(
        new ApplicationError(
          ApplicationErrorKind.TooManyRequests,
          `Hiciste demasiados intentos. Probá de nuevo en ${windowMinutes} minutos`,
        ),
      );
    },
  });
}

// Solo cuentan los intentos fallidos: quien ingresa bien no se bloquea.
export const loginLimiter = limitPerIp(10, 15, {
  skipSuccessfulRequests: true,
});
export const forgotPasswordLimiter = limitPerIp(5, 15);
export const resetPasswordLimiter = limitPerIp(10, 15);
export const enquiryLimiter = limitPerIp(5, 60);
