import type { DocumentType } from "@typegoose/typegoose";
import { Product, ProductModel } from "../models/product.model.ts";

export interface ProductFilters {
  search?: string;
  category?: string;
}

export async function listProducts(
  filters: ProductFilters = {},
): Promise<DocumentType<Product>[]> {
  let query = ProductModel.find({ isActive: true });

  if (filters.search) {
    query = query.or([
      {
        name: {
          $regex: escapeRegularExpression(filters.search),
          $options: "i",
        },
      },
      {
        description: {
          $regex: escapeRegularExpression(filters.search),
          $options: "i",
        },
      },
    ]);
  }

  if (filters.category) {
    query = query.where("category").equals(filters.category);
  }

  return await query.populate("category");
}

function escapeRegularExpression(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
