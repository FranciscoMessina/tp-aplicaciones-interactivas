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
import { Types, type PipelineStage } from "mongoose";

export interface CreateProductInput {
  name: string;
  category: string;
  description: string;
  images: string[];
  price: number;
  availableQuantity?: number;
  isActive?: boolean;
}

export interface UpdateProductInput {
  name?: string;
  category?: string;
  description?: string;
  images?: string[];
  price?: number;
  availableQuantity?: number;
  isActive?: boolean;
}

export interface CategoryInput {
  name: string;
}

export interface ProductSearchFilters {
  search?: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  sortBy?: "publicationDate" | "price" | "relevance";
  sortOrder?: "asc" | "desc";
  includeInactive?: boolean;
  page: number;
  pageSize: number;
}

export interface ProductPage {
  items: DocumentType<Product>[];
  page: number;
  pageSize: number;
  total: number;
}

/**
 * Arma la consulta como un "pipeline de agregacion" de MongoDB: una lista de
 * etapas que se aplican en orden (filtrar, ordenar...), como una cadena.
 *
 * Hay dos caminos segun si el usuario escribio algo en el buscador:
 * - Con `search` se usa `$search` de Atlas Search, que busca por texto
 *   tolerando errores de tipeo y calcula que tan relevante es cada resultado.
 *   Tiene su propia sintaxis de filtros (`equals`, `range`) y tiene que ser la
 *   primera etapa del pipeline.
 * - Sin `search` alcanza con un `$match`, el filtro comun de MongoDB.
 *
 * En los dos casos despues se ordena, se corta la pagina pedida y se completa
 * la categoria de cada producto.
 */
export async function searchProducts(
  filters: ProductSearchFilters,
): Promise<ProductPage> {
  const pipeline: PipelineStage[] = [];

  if (filters.search) {
    const searchFilter: Record<string, unknown>[] = [];

    if (!filters.includeInactive) {
      searchFilter.push({ equals: { path: "isActive", value: true } });
    }

    if (filters.category) {
      searchFilter.push({
        equals: {
          path: "category",
          value: new Types.ObjectId(filters.category),
        },
      });
    }

    if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
      searchFilter.push({
        range: {
          path: "price",
          ...(filters.minPrice !== undefined && { gte: filters.minPrice }),
          ...(filters.maxPrice !== undefined && { lte: filters.maxPrice }),
        },
      });
    }

    pipeline.push({
      $search: {
        index: productSearchIndex.name,
        compound: {
          should: [
            {
              autocomplete: {
                query: filters.search,
                path: "name",
                fuzzy: { maxEdits: 1 },
                score: { boost: { value: 5 } },
              },
            },
            {
              text: {
                query: filters.search,
                path: "name",
                fuzzy: { maxEdits: 2 },
                score: { boost: { value: 3 } },
              },
            },
            {
              text: {
                query: filters.search,
                path: "description",
                fuzzy: { maxEdits: 2 },
              },
            },
          ],
          minimumShouldMatch: 1,
          ...(searchFilter.length > 0 && { filter: searchFilter }),
        },
      },
    });
  } else {
    const match: Record<string, unknown> = {};

    if (!filters.includeInactive) {
      match.isActive = true;
    }

    if (filters.category) {
      match.category = new Types.ObjectId(filters.category);
    }

    if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
      const price: Record<string, number> = {};

      if (filters.minPrice !== undefined) {
        price.$gte = filters.minPrice;
      }

      if (filters.maxPrice !== undefined) {
        price.$lte = filters.maxPrice;
      }

      match.price = price;
    }

    if (Object.keys(match).length > 0) {
      pipeline.push({ $match: match });
    }
  }

  const sortDirection = filters.sortOrder === "asc" ? 1 : -1;

  switch (filters.sortBy) {
    case "relevance":
      pipeline.push(
        { $set: { searchScore: { $meta: "searchScore" } } },
        { $sort: { searchScore: sortDirection, createdAt: -1 } },
        { $unset: "searchScore" },
      );
      break;
    case "price":
      pipeline.push({ $sort: { price: sortDirection, createdAt: -1 } });
      break;
    default:
      pipeline.push({ $sort: { createdAt: sortDirection } });
  }

  // `$facet` corre dos sub-pipelines sobre el mismo resultado: uno corta la
  // pagina y el otro cuenta el total, asi alcanza con una sola consulta.
  pipeline.push({
    $facet: {
      items: [
        { $skip: (filters.page - 1) * filters.pageSize },
        { $limit: filters.pageSize },
      ],
      total: [{ $count: "count" }],
    },
  });

  const [result] = await ProductModel.aggregate<{
    items: Product[];
    total: { count: number }[];
  }>(pipeline);

  // `aggregate` devuelve objetos planos. `hydrate` los convierte en documentos
  // de Mongoose, para que se serialicen igual que en el resto de la API (con
  // `id` en vez de `_id`) y para poder completar la categoria con `populate`.
  const products = (result?.items ?? []).map((product) =>
    ProductModel.hydrate(product),
  );

  return {
    items: await ProductModel.populate(products, { path: "category" }),
    page: filters.page,
    pageSize: filters.pageSize,
    total: result?.total[0]?.count ?? 0,
  };
}

/**
 * Un Product inactivo no existe para el publico: responde lo mismo que si el
 * id no existiera.
 */
export async function getProduct(
  productId: string,
  includeInactive: boolean,
): Promise<DocumentType<Product>> {
  const product = await ProductModel.findOne({
    _id: productId,
    ...(!includeInactive && { isActive: true }),
  }).populate("category");

  if (!product) {
    throw new ApplicationError(
      ApplicationErrorKind.NotFound,
      "No se encontró el producto",
    );
  }

  return product;
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

  const product = await ProductModel.findByIdAndUpdate(
    productId,
    { $set: updates },
    { returnDocument: "after", runValidators: true },
  );

  if (!product) {
    throw new ApplicationError(
      ApplicationErrorKind.NotFound,
      "No se encontró el producto",
    );
  }

  return product;
}

export async function deleteProduct(productId: string): Promise<void> {
  const product = await ProductModel.findByIdAndDelete(productId);

  if (!product) {
    throw new ApplicationError(
      ApplicationErrorKind.NotFound,
      "No se encontró el producto",
    );
  }
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
