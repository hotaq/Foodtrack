import { initEdgeStore } from '@edgestore/server';
import { createEdgeStoreNextHandler } from '@edgestore/server/adapters/next/app';

// Make sure environment variables are available
const accessKey = process.env.EDGE_STORE_ACCESS_KEY;
const secretKey = process.env.EDGE_STORE_SECRET_KEY;

if (!accessKey || !secretKey) {
  console.error('EdgeStore credentials are missing. Please check your environment variables.');
}

// This file is for server-side EdgeStore configuration
export const es = initEdgeStore.create(); 