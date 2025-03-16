import { initEdgeStore } from '@edgestore/server';
import { createEdgeStoreNextHandler } from '@edgestore/server/adapters/next/app';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// Initialize EdgeStore with environment variables
const es = initEdgeStore.create();

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

const handler = createEdgeStoreNextHandler({
  router: edgeStoreRouter,
});

export { handler as GET, handler as POST };

/**
 * This type is used to create the type-safe client for the frontend.
 */
export type EdgeStoreRouter = typeof edgeStoreRouter; 