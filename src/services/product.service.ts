import type { DocumentType } from "@typegoose/typegoose";
import { Product, ProductModel } from "../models/product.model.ts";
import { HttpError } from "../utils/http-error.ts";
import { CategoryModel } from "../models/category.model.ts";

export interface CreateProductInput {
  name: string;
  category: string;
  description: string;
  images: string[];
  price?: number;
}

export interface UpdateProductInput {
  name?: string;
  category?: string;
  description?: string;
  images?: string[];
  price?: number;
}

export async function listProducts(): Promise<DocumentType<Product>[]> {
  return ProductModel.find().populate("category");
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
    throw new HttpError(404, "Product not found");
  }

  return product;
}

export async function deleteProduct(productId: string): Promise<void> {
  const product = await ProductModel.findByIdAndDelete(productId);

  if (!product) {
    throw new HttpError(404, "Product not found");
  }
}

export async function setProductActive(
  productId: string,
  isActive: boolean,
): Promise<DocumentType<Product>> {
  const product = await ProductModel.findByIdAndUpdate(
    productId,
    { $set: { isActive } },
    { returnDocument: "after", runValidators: true },
  );

  if (!product) {
    throw new HttpError(404, "Product not found");
  }

  return product;
}

async function ensureCategoryExists(categoryId: string): Promise<void> {
  const category = await CategoryModel.findById(categoryId);

  if (!category) {
    throw new HttpError(400, "Category not found");
  }
}