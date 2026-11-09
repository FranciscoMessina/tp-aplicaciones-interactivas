import mongoose from "mongoose";

export async function connectDatabase(mongoUri: string): Promise<void> {
  await mongoose.connect(mongoUri);
}

export async function disconnectDatabase(): Promise<void> {
  await mongoose.disconnect();
}

// Codigo con el que un MongoDB que no es Atlas (por ejemplo, uno local)
// rechaza `$search` y la administracion de indices de busqueda.
const SEARCH_NOT_ENABLED = 31082;

export function isSearchNotEnabledError(error: unknown): boolean {
  return (
    error instanceof mongoose.mongo.MongoServerError &&
    error.code === SEARCH_NOT_ENABLED
  );
}
