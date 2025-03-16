const { execSync } = require('child_process');

// Set environment variables for the deployment
process.env.DATABASE_URL = 'postgresql://neondb_owner:npg_0gNzs1dPUvTF@ep-dry-cake-a8zunxhe-pooler.eastus2.azure.neon.tech/neondb?sslmode=require';
process.env.NEXTAUTH_URL = 'https://my-app-hotaqs-projects.vercel.app';
process.env.NEXTAUTH_SECRET = 'your-nextauth-secret';
process.env.EDGE_STORE_ACCESS_KEY = 'xS0zKPdhRDn6xcTc01ncdm1S4nGMWVzA';
process.env.EDGE_STORE_SECRET_KEY = '6jzepoThSlOqfmb9yGhydaq2Jot6roGYggZfkuMmhHDqhNki';
process.env.GOOGLE_CLIENT_ID = 'your-google-client-id';
process.env.GOOGLE_CLIENT_SECRET = 'your-google-client-secret';
process.env.FACEBOOK_CLIENT_ID = 'your-facebook-client-id';
process.env.FACEBOOK_CLIENT_SECRET = 'your-facebook-client-secret';

try {
  // Deploy with environment variables
  console.log('Deploying to Vercel...');
  execSync('vercel --prod', { stdio: 'inherit', env: process.env });
  console.log('Deployment successful!');
} catch (error) {
  console.error('Deployment failed:', error);
} 