// This script helps with Vercel deployment
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Ensure .env.local exists with required variables
function ensureEnvFile() {
  console.log('Ensuring environment variables are set...');
  
  const envLocalPath = path.join(process.cwd(), '.env.local');
  const envProductionPath = path.join(process.cwd(), '.env.production');
  
  // Create .env.local if it doesn't exist
  if (!fs.existsSync(envLocalPath)) {
    console.log('Creating .env.local file...');
    
    const envContent = `
# Database
DATABASE_URL="postgresql://neondb_owner:npg_0gNzs1dPUvTF@ep-dry-cake-a8zunxhe-pooler.eastus2.azure.neon.tech/neondb?sslmode=require"

# NextAuth
NEXTAUTH_URL="https://my-app-hotaqs-projects.vercel.app"
NEXTAUTH_SECRET="your-nextauth-secret"

# EdgeStore
EDGE_STORE_ACCESS_KEY="xS0zKPdhRDn6xcTc01ncdm1S4nGMWVzA"
EDGE_STORE_SECRET_KEY="6jzepoThSlOqfmb9yGhydaq2Jot6roGYggZfkuMmhHDqhNki"
`;
    
    fs.writeFileSync(envLocalPath, envContent.trim());
    console.log('.env.local file created successfully.');
  }
  
  // Create .env.production if it doesn't exist
  if (!fs.existsSync(envProductionPath)) {
    console.log('Creating .env.production file...');
    
    const envContent = `
# Database
DATABASE_URL="postgresql://neondb_owner:npg_0gNzs1dPUvTF@ep-dry-cake-a8zunxhe-pooler.eastus2.azure.neon.tech/neondb?sslmode=require"

# NextAuth
NEXTAUTH_URL="https://my-app-hotaqs-projects.vercel.app"
NEXTAUTH_SECRET="your-nextauth-secret"

# EdgeStore
EDGE_STORE_ACCESS_KEY="xS0zKPdhRDn6xcTc01ncdm1S4nGMWVzA"
EDGE_STORE_SECRET_KEY="6jzepoThSlOqfmb9yGhydaq2Jot6roGYggZfkuMmhHDqhNki"
`;
    
    fs.writeFileSync(envProductionPath, envContent.trim());
    console.log('.env.production file created successfully.');
  }
}

// Generate Prisma client
function generatePrisma() {
  console.log('Generating Prisma client...');
  execSync('npx prisma generate', { stdio: 'inherit' });
  console.log('Prisma client generated successfully.');
}

// Deploy to Vercel
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
  
  // Ensure environment variables
  ensureEnvFile();
  
  // Generate Prisma client
  generatePrisma();
  
  // Deploy to Vercel
  deployToVercel();
}

// Run the main function
main(); 