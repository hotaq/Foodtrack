// This script checks the EdgeStore configuration in the application
require('dotenv').config();
const fs = require('fs');
const path = require('path');

console.log('Checking EdgeStore configuration...');

// Check if the EdgeStore API keys are set in .env
console.log('\n1. Checking environment variables:');
if (!process.env.EDGE_STORE_ACCESS_KEY || !process.env.EDGE_STORE_SECRET_KEY) {
  console.error('❌ EdgeStore API keys are missing in .env file!');
  console.error('Make sure to set EDGE_STORE_ACCESS_KEY and EDGE_STORE_SECRET_KEY in your .env file.');
} else {
  console.log('✅ EdgeStore API keys are set in .env file.');
  console.log(`   EDGE_STORE_ACCESS_KEY: ${process.env.EDGE_STORE_ACCESS_KEY.substring(0, 5)}...`);
  console.log(`   EDGE_STORE_SECRET_KEY: ${process.env.EDGE_STORE_SECRET_KEY.substring(0, 5)}...`);
}

// Check if the EdgeStore API route exists
console.log('\n2. Checking EdgeStore API route:');
const edgestoreRoutePath = path.join(process.cwd(), 'app', 'api', 'edgestore', '[...edgestore]', 'route.ts');
if (fs.existsSync(edgestoreRoutePath)) {
  console.log('✅ EdgeStore API route exists.');
  
  // Check the content of the EdgeStore API route
  const edgestoreRouteContent = fs.readFileSync(edgestoreRoutePath, 'utf8');
  if (edgestoreRouteContent.includes('initEdgeStore')) {
    console.log('✅ EdgeStore API route is properly configured.');
  } else {
    console.error('❌ EdgeStore API route might not be properly configured!');
    console.error('Make sure the route.ts file includes the initEdgeStore function.');
  }
} else {
  console.error('❌ EdgeStore API route does not exist!');
  console.error('Make sure to create the file at: app/api/edgestore/[...edgestore]/route.ts');
}

// Check if the EdgeStore provider is set up
console.log('\n3. Checking EdgeStore provider:');
const providerPaths = [
  path.join(process.cwd(), 'app', 'providers.tsx'),
  path.join(process.cwd(), 'components', 'providers.tsx'),
  path.join(process.cwd(), 'app', 'providers', 'index.tsx'),
  path.join(process.cwd(), 'providers', 'index.tsx')
];

let providerFound = false;
for (const providerPath of providerPaths) {
  if (fs.existsSync(providerPath)) {
    const providerContent = fs.readFileSync(providerPath, 'utf8');
    if (providerContent.includes('EdgeStoreProvider')) {
      console.log(`✅ EdgeStore provider found in ${providerPath}`);
      providerFound = true;
      break;
    }
  }
}

if (!providerFound) {
  console.error('❌ EdgeStore provider not found!');
  console.error('Make sure to set up the EdgeStoreProvider in your application.');
}

console.log('\nEdgeStore configuration check completed.'); 