// This script deploys your application to Vercel with EdgeStore environment variables
require('dotenv').config();
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('Deploying to Vercel with EdgeStore environment variables...');

// Check if the EdgeStore API keys are set
console.log('\nChecking EdgeStore API keys...');
if (!process.env.EDGE_STORE_ACCESS_KEY || !process.env.EDGE_STORE_SECRET_KEY) {
  console.error('❌ EdgeStore API keys are missing!');
  console.error('Make sure to set EDGE_STORE_ACCESS_KEY and EDGE_STORE_SECRET_KEY in your .env file.');
  process.exit(1);
} else {
  console.log('✅ EdgeStore API keys are set.');
}

// Create a temporary .env.production file
console.log('\nCreating .env.production file...');
const envContent = `# EdgeStore
EDGE_STORE_ACCESS_KEY=${process.env.EDGE_STORE_ACCESS_KEY}
EDGE_STORE_SECRET_KEY=${process.env.EDGE_STORE_SECRET_KEY}
`;

fs.writeFileSync(path.join(process.cwd(), '.env.production'), envContent);
console.log('✅ .env.production file created.');

// Deploy to Vercel
console.log('\nDeploying to Vercel...');
console.log('This will deploy your application to Vercel with the EdgeStore environment variables.');
console.log('If you are not logged in to Vercel, you will be prompted to log in.');
console.log('\nTo deploy, run:');
console.log('vercel --prod');

console.log('\nOr set the environment variables manually in the Vercel dashboard:');
console.log('1. Go to your Vercel project');
console.log('2. Go to Settings > Environment Variables');
console.log('3. Add the following environment variables:');
console.log(`   - EDGE_STORE_ACCESS_KEY: ${process.env.EDGE_STORE_ACCESS_KEY}`);
console.log(`   - EDGE_STORE_SECRET_KEY: ${process.env.EDGE_STORE_SECRET_KEY.substring(0, 5)}...`);
console.log('4. Deploy your project again');

process.exit(0); 