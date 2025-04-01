import { PrismaClient } from '@prisma/client';

// Add the necessary model types to the PrismaClient
// This ensures TypeScript recognizes our models
declare global {
  var prisma: PrismaClient | undefined;
}

// Use a single PrismaClient instance across the application
// to avoid multiple connections during development hot reloads
export const prisma = global.prisma || new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  global.prisma = prisma;
}

export default prisma; 