// This script helps you manually set up environment variables in Vercel
const { execSync } = require('child_process');

// Database URL
const DATABASE_URL = "postgresql://neondb_owner:npg_HL4UfuYA8lpJ@ep-super-breeze-a1ggrbbp-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require";

console.log('=== Vercel Environment Variables Setup Guide ===');
console.log('\nTo set up your environment variables in Vercel, follow these steps:');
console.log('\n1. Go to your Vercel dashboard: https://vercel.com/dashboard');
console.log('2. Select your project');
console.log('3. Go to "Settings" > "Environment Variables"');
console.log('4. Add the following environment variables:');
console.log('\n   DATABASE_URL:');
console.log(`   ${DATABASE_URL}`);
console.log('\n   EDGE_STORE_ACCESS_KEY:');
console.log('   xS0zKPdhRDn6xcTc01ncdm1S4nGMWVzA');
console.log('\n   EDGE_STORE_SECRET_KEY:');
console.log('   6jzepoThSlOqfmb9yGhydaq2Jot6roGYggZfkuMmhHDqhNki');
console.log('\n   NEXTAUTH_URL:');
console.log('   https://your-vercel-deployment-url.vercel.app');
console.log('\n   NEXTAUTH_SECRET:');
console.log('   your-nextauth-secret');
console.log('\n5. Make sure to select all environments (Production, Preview, and Development)');
console.log('6. Save the changes');
console.log('\n7. Redeploy your application by running:');
console.log('   vercel --prod');
console.log('\n=== End of Guide ===');

// Copy DATABASE_URL to clipboard
try {
  if (process.platform === 'win32') {
    execSync(`echo ${DATABASE_URL} | clip`);
    console.log('\nThe DATABASE_URL has been copied to your clipboard for convenience.');
  }
} catch (error) {
  // Ignore clipboard errors
} 