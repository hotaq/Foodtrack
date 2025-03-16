// This script tests the production database connection
const { PrismaClient } = require('@prisma/client');

// Use the production database URL directly
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: "postgresql://neondb_owner:npg_0gNzs1dPUvTF@ep-dry-cake-a8zunxhe-pooler.eastus2.azure.neon.tech/neondb?sslmode=require"
    }
  }
});

async function main() {
  try {
    console.log('Testing production database connection...');
    const userCount = await prisma.user.count();
    console.log(`Connection successful! Found ${userCount} users in the database.`);
    
    // List all tables
    console.log('\nListing database tables:');
    const tables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `;
    console.log(tables);
    
  } catch (error) {
    console.error('Error connecting to production database:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main(); 