import type { DocumentType } from "@typegoose/typegoose";
import type { PipelineStage, Types } from "mongoose";
import {
  ApplicationError,
  ApplicationErrorKind,
} from "../domain/application-error.ts";
import { argentinaDay } from "../domain/calendar.ts";
import { CategoryModel } from "../models/category.model.ts";
import { Collection, CollectionModel } from "../models/collection.model.ts";
import { Promotion, PromotionModel } from "../models/promotion.model.ts";

// `null` borra el campo opcional.
export interface PromotionInput {
  title?: string;
  description?: string;
  image?: string | null;
  category?: string | null;
  linkedCollection?: string | null;
  discountPercent?: number | null;
  startDate?: string | null;
  endDate?: string | null;
  isActive?: boolean;
}

// De la coleccion alcanza con lo que muestra el aviso.
const populateTargets = [
  { path: "category" },
  { path: "linkedCollection", select: "title isActive" },
];

/**
 * Con `includeInactive` devuelve todas (para el panel). Si no, solo las que el
 * publico ve hoy: activas, dentro de sus fechas si tienen, y con su coleccion
 * encendida si llevan a una.
 */
export async function listPromotions(
  includeInactive: boolean,
): Promise<DocumentType<Promotion>[]> {
  const today = argentinaDay();
  const filter = includeInactive
    ? {}
    : {
        isActive: true,
        $and: [
          { $or: [{ startDate: null }, { startDate: { $lte: today } }] },
          { $or: [{ endDate: null }, { endDate: { $gte: today } }] },
        ],
      };

  const promotions = await PromotionModel.find(filter)
    .sort({ createdAt: -1 })
    .populate(populateTargets);

  return includeInactive
    ? promotions
    : promotions.filter(
        (promotion) =>
          !promotion.linkedCollection ||
          (promotion.linkedCollection as Collection).isActive,
      );
}

export interface AppliedPromotion {
  id: string;
  title: string;
  discountPercent: number;
  collection: string;
}

/**
 * Etapas de agregacion que aplican a cada producto el descuento de las
 * promociones vigentes que lo alcanzan por su coleccion. Si hay varias, la de
 * mayor descuento; y solo si mejora el descuento propio del producto, porque
 * los descuentos no se suman. Agregan `promotion` (la promocion aplicada o
 * `null`) y recalculan `finalPrice`, asi los filtros y el orden por precio usan
 * lo que se paga hoy. Se calcula al consultar porque depende de la fecha.
 */
export async function promotionPricingStages(): Promise<PipelineStage[]> {
  const promotions = (await listPromotions(false))
    .filter(
      (promotion) => promotion.linkedCollection && promotion.discountPercent,
    )
    .sort((a, b) => (b.discountPercent ?? 0) - (a.discountPercent ?? 0));

  if (promotions.length === 0) {
    return [{ $set: { promotion: null } }];
  }

  const collections = await CollectionModel.find(
    {
      _id: {
        $in: promotions.map(
          (promotion) =>
            (promotion.linkedCollection as DocumentType<Collection>)._id,
        ),
      },
    },
    { products: 1 },
  );
  const productsByCollection = new Map(
    collections.map((collection) => [
      collection.id,
      collection.products as Types.ObjectId[],
    ]),
  );

  // `$switch` se queda con la primera que coincide: estan de mayor a menor.
  const branches = promotions.map((promotion) => {
    const collectionId = (
      promotion.linkedCollection as DocumentType<Collection>
    ).id;
    const applied: AppliedPromotion = {
      id: promotion.id,
      title: promotion.title,
      discountPercent: promotion.discountPercent ?? 0,
      collection: collectionId,
    };

    return {
      case: { $in: ["$_id", productsByCollection.get(collectionId) ?? []] },
      then: { $literal: applied },
    };
  });

  return [
    { $set: { promotion: { $switch: { branches, default: null } } } },
    {
      $set: {
        promotion: {
          $cond: [
            { $gt: ["$promotion.discountPercent", "$discountPercent"] },
            "$promotion",
            null,
          ],
        },
      },
    },
    {
      $set: {
        // Mismo redondeo que `priceWithDiscount`: a pesos enteros, .5 para arriba.
        finalPrice: {
          $cond: [
            "$promotion",
            {
              $floor: {
                $add: [
                  {
                    $divide: [
                      {
                        $multiply: [
                          "$price",
                          { $subtract: [100, "$promotion.discountPercent"] },
                        ],
                      },
                      100,
                    ],
                  },
                  0.5,
                ],
              },
            },
            "$finalPrice",
          ],
        },
      },
    },
  ];
}

export async function createPromotion(
  input: PromotionInput,
): Promise<DocumentType<Promotion>> {
  const promotion = new PromotionModel();
  return savePromotion(promotion, input);
}

export async function updatePromotion(
  promotionId: string,
  updates: PromotionInput,
): Promise<DocumentType<Promotion>> {
  const promotion = await PromotionModel.findById(promotionId);

  if (!promotion) {
    throw new ApplicationError(
      ApplicationErrorKind.NotFound,
      "No se encontró la promoción",
    );
  }

  return savePromotion(promotion, updates);
}

export async function deletePromotion(promotionId: string): Promise<void> {
  const promotion = await PromotionModel.findByIdAndDelete(promotionId);

  if (!promotion) {
    throw new ApplicationError(
      ApplicationErrorKind.NotFound,
      "No se encontró la promoción",
    );
  }
}

async function savePromotion(
  promotion: DocumentType<Promotion>,
  changes: PromotionInput,
): Promise<DocumentType<Promotion>> {
  if (changes.category) {
    const category = await CategoryModel.exists({ _id: changes.category });

    if (!category) {
      throw new ApplicationError(
        ApplicationErrorKind.InvalidInput,
        "No se encontró la categoría",
      );
    }
  }

  if (changes.linkedCollection) {
    const collection = await CollectionModel.exists({
      _id: changes.linkedCollection,
    });

    if (!collection) {
      throw new ApplicationError(
        ApplicationErrorKind.InvalidInput,
        "No se encontró la colección",
      );
    }
  }

  for (const [key, value] of Object.entries(changes)) {
    promotion.set(key, value ?? undefined);
  }

  // Un PATCH puede traer solo algunos campos: se validan ya combinados.
  if (
    promotion.startDate &&
    promotion.endDate &&
    promotion.startDate > promotion.endDate
  ) {
    throw new ApplicationError(
      ApplicationErrorKind.InvalidInput,
      "Hay campos con errores",
      { endDate: ["Debe ser igual o posterior a la fecha de inicio"] },
    );
  }

  if (promotion.category && promotion.linkedCollection) {
    throw new ApplicationError(
      ApplicationErrorKind.InvalidInput,
      "Hay campos con errores",
      { linkedCollection: ["Elegí una categoría o una colección, no las dos"] },
    );
  }

  if (promotion.discountPercent && !promotion.linkedCollection) {
    throw new ApplicationError(
      ApplicationErrorKind.InvalidInput,
      "Hay campos con errores",
      {
        discountPercent: [
          "El descuento se aplica a una colección: elegí una para la promoción",
        ],
      },
    );
  }

  await promotion.save();
  return promotion.populate(populateTargets);
}
