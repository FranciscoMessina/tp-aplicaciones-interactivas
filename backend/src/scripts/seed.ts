import "dotenv/config";
import { connectDatabase, disconnectDatabase } from "../db.ts";
import { env } from "../config/env.ts";
import { EnquiryStatus } from "../domain/enquiry.ts";
import { BusinessInfoModel } from "../models/business-info.model.ts";
import { CategoryModel } from "../models/category.model.ts";
import { EnquiryModel } from "../models/enquiry.model.ts";
import { ProductModel, productSearchIndex } from "../models/product.model.ts";
import { UserModel, UserRole } from "../models/user.model.ts";
import { hashPassword } from "../services/auth.service.ts";
import { catalogSeed } from "./seed-catalog.ts";

const DEFAULT_ADMIN_PASSWORD = "Admin123!";
const DEFAULT_CUSTOMER_PASSWORD = "Customer123!";

// Atlas no actualiza el indice cuando cambia su definicion en el modelo, asi
// que si ya existe se le vuelve a mandar. Atlas tarda un rato en reconstruirlo.
async function syncProductSearchIndex(): Promise<void> {
  const { name, definition } = productSearchIndex;
  const indexes = await ProductModel.listSearchIndexes();

  if (indexes.some((index) => index.name === name)) {
    await ProductModel.updateSearchIndex(name, definition);
    console.log(`Search index "${name}" updated`);
    return;
  }

  await ProductModel.createSearchIndexes();
  console.log(`Search index "${name}" created`);
}

async function clearSeededCollections(): Promise<void> {
  // Products must be removed before their referenced categories.
  await ProductModel.deleteMany({});
  await CategoryModel.deleteMany({});
  await UserModel.deleteMany({});
  await EnquiryModel.deleteMany({});
  await BusinessInfoModel.deleteMany({});
  // Recrea los indices que cambiaron de opciones en el modelo, por ejemplo la
  // collation del nombre unico de las categorias.
  await CategoryModel.syncIndexes();
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

async function seedBusinessInfo(): Promise<void> {
  await BusinessInfoModel.create({
    name: "ShopKernel",
    description:
      "Tienda de tecnología con consolas, computadoras, celulares, videojuegos y accesorios. Asesoramiento personalizado y garantía oficial en todos los productos.",
    address: "Av. Corrientes 1234, CABA, Buenos Aires",
    phone: "+54 11 5555 0100",
    socialNetworks: [
      "https://www.instagram.com/shopkernel",
      "https://www.facebook.com/shopkernel",
      "https://wa.me/5491155550100",
    ],
    openingHours: ["Lunes a viernes de 10 a 20 hs", "Sábados de 10 a 14 hs"],
  });
}

async function seedEnquiries(): Promise<number> {
  const enquiries = await EnquiryModel.create([
    {
      name: "Lucía Fernández",
      email: "lucia.fernandez@example.com",
      phone: "+54 11 4444 1001",
      subject: "Stock de PlayStation 5",
      message: "Hola, ¿tienen stock de la PlayStation 5 Slim? ¿Hacen envíos?",
      status: EnquiryStatus.Pending,
    },
    {
      name: "Martín Gómez",
      email: "martin.gomez@example.com",
      subject: "Medios de pago",
      message: "¿Aceptan pago en cuotas sin interés con tarjeta de crédito?",
      status: EnquiryStatus.Pending,
    },
    {
      name: "Carla Ruiz",
      email: "carla.ruiz@example.com",
      subject: "Garantía de notebooks",
      message: "¿Cuánto tiempo de garantía tienen las notebooks?",
      status: EnquiryStatus.Read,
    },
    {
      name: "Diego Sosa",
      email: "diego.sosa@example.com",
      phone: "+54 11 4444 1004",
      subject: "Retiro en el local",
      message: "Compré un joystick, ¿puedo retirarlo el sábado a la mañana?",
      status: EnquiryStatus.Resolved,
    },
  ]);

  return enquiries.length;
}

async function runSeed(): Promise<void> {
  await connectDatabase(env.mongoUri);

  try {
    await clearSeededCollections();
    await seedUsers();
    const { categoryCount, productCount } = await seedCatalog();
    await seedBusinessInfo();
    const enquiryCount = await seedEnquiries();
    await syncProductSearchIndex();

    console.log(
      `Seed completed: 2 users, ${categoryCount} categories, ${productCount} products, ${enquiryCount} enquiries and the business info created`,
    );
  } finally {
    await disconnectDatabase();
  }
}

runSeed().catch((error: unknown) => {
  console.error("Seed failed:", error);
  process.exitCode = 1;
});
