import {
  getModelForClass,
  index,
  modelOptions,
  prop,
} from "@typegoose/typegoose";

export const UserRole = {
  Customer: "customer",
  Admin: "admin",
} as const;

export type UserRole = (typeof UserRole)[keyof typeof UserRole];

@index({ email: 1 }, { unique: true })
@modelOptions({ schemaOptions: { timestamps: true } })
export class User {
  @prop({ required: true, trim: true })
  public fullName!: string;

  @prop({ required: true, lowercase: true, trim: true })
  public email!: string;

  @prop({ required: true, trim: true })
  public phone!: string;

  @prop({ required: true, enum: UserRole, default: UserRole.Customer })
  public role!: UserRole;

  @prop({ required: true, select: false })
  public passwordHash!: string;

  @prop({ select: false })
  public passwordResetTokenHash?: string;

  @prop({ select: false })
  public passwordResetExpiresAt?: Date;
}

export const UserModel = getModelForClass(User);
