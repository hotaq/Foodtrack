import { createEdgeStoreNextHandler } from '@edgestore/server/adapters/next/app';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { es } from '@/lib/edgestore-server';

// Log environment variables for debugging (will be visible in server logs)
console.log('EDGE_STORE_ACCESS_KEY present:', !!process.env.EDGE_STORE_ACCESS_KEY);
console.log('EDGE_STORE_SECRET_KEY present:', !!process.env.EDGE_STORE_SECRET_KEY);

/**
 * This is the main router for the Edge Store buckets.
 */
const edgeStoreRouter = es.router({
  publicFiles: es.fileBucket(),
  mealImages: es.fileBucket({
    accept: ['image/jpeg', 'image/png', 'image/webp'],
    maxSize: 8 * 1024 * 1024, // 8MB
  }),
  profileImages: es.fileBucket({
    accept: ['image/jpeg', 'image/png', 'image/webp'],
    maxSize: 4 * 1024 * 1024, // 4MB
  }),
});

// @ts-ignore - Ignoring TypeScript errors for now to get the handler working
const handler = createEdgeStoreNextHandler({
  router: edgeStoreRouter,
});

export { handler as GET, handler as POST };

/**
 * This type is used to create the type-safe client for the frontend.
 */
export type EdgeStoreRouter = typeof edgeStoreRouter; 