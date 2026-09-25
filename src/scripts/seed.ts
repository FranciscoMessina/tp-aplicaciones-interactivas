import "dotenv/config";
import { connectDatabase, disconnectDatabase } from "../db.ts";
import { env } from "../config/env.ts";
import { CategoryModel } from "../models/category.model.ts";
import { ProductModel } from "../models/product.model.ts";
import { UserModel, UserRole } from "../models/user.model.ts";
import { hashPassword } from "../services/auth.service.ts";
import { catalogSeed } from "./seed-catalog.ts";

const SEARCH_INDEX_NAME = "productSearch";
const DEFAULT_ADMIN_PASSWORD = "Admin123!";
const DEFAULT_CUSTOMER_PASSWORD = "Customer123!";

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

async function seedCatalog(): Promise<{
  categoryCount: number;
  productCount: number;
}> {
  const products = [];
  // Numero correlativo de cada producto, para generar imagenes, stock y
  // productos inactivos de forma variada pero siempre igual en cada corrida.
  let sequence = 0;

  for (const categorySeed of catalogSeed) {
    const category = await CategoryModel.create({ name: categorySeed.name });

    for (const productSeed of categorySeed.products) {
      sequence += 1;

      products.push({
        ...productSeed,
        category: category.id,
        images: [
          `https://picsum.photos/seed/product-${sequence}-main/800/600`,
          `https://picsum.photos/seed/product-${sequence}-detail/800/600`,
        ],
        availableQuantity: sequence % 9,
        // Uno de cada diez queda desactivado, para probar el filtro del admin.
        isActive: sequence % 10 !== 0,
      });
    }
  }

  await ProductModel.create(products);

  return { categoryCount: catalogSeed.length, productCount: products.length };
}

async function runSeed(): Promise<void> {
  await connectDatabase(env.mongoUri);

  try {
    await clearSeededCollections();
    await seedUsers();
    const { categoryCount, productCount } = await seedCatalog();
    await ensureProductSearchIndex();

    console.log(
      `Seed completed: 2 users, ${categoryCount} categories and ${productCount} products created`,
    );
  } finally {
    await disconnectDatabase();
  }
}

runSeed().catch((error: unknown) => {
  console.error("Seed failed:", error);
  process.exitCode = 1;
});
