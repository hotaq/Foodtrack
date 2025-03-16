// This script is a Windows-friendly deployment script
const { execSync } = require('child_process');

// Database URL
const DATABASE_URL = "postgresql://neondb_owner:npg_HL4UfuYA8lpJ@ep-super-breeze-a1ggrbbp-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require";

console.log('Starting Windows-friendly deployment to Vercel...');
console.log('Using DATABASE_URL:', DATABASE_URL);

try {
  // Deploy to Vercel directly
  console.log('Deploying to Vercel...');
  execSync('vercel --prod', { 
    stdio: 'inherit',
    env: { 
      ...process.env,
      DATABASE_URL: DATABASE_URL
    }
  });
  
  console.log('Deployment successful!');
} catch (error) {
  console.error('Deployment error:', error);
  process.exit(1);
} 