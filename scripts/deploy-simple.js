// This script helps deploy to Vercel with the new database URL
const { execSync } = require('child_process');

// Database URL
const DATABASE_URL = "postgresql://neondb_owner:npg_HL4UfuYA8lpJ@ep-super-breeze-a1ggrbbp-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require";

console.log('Starting deployment to Vercel...');
console.log('Using DATABASE_URL:', DATABASE_URL);

try {
  // Set the DATABASE_URL in Vercel
  console.log('Setting DATABASE_URL in Vercel...');
  execSync(`vercel env rm DATABASE_URL --yes`, { stdio: 'inherit' }).catch(() => {});
  execSync(`vercel env add DATABASE_URL ${DATABASE_URL}`, { stdio: 'inherit' });
  
  // Deploy to Vercel
  console.log('Deploying to Vercel...');
  execSync('vercel --prod', { stdio: 'inherit' });
  
  console.log('Deployment successful!');
} catch (error) {
  console.error('Deployment error:', error);
  process.exit(1);
} 