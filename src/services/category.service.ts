import type { DocumentType } from "@typegoose/typegoose";
import { Category, CategoryModel } from "../models/category.model.ts";

export function listCategories(): Promise<DocumentType<Category>[]> {
  return CategoryModel.find();
}
