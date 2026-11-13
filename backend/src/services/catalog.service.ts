import type { DocumentType } from "@typegoose/typegoose";
import {
  ApplicationError,
  ApplicationErrorKind,
} from "../domain/application-error.ts";
import {
  Category,
  CategoryModel,
  categoryCollation,
} from "../models/category.model.ts";
import {
  Product,
  ProductModel,
  productSearchIndex,
} from "../models/product.model.ts";
import { CollectionModel } from "../models/collection.model.ts";
import { ProductViewModel } from "../models/product-view.model.ts";
import { argentinaDay } from "../domain/calendar.ts";
import {
  promotionPricingStages,
  type AppliedPromotion,
} from "./promotion.service.ts";
import { Types, type PipelineStage } from "mongoose";
import { isSearchNotEnabledError } from "../db.ts";

export interface CreateProductInput {
  name: string;
  category: string;
  description: string;
  images: string[];
  price: number;
  discountPercent?: number;
  availableQuantity?: number;
  isActive?: boolean;
  isFeatured?: boolean;
}

export interface UpdateProductInput {
  name?: string;
  category?: string;
  description?: string;
  images?: string[];
  price?: number;
  discountPercent?: number;
  availableQuantity?: number;
  isActive?: boolean;
  isFeatured?: boolean;
}

export interface CategoryInput {
  name: string;
}

export interface ProductSearchFilters {
  search?: string;
  // Ids de categorias: alcanza con que el producto sea de alguna.
  category?: string[];
  minPrice?: number;
  maxPrice?: number;
  sortBy?: "publicationDate" | "price" | "name" | "relevance";
  sortOrder?: "asc" | "desc";
  includeInactive?: boolean;
  isActive?: boolean;
  isFeatured?: boolean;
  inStock?: boolean;
  onSale?: boolean;
  page: number;
  pageSize: number;
}

export interface CategorySummary {
  id: string;
  name: string;
  productCount: number;
  minPrice: number;
  examples: string[];
}

/** Un producto como lo devuelve la API, con la promocion que se le aplica hoy. */
export type PricedProduct = Product & { promotion: AppliedPromotion | null };

type RawPricedProduct = Product & {
  _id: Types.ObjectId;
  promotion?: AppliedPromotion | null;
};

export interface ProductPage {
  items: PricedProduct[];
  page: number;
  pageSize: number;
  total: number;
  // Precio final mas bajo y mas alto con todos los filtros salvo el de precio,
  // para sugerir el rango. `null` si no hay productos.
  priceRange: { min: number; max: number } | null;
}

// Se apaga la primera vez que la base rechaza `$search` (un MongoDB que no es
// Atlas) y desde ahi se usa directamente la busqueda de respaldo.
let atlasSearchAvailable = true;

/**
 * Arma la consulta como un "pipeline de agregacion" de MongoDB: una lista de
 * etapas que se aplican en orden (filtrar, ordenar...), como una cadena.
 *
 * Hay dos formas de filtrar, segun si el usuario escribio algo en el buscador
 * y si la base es Atlas:
 * - Con `search` y Atlas se usa `$search` de Atlas Search, que busca por texto
 *   tolerando errores de tipeo y calcula que tan relevante es cada resultado.
 * - Sin `search`, o con un MongoDB comun, alcanza con un `$match`, el filtro
 *   normal de MongoDB. El texto se busca con expresiones regulares.
 *
 * En los dos casos despues se ordena, se corta la pagina pedida y se completa
 * la categoria de cada producto. El rango de precio se aplica recien al cortar
 * la pagina, porque el rango sugerido tiene que ignorarlo.
 */
export async function searchProducts(
  filters: ProductSearchFilters,
): Promise<ProductPage> {
  if (filters.search && atlasSearchAvailable) {
    try {
      return await runProductQuery(filters, atlasSearchStage(filters), {
        $meta: "searchScore",
      });
    } catch (error) {
      if (!isSearchNotEnabledError(error)) throw error;
      atlasSearchAvailable = false;
      console.warn(
        "Atlas Search no está disponible: la búsqueda de productos usa el respaldo con expresiones regulares",
      );
    }
  }

  const words = filters.search?.split(/\s+/).map(wordPattern) ?? [];
  // Sin Atlas, "relevante" es que todas las palabras esten en el nombre y no
  // solo en la descripcion.
  const nameMatches = words.map((word) => ({
    $regexMatch: { input: "$name", regex: word },
  }));

  return runProductQuery(filters, regexMatchStage(filters, words), {
    $cond: [{ $and: nameMatches }, 1, 0],
  });
}

