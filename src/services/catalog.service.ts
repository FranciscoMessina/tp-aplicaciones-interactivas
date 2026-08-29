import type { DocumentType } from "@typegoose/typegoose";
import {
  ApplicationError,
  ApplicationErrorKind,
} from "../domain/application-error.ts";
import { Category, CategoryModel } from "../models/category.model.ts";
import { Product, ProductModel } from "../models/product.model.ts";

export interface CreateProductInput {
  name: string;
  category: string;
  description: string;
  images: string[];
  price?: number;
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
