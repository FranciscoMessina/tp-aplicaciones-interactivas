import { EnquiryStatus } from "../domain/enquiry.ts";
import { CategoryModel } from "../models/category.model.ts";
import { EnquiryModel } from "../models/enquiry.model.ts";
import { ProductModel } from "../models/product.model.ts";

export interface DashboardStats {
  products: {
    total: number;
    active: number;
    outOfStock: number;
    featured: number;
  };
  enquiries: Record<EnquiryStatus, number> & { total: number };
  productsByCategory: { name: string; count: number }[];
}

/** Metricas del panel de administracion, calculadas en la base de datos. */
export async function getDashboardStats(): Promise<DashboardStats> {
  const [total, active, outOfStock, featured, enquiryCounts, byCategory] =
    await Promise.all([
      ProductModel.countDocuments(),
      ProductModel.countDocuments({ isActive: true }),
      ProductModel.countDocuments({ isActive: true, availableQuantity: 0 }),
      ProductModel.countDocuments({ isActive: true, isFeatured: true }),
      EnquiryModel.aggregate<{ _id: EnquiryStatus; count: number }>([
        { $group: { _id: "$status", count: { $sum: 1 } } },
      ]),
      // Parte de las categorias para incluir tambien las que no tienen productos.
      CategoryModel.aggregate<{ name: string; count: number }>([
        {
          $lookup: {
            from: ProductModel.collection.name,
            localField: "_id",
            foreignField: "category",
            as: "products",
          },
        },
        { $project: { _id: 0, name: 1, count: { $size: "$products" } } },
        { $sort: { count: -1, name: 1 } },
      ]),
    ]);

  const enquiries = {
    [EnquiryStatus.Pending]: 0,
    [EnquiryStatus.Read]: 0,
    [EnquiryStatus.Resolved]: 0,
    total: 0,
  };

  for (const { _id, count } of enquiryCounts) {
    enquiries[_id] = count;
    enquiries.total += count;
  }

  return {
    products: { total, active, outOfStock, featured },
    enquiries,
    productsByCategory: byCategory,
  };
}
