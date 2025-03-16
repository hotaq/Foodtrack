// This script migrates the database schema to the new database
const { execSync } = require('child_process');

// Database URL
const DATABASE_URL = "postgresql://neondb_owner:npg_HL4UfuYA8lpJ@ep-super-breeze-a1ggrbbp-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require";

console.log('Starting database migration...');
console.log('Using DATABASE_URL:', DATABASE_URL);

try {
  // Set the DATABASE_URL environment variable
  process.env.DATABASE_URL = DATABASE_URL;
  
  // Run Prisma migration
  console.log('Running Prisma migration...');
  execSync('npx prisma migrate deploy', { 
    stdio: 'inherit',
    env: { 
      ...process.env,
      DATABASE_URL: DATABASE_URL
    }
  });
  
  // Generate Prisma client
  console.log('Generating Prisma client...');
  execSync('npx prisma generate', { 
    stdio: 'inherit',
    env: { 
      ...process.env,
      DATABASE_URL: DATABASE_URL
    }
  });
  
  console.log('Database migration successful!');
} catch (error) {
  console.error('Migration error:', error);
  process.exit(1);
} 