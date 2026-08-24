import type { DocumentType } from "@typegoose/typegoose";
import { Product, ProductModel } from "../models/product.model.ts";

export interface CreateProductInput {
  name: string;
  description: string;
  stock: number;
}

export function listProducts(): Promise<DocumentType<Product>[]> {
  return ProductModel.find();
}

export function createProduct(
  input: CreateProductInput,
): Promise<DocumentType<Product>> {
  return ProductModel.create(input);
}