// El publico solo ve los activos; un administrador puede pedir uno u otro.
function activeFilter(filters: ProductSearchFilters): boolean | undefined {
  return filters.includeInactive ? filters.isActive : true;
}

/**
 * `$search` tiene su propia sintaxis de filtros (`equals`, `range`) y tiene que
 * ser la primera etapa del pipeline.
 */
function atlasSearchStage(filters: ProductSearchFilters): PipelineStage {
  const search = filters.search ?? "";
  const isActive = activeFilter(filters);
  const searchFilter: Record<string, unknown>[] = [];

  if (isActive !== undefined) {
    searchFilter.push({ equals: { path: "isActive", value: isActive } });
  }

  if (filters.isFeatured !== undefined) {
    searchFilter.push({
      equals: { path: "isFeatured", value: filters.isFeatured },
    });
  }

  if (filters.inStock !== undefined) {
    searchFilter.push({
      range: {
        path: "availableQuantity",
        ...(filters.inStock ? { gt: 0 } : { lte: 0 }),
      },
    });
  }

  if (filters.category) {
    searchFilter.push({
      in: {
        path: "category",
        value: filters.category.map((id) => new Types.ObjectId(id)),
      },
    });
  }

  return {
    $search: {
      index: productSearchIndex.name,
      compound: {
        should: [
          {
            autocomplete: {
              query: search,
              path: "name",
              fuzzy: { maxEdits: 1 },
              score: { boost: { value: 5 } },
            },
          },
          {
            text: {
              query: search,
              path: "name",
              fuzzy: { maxEdits: 2 },
              score: { boost: { value: 3 } },
            },
          },
          {
            text: {
              query: search,
              path: "description",
              fuzzy: { maxEdits: 2 },
            },
          },
        ],
        minimumShouldMatch: 1,
        ...(searchFilter.length > 0 && { filter: searchFilter }),
      },
    },
  };
}

// Cada palabra buscada tiene que aparecer en el nombre o en la descripcion.
function regexMatchStage(
  filters: ProductSearchFilters,
  words: RegExp[],
): PipelineStage {
  const match: Record<string, unknown> = {};
  const isActive = activeFilter(filters);

  if (isActive !== undefined) {
    match.isActive = isActive;
  }

  if (filters.isFeatured !== undefined) {
    match.isFeatured = filters.isFeatured;
  }

  if (filters.inStock !== undefined) {
    match.availableQuantity = filters.inStock ? { $gt: 0 } : 0;
  }

  if (filters.category) {
    match.category = {
      $in: filters.category.map((id) => new Types.ObjectId(id)),
    };
  }

  if (words.length > 0) {
    match.$and = words.map((word) => ({
      $or: [{ name: word }, { description: word }],
    }));
  }

  return { $match: match };
}

// Cada letra acepta sus variantes con tilde, asi "telefono" encuentra
// "teléfono" y "nino" encuentra "niño".
const letterVariants: Record<string, string> = {
  a: "[aáàä]",
  e: "[eéèë]",
  i: "[iíìï]",
  o: "[oóòö]",
  u: "[uúùü]",
  n: "[nñ]",
};

function wordPattern(word: string): RegExp {
  const plain = word
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();
  const pattern = [...plain]
    .map(
      (letter) =>
        letterVariants[letter] ?? letter.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
    )
    .join("");

  return new RegExp(pattern, "i");
}

/**
 * Lo comun a los dos caminos: ordenar, cortar la pagina y completar la
 * categoria. `relevance` es el puntaje con el que se ordena por relevancia.
 */
