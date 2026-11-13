import { addDays, argentinaDay } from "../domain/calendar.ts";
import { EnquiryStatus } from "../domain/enquiry.ts";
import { EnquiryModel } from "../models/enquiry.model.ts";
import { ProductViewModel } from "../models/product-view.model.ts";
import { ProductModel } from "../models/product.model.ts";

// Las metricas de visitas y consultas miran los ultimos 30 dias, hoy incluido.
const PERIOD_DAYS = 30;
const TOP_PRODUCTS = 5;

export interface DashboardStats {
  products: {
    total: number;
    active: number;
    outOfStock: number;
  };
  enquiries: Record<EnquiryStatus, number> & {
    total: number;
    lastPeriod: number;
  };
  views: {
    lastPeriod: number;
    // Los 30 dias anteriores, para comparar.
    previousPeriod: number;
    // Un elemento por dia, del mas viejo a hoy, con 0 los dias sin visitas.
    byDay: { day: string; count: number }[];
    topProducts: { id: string; name: string; image?: string; count: number }[];
  };
}

/** Metricas del panel de administracion, calculadas en la base de datos. */
export async function getDashboardStats(): Promise<DashboardStats> {
  const today = argentinaDay();
  const periodStart = addDays(today, -(PERIOD_DAYS - 1));
  const previousStart = addDays(periodStart, -PERIOD_DAYS);

  const [
    total,
    active,
    outOfStock,
    enquiryCounts,
    recentEnquiries,
    viewsByDay,
    topProducts,
  ] = await Promise.all([
    ProductModel.countDocuments(),
    ProductModel.countDocuments({ isActive: true }),
    ProductModel.countDocuments({ isActive: true, availableQuantity: 0 }),
    EnquiryModel.aggregate<{ _id: EnquiryStatus; count: number }>([
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]),
    EnquiryModel.countDocuments({
      createdAt: { $gte: new Date(Date.now() - PERIOD_DAYS * 86_400_000) },
    }),
    ProductViewModel.aggregate<{ _id: string; count: number }>([
      { $match: { day: { $gte: previousStart } } },
      { $group: { _id: "$day", count: { $sum: "$count" } } },
    ]),
    ProductViewModel.aggregate<DashboardStats["views"]["topProducts"][number]>([
      { $match: { day: { $gte: periodStart } } },
      { $group: { _id: "$product", count: { $sum: "$count" } } },
      { $sort: { count: -1, _id: 1 } },
      { $limit: TOP_PRODUCTS },
      {
        $lookup: {
          from: ProductModel.collection.name,
          localField: "_id",
          foreignField: "_id",
          as: "product",
        },
      },
      { $unwind: "$product" },
      {
        $project: {
          _id: 0,
          id: { $toString: "$_id" },
          name: "$product.name",
          image: { $first: "$product.images" },
          count: 1,
        },
      },
    ]),
  ]);

  const enquiries = {
    [EnquiryStatus.Pending]: 0,
    [EnquiryStatus.Read]: 0,
    [EnquiryStatus.Resolved]: 0,
    total: 0,
    lastPeriod: recentEnquiries,
  };

  for (const { _id, count } of enquiryCounts) {
    enquiries[_id] = count;
    enquiries.total += count;
  }

  const countByDay = new Map(viewsByDay.map(({ _id, count }) => [_id, count]));
  const byDay = Array.from({ length: PERIOD_DAYS }, (_, index) => {
    const day = addDays(periodStart, index);
    return { day, count: countByDay.get(day) ?? 0 };
  });
  const previousPeriod = viewsByDay
    .filter(({ _id }) => _id < periodStart)
    .reduce((sum, { count }) => sum + count, 0);

  return {
    products: { total, active, outOfStock },
    enquiries,
    views: {
      lastPeriod: byDay.reduce((sum, { count }) => sum + count, 0),
      previousPeriod,
      byDay,
      topProducts,
    },
  };
}
