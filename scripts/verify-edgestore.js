// This script verifies that the EdgeStore API keys are properly set
require('dotenv').config();

console.log('Verifying EdgeStore API keys...');
console.log('EDGE_STORE_ACCESS_KEY present:', !!process.env.EDGE_STORE_ACCESS_KEY);
console.log('EDGE_STORE_SECRET_KEY present:', !!process.env.EDGE_STORE_SECRET_KEY);

if (!process.env.EDGE_STORE_ACCESS_KEY || !process.env.EDGE_STORE_SECRET_KEY) {
  console.error('EdgeStore API keys are missing!');
  console.error('Make sure to set EDGE_STORE_ACCESS_KEY and EDGE_STORE_SECRET_KEY in your environment variables.');
  process.exit(1);
} else {
  console.log('EdgeStore API keys are properly set.');
  console.log('EDGE_STORE_ACCESS_KEY:', process.env.EDGE_STORE_ACCESS_KEY);
  console.log('EDGE_STORE_SECRET_KEY:', process.env.EDGE_STORE_SECRET_KEY.substring(0, 5) + '...');
  process.exit(0);
} 