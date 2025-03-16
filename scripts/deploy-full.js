// This script handles database migration and Vercel deployment
const { execSync } = require('child_process');

// Database URL
const DATABASE_URL = "postgresql://neondb_owner:npg_HL4UfuYA8lpJ@ep-super-breeze-a1ggrbbp-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require";

console.log('Starting full deployment process...');
console.log('Using DATABASE_URL:', DATABASE_URL);

// Set the DATABASE_URL environment variable
process.env.DATABASE_URL = DATABASE_URL;

try {
  // Step 1: Migrate the database
  console.log('\n=== Step 1: Migrating the database ===');
  try {
    execSync('npx prisma migrate deploy', { 
      stdio: 'inherit',
      env: { 
        ...process.env,
        DATABASE_URL: DATABASE_URL
      }
    });
    console.log('Database migration successful!');
  } catch (error) {
    console.error('Database migration error:', error);
    console.log('Continuing with deployment...');
  }
  
  // Step 2: Generate Prisma client
  console.log('\n=== Step 2: Generating Prisma client ===');
  execSync('npx prisma generate', { 
    stdio: 'inherit',
    env: { 
      ...process.env,
      DATABASE_URL: DATABASE_URL
    }
  });
  console.log('Prisma client generation successful!');
  
  // Step 3: Set environment variables in Vercel
  console.log('\n=== Step 3: Setting environment variables in Vercel ===');
  try {
    // Remove existing DATABASE_URL
    execSync('vercel env rm DATABASE_URL --yes', { stdio: 'inherit' }).catch(() => {});
    
    // Add new DATABASE_URL
    execSync(`vercel env add DATABASE_URL ${DATABASE_URL}`, { stdio: 'inherit' });
    console.log('Environment variables set in Vercel!');
  } catch (error) {
    console.error('Error setting environment variables:', error);
    console.log('Continuing with deployment...');
  }
  
  // Step 4: Deploy to Vercel
  console.log('\n=== Step 4: Deploying to Vercel ===');
  execSync('vercel --prod', { 
    stdio: 'inherit',
    env: { 
      ...process.env,
      DATABASE_URL: DATABASE_URL
    }
  });
  
  console.log('\nFull deployment process completed successfully!');
} catch (error) {
  console.error('Deployment error:', error);
  process.exit(1);
} 