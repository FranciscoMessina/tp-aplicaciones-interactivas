import {
  getModelForClass,
  index,
  modelOptions,
  prop,
} from "@typegoose/typegoose";
import { baseModelOptions } from "./model-options.ts";

@index({ name: 1 }, { unique: true })
@modelOptions(baseModelOptions)
export class Category {
  @prop({ required: true, trim: true })
  public name!: string;
}

export const CategoryModel = getModelForClass(Category);
