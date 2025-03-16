// This script checks all users in the database
// Run with: node scripts/check-users.js

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkUsers() {
  try {
    console.log('=== Checking Users ===');
    
    // Get all users
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        password: true, // Include password to check if it exists
      }
    });
    
    console.log(`Total users: ${users.length}`);
    
    // Check admin users
    const adminUsers = users.filter(user => user.role === 'ADMIN');
    console.log(`\nAdmin users (${adminUsers.length}):`);
    
    adminUsers.forEach(user => {
      console.log(`- ID: ${user.id}`);
      console.log(`  Name: ${user.name}`);
      console.log(`  Email: ${user.email}`);
      console.log(`  Has password: ${user.password ? 'Yes' : 'No'}`);
      console.log('');
    });
    
    // Check regular users
    const regularUsers = users.filter(user => user.role === 'USER');
    console.log(`\nRegular users (${regularUsers.length}):`);
    
    regularUsers.forEach(user => {
      console.log(`- ID: ${user.id}`);
      console.log(`  Name: ${user.name}`);
      console.log(`  Email: ${user.email}`);
      console.log(`  Has password: ${user.password ? 'Yes' : 'No'}`);
      console.log('');
    });
    
  } catch (error) {
    console.error('Error checking users:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkUsers(); 