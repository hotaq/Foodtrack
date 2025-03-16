// This script ensures DATABASE_URL is available during build
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Ensure DATABASE_URL is set
const databaseUrl = "postgresql://neondb_owner:npg_0gNzs1dPUvTF@ep-dry-cake-a8zunxhe-pooler.eastus2.azure.neon.tech/neondb?sslmode=require";
process.env.DATABASE_URL = process.env.DATABASE_URL || databaseUrl;

console.log('Using DATABASE_URL:', process.env.DATABASE_URL);

try {
  // Check if we're in a Vercel environment
  if (process.env.VERCEL) {
    console.log('Running in Vercel environment, using special Prisma configuration');
    
    // Copy the Vercel-specific Prisma schema
    const vercelPrismaPath = path.join(process.cwd(), 'prisma', 'vercel.prisma');
    const mainPrismaPath = path.join(process.cwd(), 'prisma', 'schema.prisma');
    
    if (fs.existsSync(vercelPrismaPath)) {
      const vercelPrismaContent = fs.readFileSync(vercelPrismaPath, 'utf8');
      fs.writeFileSync(mainPrismaPath, vercelPrismaContent);
      console.log('Using Vercel-specific Prisma schema');
    }
  }

  // Generate Prisma client
  console.log('Generating Prisma client...');
  execSync('npx prisma generate', { stdio: 'inherit', env: { ...process.env, DATABASE_URL: databaseUrl } });

  // Build Next.js app
  console.log('Building Next.js app...');
  execSync('next build', { stdio: 'inherit', env: { ...process.env, DATABASE_URL: databaseUrl } });
} catch (error) {
  console.error('Build error:', error);
  process.exit(1);
} 