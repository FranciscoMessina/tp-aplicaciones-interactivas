import {
  getModelForClass,
  modelOptions,
  prop,
  type Ref,
} from "@typegoose/typegoose";
import { baseModelOptions } from "./model-options.ts";

import { Category } from "./category.model.ts";

// Seguramente se pregunten, que demonios es esto?
// Bueno es una forma de definir los modelos de Mongoose con typescript,
// evita tener codigo extra y duplicado.
// En este primer decorator se configuran opciones del schema.
@modelOptions(baseModelOptions)
export class Product {
  // En cada prop decorator se configura el campo del documento en si.
  @prop({ required: true, trim: true })
  public name!: string;

  @prop({ ref: () => Category, required: true })
  public category!: Ref<Category>;

  @prop({ required: true, trim: true })
  public description!: string;

  @prop({ type: () => [String], default: [] })
  public images!: string[];

  @prop({ min: 0 })
  public price?: number;

  @prop({ required: true, default: true })
  public isActive!: boolean;
}

export const ProductModel = getModelForClass(Product);
