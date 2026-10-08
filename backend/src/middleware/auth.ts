import type { Request, RequestHandler } from "express";
import {
  ApplicationError,
  ApplicationErrorKind,
} from "../domain/application-error.ts";
import { UserRole } from "../models/user.model.ts";
import {
  verifyAccessToken,
  type AccessTokenPayload,
} from "../services/auth.service.ts";

/**
 * Le agrega a TypeScript el campo `req.user` que completan estos middlewares.
 * Sin esto, `req.user` seria un error de tipos en los controllers. Es opcional
 * porque solo existe en las rutas que pasan por `authenticate`.
 */
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: AccessTokenPayload;
    }
  }
}

/**
 * Como funciona la autenticacion:
 *
 * 1. Al hacer login, el servidor devuelve un token JWT firmado con un secreto
 *    que solo conoce el servidor. Adentro lleva el id y el rol del usuario.
 * 2. El front manda ese token en cada request, en el header
 *    `Authorization: Bearer <token>`.
 * 3. Estos middlewares verifican la firma del token. Si es valida, sabemos que
 *    lo emitimos nosotros y que nadie cambio su contenido.
 *
 * En las rutas se encadenan en orden, primero quien es y despues que puede hacer:
 *
 *   router.post("/", authenticate, requireAdmin, createProduct);
 *
 * Si un middleware tira un error, Express corta la cadena y el controller no
 * se ejecuta.
 */

/** Exige un token valido y deja el usuario en `req.user`. Si no, responde 401. */
export const authenticate: RequestHandler = (req, _res, next) => {
  const token = getBearerToken(req);

  if (!token) {
    throw new ApplicationError(
      ApplicationErrorKind.Unauthenticated,
      "Se requiere un token de acceso",
    );
  }

  try {
    req.user = verifyAccessToken(token);
  } catch {
    throw new ApplicationError(
      ApplicationErrorKind.Unauthenticated,
      "El token es inválido o está vencido",
    );
  }

  next();
};

/**
 * Para rutas publicas que se comportan distinto si hay un usuario logueado.
 * Si el token falta o no es valido, sigue como visitante anonimo en vez de
 * responder 401.
 */
export const optionalAuthenticate: RequestHandler = (req, _res, next) => {
  const token = getBearerToken(req);

  if (token) {
    try {
      req.user = verifyAccessToken(token);
    } catch {
      // Token invalido: se trata igual que un visitante sin token.
    }
  }

  next();
};

/** Solo deja pasar administradores. Va siempre despues de `authenticate`. */
export const requireAdmin: RequestHandler = (req, _res, next) => {
  if (req.user?.role !== UserRole.Admin) {
    throw new ApplicationError(
      ApplicationErrorKind.Forbidden,
      "No tenés permisos para realizar esta acción",
    );
  }

  next();
};

/**
 * Para controllers de rutas protegidas con `authenticate`: devuelve el usuario
 * ya sin el `undefined`. Si alguien se olvida el middleware en la ruta,
 * responde 401 en vez de romper con un error de JavaScript.
 */
export function getAuthenticatedUser(req: Request): AccessTokenPayload {
  if (!req.user) {
    throw new ApplicationError(
      ApplicationErrorKind.Unauthenticated,
      "Tenés que iniciar sesión",
    );
  }

  return req.user;
}

function getBearerToken(req: Request): string | undefined {
  const authorization = req.header("authorization");

  if (!authorization?.startsWith("Bearer ")) {
    return undefined;
  }

  return authorization.slice("Bearer ".length);
}
