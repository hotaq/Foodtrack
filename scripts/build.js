// This script ensures DATABASE_URL is available during build
const { execSync } = require('child_process');

// Hardcoded database URL to ensure it's always available
const DATABASE_URL = "postgresql://neondb_owner:npg_0gNzs1dPUvTF@ep-dry-cake-a8zunxhe-pooler.eastus2.azure.neon.tech/neondb?sslmode=require";

// Set the DATABASE_URL environment variable
process.env.DATABASE_URL = DATABASE_URL;

console.log('Using DATABASE_URL:', DATABASE_URL);

try {
  // Build Next.js app (Next.js will handle Prisma generation)
  console.log('Building Next.js app...');
  execSync('next build', { 
    stdio: 'inherit',
    env: { 
      ...process.env,
      DATABASE_URL: DATABASE_URL
    }
  });
} catch (error) {
  console.error('Build error:', error);
  process.exit(1);
} 