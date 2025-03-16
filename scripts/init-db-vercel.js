// This script initializes the database on Vercel
const { execSync } = require('child_process');

// Database URL
const DATABASE_URL = "postgresql://neondb_owner:npg_HL4UfuYA8lpJ@ep-super-breeze-a1ggrbbp-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require";

console.log('Initializing database on Vercel...');
console.log('Using DATABASE_URL:', DATABASE_URL);

try {
  // Create a temporary Vercel project just for database initialization
  console.log('Creating temporary Vercel project...');
  execSync('vercel --confirm', { 
    stdio: 'inherit',
    env: { 
      ...process.env,
      DATABASE_URL: DATABASE_URL
    }
  });
  
  // Run database initialization commands on Vercel
  console.log('Running database initialization commands...');
  execSync('vercel run "npx prisma migrate deploy"', { 
    stdio: 'inherit',
    env: { 
      ...process.env,
      DATABASE_URL: DATABASE_URL
    }
  });
  
  console.log('Database initialization successful!');
} catch (error) {
  console.error('Database initialization error:', error);
  process.exit(1);
} 