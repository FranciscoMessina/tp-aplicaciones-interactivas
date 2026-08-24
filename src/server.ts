import "dotenv/config";
import { app } from "./app.ts";
import { env } from "./config/env.ts";
import { connectDatabase, disconnectDatabase } from "./db.ts";

try {
  await connectDatabase(env.mongoUri);
  console.log("Connected to MongoDB");

  const server = app.listen(env.port, () => {
    console.log(`Server listening on port ${env.port}`);
  });

  const shutdown = (signal: NodeJS.Signals): void => {
    console.log(`${signal} received. Shutting down...`);

    server.close((error) => {
      if (error) {
        console.error("Failed to close the HTTP server:", error);
        process.exitCode = 1;
        return;
      }

      void disconnectDatabase().then(
        () => {
          process.exitCode = 0;
        },
        (disconnectError: unknown) => {
          console.error("Failed to disconnect from MongoDB:", disconnectError);
          process.exitCode = 1;
        },
      );
    });
  };

  process.once("SIGINT", shutdown);
  process.once("SIGTERM", shutdown);
} catch (error) {
  console.error("Failed to start the server:", error);
  process.exitCode = 1;
}