async function runProductQuery(
  filters: ProductSearchFilters,
  filterStage: PipelineStage,
  relevance: Record<string, unknown>,
): Promise<ProductPage> {
  const pipeline: PipelineStage[] = [
    filterStage,
    ...(await promotionPricingStages()),
  ];

  // Va despues de aplicar las promociones: un producto sin descuento propio
  // tambien esta en oferta si una promocion le baja el precio.
  if (filters.onSale !== undefined) {
    pipeline.push({
      $match: filters.onSale
        ? {
            $or: [
              { discountPercent: { $gt: 0 } },
              { promotion: { $ne: null } },
            ],
          }
        : { discountPercent: 0, promotion: null },
    });
  }
  const sortDirection = filters.sortOrder === "asc" ? 1 : -1;

  // El filtro y el orden por precio usan el precio final, el que se paga.
  const finalPrice: Record<string, number> = {};

  if (filters.minPrice !== undefined) {
    finalPrice.$gte = filters.minPrice;
  }

  if (filters.maxPrice !== undefined) {
    finalPrice.$lte = filters.maxPrice;
  }

  const priceMatch: PipelineStage.FacetPipelineStage[] =
    Object.keys(finalPrice).length > 0 ? [{ $match: { finalPrice } }] : [];

  switch (filters.sortBy) {
    case "relevance":
      pipeline.push(
        { $set: { searchScore: relevance } },
        { $sort: { searchScore: sortDirection, createdAt: -1 } },
        { $unset: "searchScore" },
      );
      break;
    case "price":
      pipeline.push({ $sort: { finalPrice: sortDirection, createdAt: -1 } });
      break;
    case "name":
      pipeline.push({ $sort: { name: sortDirection, createdAt: -1 } });
      break;
    default:
      pipeline.push({ $sort: { createdAt: sortDirection } });
  }

  // `$facet` corre varios sub-pipelines sobre el mismo resultado: uno corta la
  // pagina, otro cuenta el total y otro calcula el rango de precios, asi
  // alcanza con una sola consulta.
  pipeline.push({
    $facet: {
      items: [
        ...priceMatch,
        { $skip: (filters.page - 1) * filters.pageSize },
        { $limit: filters.pageSize },
      ],
      total: [...priceMatch, { $count: "count" }],
      priceRange: [
        {
          $group: {
            _id: null,
            min: { $min: "$finalPrice" },
            max: { $max: "$finalPrice" },
          },
        },
      ],
    },
  });

  const aggregate = ProductModel.aggregate<{
    items: RawPricedProduct[];
    total: { count: number }[];
    priceRange: { min: number; max: number }[];
  }>(pipeline);

  // Para ordenar por nombre en español ("Ñ" despues de "N", sin separar
  // mayusculas). `$search` no acepta collation, asi que con Atlas Search el
  // orden por nombre es el binario.
  if (filters.sortBy === "name" && !("$search" in filterStage)) {
    aggregate.collation(categoryCollation);
  }

  const [result] = await aggregate;

  return {
    items: await toPricedProducts(result?.items ?? []),
    page: filters.page,
    pageSize: filters.pageSize,
    total: result?.total[0]?.count ?? 0,
    priceRange: result?.priceRange[0]
      ? { min: result.priceRange[0].min, max: result.priceRange[0].max }
      : null,
  };
}

/**
 * Un Product inactivo no existe para el publico: responde lo mismo que si el
 * id no existiera.
 */
export async function getProduct(
  productId: string,
  includeInactive: boolean,
): Promise<PricedProduct> {
  const [product] = await findPricedProducts([productId], includeInactive);

  if (!product) {
    throw new ApplicationError(
      ApplicationErrorKind.NotFound,
      "No se encontró el producto",
    );
  }

  return product;
}

/**
 * Los productos pedidos con la promocion de hoy aplicada, en el mismo orden
 * que los ids. Los que no existen (o estan ocultos, para el publico) faltan.
 */
export async function findPricedProducts(
  ids: (string | Types.ObjectId)[],
  includeInactive: boolean,
): Promise<PricedProduct[]> {
  const raw = await ProductModel.aggregate<RawPricedProduct>([
    {
      $match: {
        _id: { $in: ids.map((id) => new Types.ObjectId(id)) },
        ...(!includeInactive && { isActive: true }),
      },
    },
    ...(await promotionPricingStages()),
  ]);
  const position = new Map(ids.map((id, index) => [String(id), index]));
  raw.sort(
    (a, b) =>
      (position.get(String(a._id)) ?? 0) - (position.get(String(b._id)) ?? 0),
  );

  return toPricedProducts(raw);
}

/**
 * `aggregate` devuelve objetos planos. `hydrate` los convierte en documentos
 * de Mongoose, para que se serialicen igual que en el resto de la API (con
 * `id` en vez de `_id`) y para poder completar la categoria con `populate`.
 * `promotion` no es un campo del modelo: se agrega a la respuesta.
 */
async function toPricedProducts(
  raw: RawPricedProduct[],
): Promise<PricedProduct[]> {
  const products = raw.map((product) => ProductModel.hydrate(product));
  await ProductModel.populate(products, { path: "category" });

  return products.map((product, index) => ({
    ...product.toJSON(),
    promotion: raw[index]?.promotion ?? null,
  }));
}

