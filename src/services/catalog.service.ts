import type { DocumentType } from "@typegoose/typegoose";
import {
  ApplicationError,
  ApplicationErrorKind,
} from "../domain/application-error.ts";
import { Category, CategoryModel } from "../models/category.model.ts";
import { Product, ProductModel } from "../models/product.model.ts";
import { Types, type PipelineStage } from "mongoose";

export interface CreateProductInput {
  name: string;
  category: string;
  description: string;
  images: string[];
  price: number;
  isActive?: boolean;
}

export interface UpdateProductInput {
  name?: string;
  category?: string;
  description?: string;
  images?: string[];
  price?: number;
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
 * En los dos casos despues se ordena y se completa la categoria de cada producto.
 */
export async function searchProducts(
  filters: ProductSearchFilters = {},
): Promise<DocumentType<Product>[]> {
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
        index: "productSearch",
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

  // `aggregate` devuelve objetos planos. `hydrate` los convierte en documentos
  // de Mongoose, para que se serialicen igual que en el resto de la API (con
  // `id` en vez de `_id`) y para poder completar la categoria con `populate`.
  const products = await ProductModel.aggregate(pipeline);
  const hydratedProducts = products.map((product) =>
    ProductModel.hydrate(product),
  );

  return ProductModel.populate(hydratedProducts, { path: "category" });
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
      "Product not found",
    );
  }

  return product;
}

export async function deleteProduct(productId: string): Promise<void> {
  const product = await ProductModel.findByIdAndDelete(productId);

  if (!product) {
    throw new ApplicationError(
      ApplicationErrorKind.NotFound,
      "Product not found",
    );
  }
}

export function listCategories(): Promise<DocumentType<Category>[]> {
  return CategoryModel.find();
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
      "Category not found",
    );
  }

  return category;
}

export async function deleteCategory(categoryId: string): Promise<void> {
  const associatedProduct = await ProductModel.exists({ category: categoryId });

  if (associatedProduct) {
    throw new ApplicationError(
      ApplicationErrorKind.Conflict,
      "Category has associated products",
    );
  }

  const category = await CategoryModel.findByIdAndDelete(categoryId);

  if (!category) {
    throw new ApplicationError(
      ApplicationErrorKind.NotFound,
      "Category not found",
    );
  }
}

async function ensureCategoryExists(categoryId: string): Promise<void> {
  const category = await CategoryModel.exists({ _id: categoryId });

  if (!category) {
    throw new ApplicationError(
      ApplicationErrorKind.InvalidInput,
      "Category not found",
    );
  }
}
