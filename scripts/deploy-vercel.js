#!/usr/bin/env node

const { execSync } = require('child_process');
const readline = require('readline');
const fs = require('fs');
const path = require('path');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('\n🚀 Vercel Deployment Helper\n');

const runCommand = (command) => {
  try {
    execSync(command, { stdio: 'inherit' });
    return true;
  } catch (error) {
    console.error(`Failed to execute ${command}`, error);
    return false;
  }
};

const checkVercelCLI = () => {
  try {
    execSync('vercel --version', { stdio: 'ignore' });
    return true;
  } catch (error) {
    return false;
  }
};

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

const deployToVercel = async () => {
  if (!checkVercelCLI()) {
    console.log('❌ Vercel CLI not found. Installing...');
    if (!runCommand('npm install -g vercel')) {
      console.error('Failed to install Vercel CLI. Please install it manually with: npm install -g vercel');
      process.exit(1);
    }
  }

  console.log('✅ Vercel CLI is installed');

  // Login to Vercel if needed
  console.log('\n🔑 Checking Vercel login status...');
  try {
    execSync('vercel whoami', { stdio: 'ignore' });
    console.log('✅ Already logged in to Vercel');
  } catch (error) {
    console.log('🔑 Please login to Vercel:');
    if (!runCommand('vercel login')) {
      console.error('Failed to login to Vercel');
      process.exit(1);
    }
  }

  // Ask if this is a new project or existing project
  rl.question('\n🤔 Is this a new project deployment or updating an existing project? (new/existing): ', async (answer) => {
    const isNew = answer.toLowerCase() === 'new';

    if (isNew) {
      console.log('\n🆕 Setting up a new Vercel project...');
      
      console.log('\n⚙️ Running initial deployment...');
      if (!runCommand('vercel')) {
        console.error('Failed to deploy to Vercel');
        rl.close();
        process.exit(1);
      }
    } else {
      console.log('\n🔄 Linking to existing Vercel project...');
      if (!runCommand('vercel link')) {
        console.error('Failed to link to Vercel project');
        rl.close();
        process.exit(1);
      }
    }

    // Pull environment variables
    console.log('\n🌍 Pulling environment variables...');
    if (!runCommand('vercel env pull .env')) {
      console.warn('⚠️ Warning: Could not pull environment variables. Make sure they are set in the Vercel dashboard.');
    }

    // Ask if they want to deploy now
    rl.question('\n🚀 Do you want to deploy now? (yes/no): ', (deployNow) => {
      if (deployNow.toLowerCase() === 'yes') {
        console.log('\n🚀 Deploying to Vercel...');
        if (!runCommand('vercel --prod')) {
          console.error('Failed to deploy to Vercel');
          rl.close();
          process.exit(1);
        }
        
        console.log('\n✅ Deployment successful!');
        console.log('\n🔍 Running database migrations...');
        
        if (!runCommand('npx prisma migrate deploy')) {
          console.warn('⚠️ Warning: Could not run database migrations. You may need to run them manually.');
        } else {
          console.log('✅ Database migrations applied successfully!');
        }
      } else {
        console.log('\n👍 You can deploy later by running: vercel --prod');
      }
      
      console.log('\n🎉 Setup complete! Your app is ready for Vercel.');
      rl.close();
    });
  });
};

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