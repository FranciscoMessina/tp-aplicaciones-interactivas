import type { DocumentType } from "@typegoose/typegoose";
import { Category, CategoryModel } from "../models/category.model.ts";
import { ProductModel } from "../models/product.model.ts";
import { HttpError } from "../utils/http-error.ts";

export interface CreateCategoryInput {
  name: string;
}

export interface UpdateCategoryInput {
  name?: string;
}

export function listCategories(): Promise<DocumentType<Category>[]> {
  return CategoryModel.find();
}

export function createCategory(input: CreateCategoryInput,): Promise<DocumentType<Category>> {
  return CategoryModel.create(input);
}

export async function updateCategory(categoryId: string, updates: UpdateCategoryInput,): Promise<DocumentType<Category>> {
  const category = await CategoryModel.findByIdAndUpdate(
    categoryId,
    { $set: updates },
    { returnDocument: "after", runValidators: true },
  );

  if (!category) {
    throw new HttpError(404, "Category not found");
  }

  return category;
}

export async function deleteCategory(categoryId: string): Promise<void> {
  const associatedProduct = await ProductModel.findOne({
    category: categoryId,
  });

  if (associatedProduct) {
    throw new HttpError(409, "Category has associated products");
  }

  const category = await CategoryModel.findByIdAndDelete(categoryId);

  if (!category) {
    throw new HttpError(404, "Category not found");
  }
}