export async function createProduct(
  input: CreateProductInput,
): Promise<DocumentType<Product>> {
  await ensureCategoryExists(input.category);
  return ProductModel.create(input);
}

export async function updateProduct(
  productId: string,
  updates: UpdateProductInput,
): Promise<DocumentType<Product>> {
  if (updates.category !== undefined) {
    await ensureCategoryExists(updates.category);
  }

  const product = await ProductModel.findById(productId);

  if (!product) {
    throw new ApplicationError(
      ApplicationErrorKind.NotFound,
      "No se encontró el producto",
    );
  }

  // Con `save` corre el hook del modelo que recalcula el precio final.
  product.set(updates);
  return product.save();
}

export async function deleteProduct(productId: string): Promise<void> {
  const product = await ProductModel.findByIdAndDelete(productId);

  if (!product) {
    throw new ApplicationError(
      ApplicationErrorKind.NotFound,
      "No se encontró el producto",
    );
  }

  // Sus visitas ya no se pueden mostrar y las colecciones no lo pueden listar.
  await Promise.all([
    ProductViewModel.deleteMany({ product: productId }),
    CollectionModel.updateMany({}, { $pull: { products: productId } }),
  ]);
}

/**
 * Suma una visita a la ficha de un producto publicado, en el contador del dia.
 * `upsert` crea el contador con la primera visita del dia.
 */
export async function recordProductView(productId: string): Promise<void> {
  const product = await ProductModel.exists({ _id: productId, isActive: true });

  if (!product) {
    throw new ApplicationError(
      ApplicationErrorKind.NotFound,
      "No se encontró el producto",
    );
  }

  await ProductViewModel.updateOne(
    { product: productId, day: argentinaDay() },
    { $inc: { count: 1 } },
    { upsert: true },
  );
}

/**
 * Las categorias con productos publicados, cuantos tiene cada una, el precio
 * mas bajo y algunos nombres de ejemplo. Las mas grandes primero.
 */
export async function listCategorySummaries(): Promise<CategorySummary[]> {
  return ProductModel.aggregate<CategorySummary>([
    { $match: { isActive: true } },
    // El "desde" tiene que ser el precio de hoy, con las promociones.
    ...(await promotionPricingStages()),
    { $sort: { createdAt: -1 } },
    {
      $group: {
        _id: "$category",
        productCount: { $sum: 1 },
        minPrice: { $min: "$finalPrice" },
        examples: { $push: "$name" },
      },
    },
    {
      $lookup: {
        from: CategoryModel.collection.name,
        localField: "_id",
        foreignField: "_id",
        as: "category",
      },
    },
    { $unwind: "$category" },
    {
      $project: {
        _id: 0,
        id: { $toString: "$_id" },
        name: "$category.name",
        productCount: 1,
        minPrice: 1,
        examples: { $slice: ["$examples", 5] },
      },
    },
    { $sort: { productCount: -1, name: 1 } },
  ]).collation(categoryCollation);
}

export function listCategories(): Promise<DocumentType<Category>[]> {
  return CategoryModel.find().sort({ name: 1 }).collation(categoryCollation);
}

export function createCategory(
  input: CategoryInput,
): Promise<DocumentType<Category>> {
  return CategoryModel.create(input);
}

export async function updateCategory(
  categoryId: string,
  updates: CategoryInput,
): Promise<DocumentType<Category>> {
  const category = await CategoryModel.findByIdAndUpdate(
    categoryId,
    { $set: updates },
    { returnDocument: "after", runValidators: true },
  );

  if (!category) {
    throw new ApplicationError(
      ApplicationErrorKind.NotFound,
      "No se encontró la categoría",
    );
  }

  return category;
}

export async function deleteCategory(categoryId: string): Promise<void> {
  const associatedProduct = await ProductModel.exists({ category: categoryId });

  if (associatedProduct) {
    throw new ApplicationError(
      ApplicationErrorKind.Conflict,
      "La categoría tiene productos asociados",
    );
  }

  const category = await CategoryModel.findByIdAndDelete(categoryId);

  if (!category) {
    throw new ApplicationError(
      ApplicationErrorKind.NotFound,
      "No se encontró la categoría",
    );
  }
}

async function ensureCategoryExists(categoryId: string): Promise<void> {
  const category = await CategoryModel.exists({ _id: categoryId });

  if (!category) {
    throw new ApplicationError(
      ApplicationErrorKind.InvalidInput,
      "No se encontró la categoría",
    );
  }
}
