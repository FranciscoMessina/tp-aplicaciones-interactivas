import {
  getModelForClass,
  modelOptions,
  prop,
  searchIndex,
  type Ref,
} from "@typegoose/typegoose";
import { baseModelOptions } from "./model-options.ts";

import { Category } from "./category.model.ts";

/**
 * `dynamic: false` obliga a declarar cada campo que la busqueda toca, y el tipo
 * del mapping decide que operador lo puede usar: `text` solo lee `string`,
 * `autocomplete` solo lee `autocomplete`, y `equals`/`range` solo leen el tipo
 * exacto del campo. Un campo que falta no da error, devuelve cero resultados.
 * Por eso `name` va con los dos tipos y los campos que se filtran estan todos.
 */
@searchIndex({
  name: "productSearch",
  definition: {
    mappings: {
      dynamic: false,
      fields: {
        name: [
          { type: "string", analyzer: "lucene.spanish" },
          { type: "autocomplete", analyzer: "lucene.spanish" },
        ],
        description: { type: "string", analyzer: "lucene.spanish" },
        category: { type: "objectId" },
        price: { type: "number" },
        isActive: { type: "boolean" },
      },
    },
  },
})
@modelOptions({
  ...baseModelOptions,
  schemaOptions: {
    ...baseModelOptions.schemaOptions,
    autoSearchIndex: true,
  },
})
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
