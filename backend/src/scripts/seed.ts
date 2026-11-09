import "dotenv/config";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { resolve, extname } from "node:path";
import { connectDatabase, disconnectDatabase } from "../db.ts";
import { env } from "../config/env.ts";
import { EnquiryStatus } from "../domain/enquiry.ts";
import { BusinessInfoModel } from "../models/business-info.model.ts";
import { CategoryModel } from "../models/category.model.ts";
import { EnquiryModel } from "../models/enquiry.model.ts";
import { ProductModel, productSearchIndex } from "../models/product.model.ts";
import { PromotionModel } from "../models/promotion.model.ts";
import { UserModel, UserRole } from "../models/user.model.ts";
import { hashPassword } from "../services/auth.service.ts";
import { catalogSeed } from "./seed-catalog.ts";

const DEFAULT_ADMIN_PASSWORD = "Admin123!";

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
  // Products and promotions must be removed before their referenced categories.
  await ProductModel.deleteMany({});
  await PromotionModel.deleteMany({});
  await CategoryModel.deleteMany({});
  await UserModel.deleteMany({});
  await EnquiryModel.deleteMany({});
  await BusinessInfoModel.deleteMany({});
  // Recrea los indices que cambiaron de opciones en el modelo, por ejemplo la
  // collation del nombre unico de las categorias.
  await CategoryModel.syncIndexes();
}

async function seedAdmin(): Promise<void> {
  const adminPassword =
    process.env.SEED_ADMIN_PASSWORD ?? DEFAULT_ADMIN_PASSWORD;

  await UserModel.create({
    fullName: "Administrador Demo",
    email: "admin@example.com",
    phone: "+54 11 5555 0101",
    passwordHash: await hashPassword(adminPassword),
    role: UserRole.Admin,
  });
}

/**
 * Usa las fotos reales del repositorio cuando ya fueron incorporadas en
 * backend/public/catalog. Los productos sin foto conservan el placeholder
 * de demostración; no se inventa una foto incorrecta del producto.
 *
 * El URL base apunta a archivos versionados de GitHub para que las imágenes
 * no dependan de localhost ni del directorio local de uploads.
 */
function seedPhotosByName(): Map<string, string[]> {
  const result = new Map<string, string[]>();
  const manifestPath = resolve(process.cwd(), "scripts/catalog-photos.json");
  const mediaDir = resolve(process.cwd(), "public/catalog");
  if (!existsSync(manifestPath) || !existsSync(mediaDir)) return result;

  const items = JSON.parse(readFileSync(manifestPath, "utf8")) as Array<{
    name: string;
    filename: string;
  }>;
  const available = readdirSync(mediaDir);
  const base =
    process.env.CATALOG_IMAGE_BASE_URL ??
    "https://raw.githubusercontent.com/FranciscoMessina/tp-aplicaciones-interactivas/main/backend/public/catalog/";
  for (const item of items) {
    const filename = available.find((file) => {
      const extension = extname(file).toLowerCase();
      return (
        [".jpg", ".jpeg", ".png", ".webp", ".gif"].includes(extension) &&
        file.slice(0, -extname(file).length) === item.filename
      );
    });
    if (filename)
      result.set(item.name, [
        new URL(encodeURIComponent(filename), base).toString(),
      ]);
  }
  return result;
}

async function seedCatalog(): Promise<{
  categoryCount: number;
  productCount: number;
}> {
  const products = [];
  // Numero correlativo de cada producto, para generar imagenes, stock y
  // productos inactivos de forma variada pero siempre igual en cada corrida.
  let sequence = 0;
  const photosByName = seedPhotosByName();

  for (const categorySeed of catalogSeed) {
    const category = await CategoryModel.create({ name: categorySeed.name });

    for (const productSeed of categorySeed.products) {
      sequence += 1;

      products.push({
        ...productSeed,
        category: category.id,
        images: photosByName.get(productSeed.name) ?? [
          `https://picsum.photos/seed/product-${sequence}-main/800/600`,
          `https://picsum.photos/seed/product-${sequence}-detail/800/600`,
        ],
        availableQuantity: sequence % 9,
        // Uno de cada diez queda desactivado, para probar el filtro del admin.
        isActive: sequence % 10 !== 0,
        // Algunos se destacan en la pagina de inicio.
        isFeatured: sequence % 18 === 4,
        // Algunos tienen descuento, para la seccion de ofertas.
        discountPercent: sequence % 7 === 3 ? [10, 15, 20][sequence % 3] : 0,
      });
    }
  }

  await ProductModel.create(products);

  return { categoryCount: catalogSeed.length, productCount: products.length };
}

async function seedPromotions(): Promise<number> {
  const audio = await CategoryModel.findOne({ name: "Audio" });
  const promotions = await PromotionModel.create([
    {
      title: "Semana del audio",
      description:
        "Auriculares y parlantes con precios especiales. Consultanos por cuotas sin interés.",
      category: audio?.id,
    },
    {
      title: "Ofertas de la semana",
      description:
        "Una selección de productos con descuento, mientras dure el stock.",
    },
    {
      // Queda apagada, para ver en el panel una que no sale en el sitio.
      title: "Vuelta a clases",
      description: "Notebooks y tablets para arrancar el año.",
      startDate: "2027-02-15",
      endDate: "2027-03-15",
      isActive: false,
    },
  ]);

  return promotions.length;
}

async function seedBusinessInfo(): Promise<void> {
  await BusinessInfoModel.create({
    name: "TechStore",
    description:
      "Tienda de tecnología con consolas, computadoras, celulares, videojuegos y accesorios. Asesoramiento personalizado y garantía oficial en todos los productos.",
    address: "Av. Corrientes 1234, CABA, Buenos Aires",
    phone: "+54 11 5555 0100",
    socialNetworks: [
      "https://www.instagram.com/techstore",
      "https://www.facebook.com/techstore",
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
    await seedAdmin();
    const { categoryCount, productCount } = await seedCatalog();
    const promotionCount = await seedPromotions();
    await seedBusinessInfo();
    const enquiryCount = await seedEnquiries();
    await syncProductSearchIndex();

    console.log(
      `Seed completed: 1 admin, ${categoryCount} categories, ${productCount} products, ${promotionCount} promotions, ${enquiryCount} enquiries and the business info created`,
    );
  } finally {
    await disconnectDatabase();
  }
}

runSeed().catch((error: unknown) => {
  console.error("Seed failed:", error);
  process.exitCode = 1;
});
