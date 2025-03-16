import { PrismaClient } from "@prisma/client";

declare global {
  var cachedPrisma: PrismaClient;
}

export let db: PrismaClient;

// Safely get the database URL
const getDatabaseUrl = () => {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.warn("DATABASE_URL is not set");
    return "postgresql://placeholder:placeholder@localhost:5432/placeholder";
  }
  return url;
};

// Create Prisma client with explicit datasources config
const prismaClientSingleton = () => {
  return new PrismaClient({
    datasources: {
      db: {
        url: getDatabaseUrl(),
      },
    },
  });
};

if (process.env.NODE_ENV === "production") {
  db = prismaClientSingleton();
} else {
  if (!global.cachedPrisma) {
    global.cachedPrisma = prismaClientSingleton();
  }
  db = global.cachedPrisma;
} 