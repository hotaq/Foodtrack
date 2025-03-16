// This script tests the new database connection
const { PrismaClient } = require('@prisma/client');

// Use the new database URL directly
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: "postgresql://neondb_owner:npg_HL4UfuYA8lpJ@ep-super-breeze-a1ggrbbp-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require"
    }
  }
});

async function main() {
  try {
    console.log('Testing new database connection...');
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
    console.error('Error connecting to new database:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main(); 