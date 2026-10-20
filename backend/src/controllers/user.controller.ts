import type { Request, Response } from "express";
import { sendSuccess } from "../http/responses.ts";
import { validate } from "../http/validate.ts";
import { getAuthenticatedUser } from "../middleware/auth.ts";
import { idParamsSchema } from "../schemas/common.schema.ts";
import {
  changePasswordSchema,
  createUserSchema,
  forgotPasswordSchema,
  loginSchema,
  resetPasswordSchema,
  updateProfileSchema,
} from "../schemas/user.schema.ts";
import * as userService from "../services/user.service.ts";

export async function listUsers(_req: Request, res: Response): Promise<void> {
  sendSuccess(res, await userService.listUsers());
}

export async function createUser(req: Request, res: Response): Promise<void> {
  const body = validate(createUserSchema, req.body);
  sendSuccess(res, await userService.createUser(body), 201);
}

export async function deleteUser(req: Request, res: Response): Promise<void> {
  const { sub: requesterId } = getAuthenticatedUser(req);
  const { id } = validate(idParamsSchema, req.params);
  await userService.deleteUser(requesterId, id);
  res.status(204).send();
}

export async function login(req: Request, res: Response): Promise<void> {
  const body = validate(loginSchema, req.body);
  sendSuccess(res, await userService.loginUser(body));
}

/**
 * Con JWT el servidor no guarda sesiones, asi que no hay nada que borrar aca:
 * cerrar sesion es que el front descarte el token. El endpoint existe para que
 * el front tenga donde avisar y para confirmar que el token era valido.
 */
export function logout(_req: Request, res: Response): void {
  res.status(204).send();
}

export async function getProfile(req: Request, res: Response): Promise<void> {
  const { sub: userId } = getAuthenticatedUser(req);
  sendSuccess(res, await userService.getUserProfile(userId));
}

export async function updateProfile(
  req: Request,
  res: Response,
): Promise<void> {
  const { sub: userId } = getAuthenticatedUser(req);
  const body = validate(updateProfileSchema, req.body);
  sendSuccess(res, await userService.updateUserProfile(userId, body));
}

export async function changePassword(
  req: Request,
  res: Response,
): Promise<void> {
  const { sub: userId } = getAuthenticatedUser(req);
  const { currentPassword, newPassword } = validate(
    changePasswordSchema,
    req.body,
  );
  const accessToken = await userService.changePassword(
    userId,
    currentPassword,
    newPassword,
  );
  sendSuccess(res, {
    message: "La contraseña se actualizó correctamente",
    accessToken,
  });
}

export async function requestPasswordReset(
  req: Request,
  res: Response,
): Promise<void> {
  const { email } = validate(forgotPasswordSchema, req.body);
  // El mensaje es el mismo exista o no la cuenta, para que nadie pueda usar
  // este endpoint para averiguar que emails estan registrados.
  await userService.requestPasswordReset(email);
  sendSuccess(res, {
    message:
      "Si la cuenta existe, se enviaron las instrucciones para recuperar la contraseña",
  });
}

export async function resetPassword(
  req: Request,
  res: Response,
): Promise<void> {
  const { token, password } = validate(resetPasswordSchema, req.body);
  await userService.resetPassword(token, password);
  sendSuccess(res, { message: "La contraseña se actualizó correctamente" });
}
