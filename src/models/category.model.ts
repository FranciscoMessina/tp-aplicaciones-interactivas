import {
  getModelForClass,
  index,
  modelOptions,
  prop,
} from "@typegoose/typegoose";

@index({ name: 1 }, { unique: true })
@modelOptions({ schemaOptions: { timestamps: true } })
export class Category {
  @prop({ required: true, trim: true })
  public name!: string;
}

export const CategoryModel = getModelForClass(Category);