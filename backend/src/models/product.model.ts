import {
  getModelForClass,
  modelOptions,
  pre,
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
 *
 * Atlas no toma los cambios de esta definicion solo: `npm run seed` la vuelve
 * a aplicar con `updateSearchIndex`.
 */
export const productSearchIndex = {
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
        finalPrice: { type: "number" },
        discountPercent: { type: "number" },
        isActive: { type: "boolean" },
        isFeatured: { type: "boolean" },
        availableQuantity: { type: "number" },
      },
    },
  },
};

/** Precio con el descuento aplicado, redondeado a pesos enteros. */
export function priceWithDiscount(price: number, discountPercent: number) {
  return Math.round((price * (100 - discountPercent)) / 100);
}

// El precio final se guarda para poder filtrar y ordenar por lo que se paga.
// Se recalcula antes de cada validacion, asi que vale para `create` y `save`;
// por eso los cambios de un producto se guardan con `save` y no con un update.
@pre<Product>("validate", function () {
  this.finalPrice = priceWithDiscount(this.price, this.discountPercent);
})
@searchIndex(productSearchIndex)
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

  // Precio de lista, sin descuento.
  @prop({ min: 0, required: true })
  public price!: number;

  // 0 = sin descuento.
  @prop({ min: 0, max: 90, required: true, default: 0 })
  public discountPercent!: number;

  @prop({ min: 0 })
  public finalPrice!: number;

  @prop({ min: 0, required: true, default: 0 })
  public availableQuantity!: number;

  @prop({ required: true, default: true })
  public isActive!: boolean;

  // Los destacados se muestran primero en la pagina de inicio.
  @prop({ required: true, default: false })
  public isFeatured!: boolean;
}

export const ProductModel = getModelForClass(Product);
