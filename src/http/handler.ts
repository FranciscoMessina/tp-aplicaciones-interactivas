import type { Request, RequestHandler, Response } from "express";
import type { ZodType, z } from "zod";
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
 * Un handler declara que parte del request necesita y que autenticacion exige;
 * el modulo se encarga del resto. Como el requisito de auth es un dato del
 * handler y no un middleware que se monta aparte, no hay forma de olvidarse de
 * mountarlo, y el payload llega tipado por parametro en vez de por casteo.
 */
export interface RequestSchema {
  body?: ZodType;
  params?: ZodType;
  query?: ZodType;
}

/** `user` y `admin` exigen token; `optional` lo acepta si viene y sigue si no. */
export type AuthMode = "user" | "admin" | "optional";

type Input<TSchema extends RequestSchema> = {
  [K in keyof TSchema]: TSchema[K] extends ZodType
    ? z.infer<TSchema[K]>
    : never;
};

type AuthContext<TAuth extends AuthMode | undefined> = TAuth extends "optional"
  ? { auth: AccessTokenPayload | undefined }
  : TAuth extends "user" | "admin"
    ? { auth: AccessTokenPayload }
    : Record<never, never>;

type Context<
  TSchema extends RequestSchema,
  TAuth extends AuthMode | undefined,
> = { input: Input<TSchema> } & AuthContext<TAuth>;

/**
 * Esta funcion la usamos para mejorar la experiencia de desarrollo con typescript
 * Si usamos middlewares normales con express no sabemos los tipos de las request
 * que son modificadas por esos middlewares, y podemos olvidarnos de poner el middleware en alguna ruta. Con este handler que se usa para definir la funcion del controller nos ahorramos el problema de poner los middlewares.
 *
 * @param options
 * @param respond
 * @returns
 */
export function handler<
  TSchema extends RequestSchema = Record<never, never>,
  TAuth extends AuthMode | undefined = undefined,
>(
  options: { schema?: TSchema; auth?: TAuth },
  respond: (
    req: Request,
    res: Response,
    context: Context<TSchema, TAuth>,
  ) => void | Promise<void>,
): RequestHandler {
  return (req, res, next) => {
    void (async () => {
      const auth = resolveAuth(req, options.auth);
      const input = parseRequest(req, options.schema);
      // El unico casteo del modulo, y queda de este lado de la interfaz: los
      // tipos de `input` y `auth` los derivan las opciones, no el runtime.
      await respond(req, res, { input, auth } as unknown as Context<
        TSchema,
        TAuth
      >);
    })().catch(next);
  };
}

function parseRequest(
  req: Request,
  schema: RequestSchema | undefined,
): Record<string, unknown> {
  const input: Record<string, unknown> = {};

  if (!schema) {
    return input;
  }

  if (schema.body) {
    input.body = schema.body.parse(req.body);
  }

  if (schema.params) {
    input.params = schema.params.parse(req.params);
  }

  if (schema.query) {
    input.query = schema.query.parse(req.query);
  }

  return input;
}

function resolveAuth(
  req: Request,
  mode: AuthMode | undefined,
): AccessTokenPayload | undefined {
  if (mode === undefined) {
    return undefined;
  }

  const authorization = req.header("authorization");

  if (!authorization?.startsWith("Bearer ")) {
    if (mode === "optional") {
      return undefined;
    }

    throw new ApplicationError(
      ApplicationErrorKind.Unauthenticated,
      "A bearer token is required",
    );
  }

  let payload: AccessTokenPayload;

  try {
    payload = verifyAccessToken(authorization.slice(7));
  } catch {
    if (mode === "optional") {
      return undefined;
    }

    throw new ApplicationError(
      ApplicationErrorKind.Unauthenticated,
      "Invalid or expired token",
    );
  }

  if (mode === "admin" && payload.role !== UserRole.Admin) {
    throw new ApplicationError(
      ApplicationErrorKind.Forbidden,
      "Insufficient permissions",
    );
  }

  return payload;
}
