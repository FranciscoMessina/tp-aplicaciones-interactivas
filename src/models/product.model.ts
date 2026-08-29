import {
  getModelForClass,
  index,
  modelOptions,
  prop,
  type Ref,
} from "@typegoose/typegoose";
import { baseModelOptions } from "./model-options.ts";

import { Category } from "./category.model.ts";

@index(
  { name: "text", description: "text" },
  {
    name: "product_search",
    default_language: "spanish",
    weights: { name: 2, description: 1 },
  },
)
@modelOptions(baseModelOptions)
export class Product {
  @prop({ required: true, trim: true })
  public name!: string;

  @prop({ ref: () => Category, required: true })
  public category!: Ref<Category>;

  @prop({ required: true, trim: true })
  public description!: string;

  @prop({ type: () => [String], default: [] })
  public images!: string[];

  @prop({ min: 0, required: true })
  public price!: number;

  @prop({ min: 0, required: true, default: 0 })
  public availableQuantity!: number;

  @prop({ required: true, default: true })
  public isActive!: boolean;
}

export const ProductModel = getModelForClass(Product);
