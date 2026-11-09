import type { DocumentType } from "@typegoose/typegoose";
import type { Types } from "mongoose";
import {
  ApplicationError,
  ApplicationErrorKind,
} from "../domain/application-error.ts";
import { Collection, CollectionModel } from "../models/collection.model.ts";
import { ProductModel } from "../models/product.model.ts";
import { PromotionModel } from "../models/promotion.model.ts";
import { findPricedProducts, type PricedProduct } from "./catalog.service.ts";

// `null` borra la descripcion.
export interface CollectionInput {
  title?: string;
  description?: string | null;
  products?: string[];
  isActive?: boolean;
}

/** Una coleccion como la devuelve la API, con sus productos completos. */
export type CollectionWithProducts = Omit<Collection, "products"> & {
  products: PricedProduct[];
};

/**
 * Completa los productos con su categoria y la promocion de hoy, en el orden
 * de la coleccion. El publico solo ve los publicados.
 */
async function withProducts(
  collection: DocumentType<Collection>,
  includeInactive: boolean,
): Promise<CollectionWithProducts> {
  return {
    ...collection.toJSON(),
    products: await findPricedProducts(
      collection.products as Types.ObjectId[],
      includeInactive,
    ),
  };
}

/**
 * Con `includeInactive` devuelve todas (para el panel). Si no, solo las
 * encendidas que tienen algun producto publicado.
 */
export async function listCollections(
  includeInactive: boolean,
): Promise<CollectionWithProducts[]> {
  const collections = await CollectionModel.find(
    includeInactive ? {} : { isActive: true },
  ).sort({ createdAt: -1 });
  const result = await Promise.all(
    collections.map((collection) => withProducts(collection, includeInactive)),
  );

  return includeInactive
    ? result
    : result.filter((collection) => collection.products.length > 0);
}

export async function getCollection(
  collectionId: string,
  includeInactive: boolean,
): Promise<CollectionWithProducts> {
  const collection = await CollectionModel.findOne({
    _id: collectionId,
    ...(!includeInactive && { isActive: true }),
  });

  if (!collection) {
    throw new ApplicationError(
      ApplicationErrorKind.NotFound,
      "No se encontró la colección",
    );
  }

  return withProducts(collection, includeInactive);
}

export function createCollection(
  input: CollectionInput,
): Promise<CollectionWithProducts> {
  return saveCollection(new CollectionModel(), input);
}

export async function updateCollection(
  collectionId: string,
  updates: CollectionInput,
): Promise<CollectionWithProducts> {
  const collection = await CollectionModel.findById(collectionId);

  if (!collection) {
    throw new ApplicationError(
      ApplicationErrorKind.NotFound,
      "No se encontró la colección",
    );
  }

  return saveCollection(collection, updates);
}

// Como una categoria con productos: primero hay que desvincular la promocion.
export async function deleteCollection(collectionId: string): Promise<void> {
  const promotion = await PromotionModel.exists({
    linkedCollection: collectionId,
  });

  if (promotion) {
    throw new ApplicationError(
      ApplicationErrorKind.Conflict,
      "La colección está vinculada a una promoción: cambiá o eliminá la promoción primero",
    );
  }

  const collection = await CollectionModel.findByIdAndDelete(collectionId);

  if (!collection) {
    throw new ApplicationError(
      ApplicationErrorKind.NotFound,
      "No se encontró la colección",
    );
  }
}

async function saveCollection(
  collection: DocumentType<Collection>,
  changes: CollectionInput,
): Promise<CollectionWithProducts> {
  if (changes.products) {
    const found = await ProductModel.countDocuments({
      _id: { $in: changes.products },
    });

    if (found !== changes.products.length) {
      throw new ApplicationError(
        ApplicationErrorKind.InvalidInput,
        "Hay campos con errores",
        { products: ["Alguno de los productos ya no existe"] },
      );
    }
  }

  for (const [key, value] of Object.entries(changes)) {
    collection.set(key, value ?? undefined);
  }

  await collection.save();
  return withProducts(collection, true);
}
