import type { DocumentType } from "@typegoose/typegoose";
import {
  ApplicationError,
  ApplicationErrorKind,
} from "../domain/application-error.ts";
import { CategoryModel } from "../models/category.model.ts";
import { Promotion, PromotionModel } from "../models/promotion.model.ts";

// `null` borra el campo opcional.
export interface PromotionInput {
  title?: string;
  description?: string;
  image?: string | null;
  category?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  isActive?: boolean;
}

// "en-CA" escribe la fecha como AAAA-MM-DD, el mismo formato que se guarda.
const argentinaDate = new Intl.DateTimeFormat("en-CA", {
  timeZone: "America/Argentina/Buenos_Aires",
});

/**
 * Con `includeInactive` devuelve todas (para el panel). Si no, solo las que el
 * publico ve hoy: activas y dentro de sus fechas, si tienen.
 */
export function listPromotions(
  includeInactive: boolean,
): Promise<DocumentType<Promotion>[]> {
  const today = argentinaDate.format(new Date());
  const filter = includeInactive
    ? {}
    : {
        isActive: true,
        $and: [
          { $or: [{ startDate: null }, { startDate: { $lte: today } }] },
          { $or: [{ endDate: null }, { endDate: { $gte: today } }] },
        ],
      };

  return PromotionModel.find(filter)
    .sort({ createdAt: -1 })
    .populate("category");
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

  for (const [key, value] of Object.entries(changes)) {
    promotion.set(key, value ?? undefined);
  }

  // Un PATCH puede traer una sola de las fechas: se comparan ya combinadas.
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

  await promotion.save();
  return promotion.populate("category");
}
