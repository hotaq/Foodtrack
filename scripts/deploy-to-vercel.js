// This script helps deploy to Vercel with all the necessary fixes
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Database URL
const DATABASE_URL = "postgresql://neondb_owner:npg_0gNzs1dPUvTF@ep-dry-cake-a8zunxhe-pooler.eastus2.azure.neon.tech/neondb?sslmode=require";

// Function to ensure all environment files are set up correctly
function setupEnvironmentFiles() {
  console.log('Setting up environment files...');
  
  const envFiles = [
    { path: '.env.local', content: `DATABASE_URL=${DATABASE_URL}` },
    { path: '.env.production', content: `DATABASE_URL=${DATABASE_URL}` },
    { path: '.env.development', content: `DATABASE_URL=${DATABASE_URL}` },
  ];
  
  for (const envFile of envFiles) {
    fs.writeFileSync(envFile.path, envFile.content);
    console.log(`Created ${envFile.path}`);
  }
}

// Function to set up Vercel environment variables
function setupVercelEnv() {
  console.log('Setting up Vercel environment variables...');
  
  try {
    // Set DATABASE_URL in Vercel
    execSync(`vercel env add DATABASE_URL ${DATABASE_URL}`, { stdio: 'inherit' });
    console.log('Added DATABASE_URL to Vercel environment variables');
    
    // Set EdgeStore variables
    execSync(`vercel env add EDGE_STORE_ACCESS_KEY xS0zKPdhRDn6xcTc01ncdm1S4nGMWVzA`, { stdio: 'inherit' });
    execSync(`vercel env add EDGE_STORE_SECRET_KEY 6jzepoThSlOqfmb9yGhydaq2Jot6roGYggZfkuMmhHDqhNki`, { stdio: 'inherit' });
    console.log('Added EdgeStore variables to Vercel environment variables');
  } catch (error) {
    console.warn('Warning: Could not set Vercel environment variables. You may need to set them manually in the Vercel dashboard.');
  }
}

// Function to deploy to Vercel
function deployToVercel() {
  console.log('Deploying to Vercel...');
  
  try {
    execSync('vercel --prod', { stdio: 'inherit' });
    console.log('Deployment successful!');
  } catch (error) {
    console.error('Deployment failed:', error.message);
    process.exit(1);
  }
}

// Main function
function main() {
  console.log('Starting deployment process...');
  
  // Set up environment files
  setupEnvironmentFiles();
  
  // Set up Vercel environment variables
  setupVercelEnv();
  
  // Deploy to Vercel
  deployToVercel();
  
  console.log('Deployment process completed!');
}

// Run the main function
main(); 