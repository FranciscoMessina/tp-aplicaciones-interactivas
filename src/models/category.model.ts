import {
  getModelForClass,
  index,
  modelOptions,
  prop,
} from "@typegoose/typegoose";
import { baseModelOptions } from "./model-options.ts";

// Con esta collation "Consolas" y "consolas" son el mismo nombre, tanto para
// el indice unico como para ordenar el listado.
export const categoryCollation = { locale: "es", strength: 2 };

@index({ name: 1 }, { unique: true, collation: categoryCollation })
@modelOptions(baseModelOptions)
export class Category {
  @prop({ required: true, trim: true })
  public name!: string;
}

export const CategoryModel = getModelForClass(Category);
