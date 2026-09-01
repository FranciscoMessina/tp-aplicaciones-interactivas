import "dotenv/config";
import { connectDatabase, disconnectDatabase } from "../db.ts";
import { env } from "../config/env.ts";
import { CategoryModel } from "../models/category.model.ts";
import { ProductModel } from "../models/product.model.ts";
import { UserModel, UserRole } from "../models/user.model.ts";
import { hashPassword } from "../services/auth.service.ts";

const SEARCH_INDEX_NAME = "productSearch";
const DEFAULT_ADMIN_PASSWORD = "Admin123!";
const DEFAULT_CUSTOMER_PASSWORD = "Customer123!";

const categorySeeds = [
  "Tecnologia",
  "Hogar",
  "Indumentaria",
  "Deportes",
  "Accesorios",
] as const;

const productNamesByCategory = [
  [
    "Auriculares Bluetooth",
    "Teclado mecanico",
    "Mouse inalambrico",
    "Cargador USB-C",
    "Parlante portatil",
    "Webcam Full HD",
    "Soporte para notebook",
    "Lampara LED inteligente",
  ],
  [
    "Juego de sabanas",
    "Organizador de escritorio",
    "Set de vasos",
    "Almohadon decorativo",
    "Tabla de cocina",
    "Termo de acero",
    "Maceta de ceramica",
    "Difusor de aromas",
  ],
  [
    "Remera clasica",
    "Buzo con capucha",
    "Pantalon jogger",
    "Campera liviana",
    "Gorra urbana",
    "Medias deportivas",
    "Camisa de lino",
    "Short de algodon",
  ],
  [
    "Pelota de futbol",
    "Botella deportiva",
    "Colchoneta de yoga",
    "Banda elastica",
    "Mancuernas ajustables",
    "Soga para saltar",
    "Bolso deportivo",
    "Guantes de entrenamiento",
  ],
  [
    "Mochila urbana",
    "Billetera compacta",
    "Reloj analogico",
    "Anteojos de sol",
    "Cinturon de cuero",
    "Bolso bandolera",
    "Llavero metalico",
    "Paraguas plegable",
  ],
] as const;

async function ensureProductSearchIndex(): Promise<void> {
  const indexes = await ProductModel.listSearchIndexes();

  if (indexes.some(({ name }) => name === SEARCH_INDEX_NAME)) {
    console.log(`Search index "${SEARCH_INDEX_NAME}" already exists`);
    return;
  }

  await ProductModel.createSearchIndexes();
  console.log(`Search index "${SEARCH_INDEX_NAME}" created`);
}

async function clearSeededCollections(): Promise<void> {
  // Products must be removed before their referenced categories.
  await ProductModel.deleteMany({});
  await CategoryModel.deleteMany({});
  await UserModel.deleteMany({});
}

async function seedUsers(): Promise<void> {
  const adminPassword =
    process.env.SEED_ADMIN_PASSWORD ?? DEFAULT_ADMIN_PASSWORD;
  const customerPassword =
    process.env.SEED_CUSTOMER_PASSWORD ?? DEFAULT_CUSTOMER_PASSWORD;

  const [adminPasswordHash, customerPasswordHash] = await Promise.all([
    hashPassword(adminPassword),
    hashPassword(customerPassword),
  ]);

  await UserModel.create([
    {
      fullName: "Administrador Demo",
      email: "admin@example.com",
      phone: "+54 11 5555 0101",
      passwordHash: adminPasswordHash,
      role: UserRole.Admin,
    },
    {
      fullName: "Cliente Demo",
      email: "cliente@example.com",
      phone: "+54 11 5555 0102",
      passwordHash: customerPasswordHash,
      role: UserRole.Customer,
    },
  ]);
}

async function seedCatalog(): Promise<void> {
  const categories = await CategoryModel.create(
    categorySeeds.map((name) => ({ name })),
  );

  const products = categories.flatMap((category, categoryIndex) => {
    const productNames = productNamesByCategory[categoryIndex];

    if (!productNames) {
      throw new Error(`Missing products for category ${category.name}`);
    }

    return productNames.map((name, productIndex) => {
      const sequence = categoryIndex * productNames.length + productIndex + 1;

      return {
        name,
        category: category.id,
        description: `${name}, producto de demostracion de la categoria ${category.name}.`,
        images: [
          `https://picsum.photos/seed/product-${sequence}-main/800/600`,
          `https://picsum.photos/seed/product-${sequence}-detail/800/600`,
        ],
        price: 10_000 + sequence * 1_250,
        availableQuantity: sequence % 9,
        isActive: sequence % 10 !== 0,
      };
    });
  });

  await ProductModel.create(products);
}

async function runSeed(): Promise<void> {
  await connectDatabase(env.mongoUri);

  try {
    await clearSeededCollections();
    await seedUsers();
    await seedCatalog();
    await ensureProductSearchIndex();

    console.log(
      "Seed completed: 2 users, 5 categories and 40 products created",
    );
  } finally {
    await disconnectDatabase();
  }
}

runSeed().catch((error: unknown) => {
  console.error("Seed failed:", error);
  process.exitCode = 1;
});
