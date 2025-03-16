import { PrismaClient } from "@prisma/client";

declare global {
  var cachedPrisma: PrismaClient;
}

// Use a direct database URL to avoid environment variable parsing issues
const databaseUrl = "postgresql://neondb_owner:npg_0gNzs1dPUvTF@ep-dry-cake-a8zunxhe-pooler.eastus2.azure.neon.tech/neondb?sslmode=require";

export let db: PrismaClient;

if (process.env.NODE_ENV === "production") {
  db = new PrismaClient({
    datasources: {
      db: {
        url: databaseUrl,
      },
    },
  });
} else {
  if (!global.cachedPrisma) {
    global.cachedPrisma = new PrismaClient({
      datasources: {
        db: {
          url: databaseUrl,
        },
      },
    });
  }
  db = global.cachedPrisma;
} 