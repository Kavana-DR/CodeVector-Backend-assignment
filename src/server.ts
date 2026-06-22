import { Server } from "node:http";

import { app } from "./app";
import { env } from "./config/env";
import { prisma } from "./infrastructure/database/prisma";

let server: Server;

async function start(): Promise<void> {
  await prisma.$connect();

  server = app.listen(env.PORT, () => {
    console.log(`API listening on port ${env.PORT}`);
  });
}

async function shutdown(signal: string): Promise<void> {
  console.log(`${signal} received; shutting down`);

  if (server) {
    await new Promise<void>((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }

  await prisma.$disconnect();
  process.exit(0);
}

process.on("SIGINT", () => void shutdown("SIGINT"));
process.on("SIGTERM", () => void shutdown("SIGTERM"));

start().catch(async (error: unknown) => {
  console.error("Failed to start API", error);
  await prisma.$disconnect();
  process.exit(1);
});
