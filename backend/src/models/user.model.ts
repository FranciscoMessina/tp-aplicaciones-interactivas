import {
  getModelForClass,
  index,
  modelOptions,
  prop,
} from "@typegoose/typegoose";
import { baseModelOptions } from "./model-options.ts";

// La consigna solo tiene cuentas para los administradores del comercio: los
// visitantes navegan y envian consultas sin registrarse. El rol queda en el
// modelo y en el token para que la autorizacion no dependa de esa suposicion.
export const UserRole = {
  Admin: "admin",
} as const;

export type UserRole = (typeof UserRole)[keyof typeof UserRole];

@index({ email: 1 }, { unique: true })
@modelOptions(baseModelOptions)
export class User {
  @prop({ required: true, trim: true })
  public fullName!: string;

  @prop({ required: true, lowercase: true, trim: true })
  public email!: string;

  @prop({ required: true, trim: true })
  public phone!: string;

  @prop({ required: true, enum: UserRole, default: UserRole.Admin })
  public role!: UserRole;

  // Las cuentas las crea otro administrador sin contraseña: la elige la
  // persona invitada con el enlace que recibe por mail. Hasta entonces no
  // puede iniciar sesion.
  @prop({ select: false })
  public passwordHash?: string;

  // Viaja en cada token. Al cambiar la contraseña se incrementa, y los tokens
  // emitidos antes dejan de ser validos aunque no hayan vencido.
  @prop({ required: true, default: 0, select: false })
  public sessionVersion!: number;

  @prop({ select: false })
  public passwordResetTokenHash?: string;

  @prop({ select: false })
  public passwordResetExpiresAt?: Date;
}

export const UserModel = getModelForClass(User);
