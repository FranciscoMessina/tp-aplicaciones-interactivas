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

  @prop({ required: true, select: false })
  public passwordHash!: string;

  @prop({ select: false })
  public passwordResetTokenHash?: string;

  @prop({ select: false })
  public passwordResetExpiresAt?: Date;
}

export const UserModel = getModelForClass(User);
