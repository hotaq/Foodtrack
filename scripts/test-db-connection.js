// This script tests database connection and user authentication
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
  try {
    // Test database connection
    console.log('Testing database connection...');
    const userCount = await prisma.user.count();
    console.log(`Connection successful. Found ${userCount} users in the database.`);

    // List all users (without passwords)
    console.log('\nListing all users:');
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        isBanned: true,
        createdAt: true,
      }
    });
    
    console.log(JSON.stringify(users, null, 2));

    // Test authentication for a specific user
    if (users.length > 0) {
      const testUser = users[0];
      console.log(`\nTesting authentication for user: ${testUser.email}`);
      
      // Get user with password
      const userWithPassword = await prisma.user.findUnique({
        where: { email: testUser.email },
        select: {
          id: true,
          name: true,
          email: true,
          password: true,
        }
      });
      
      if (userWithPassword && userWithPassword.password) {
        console.log('User found with password hash.');
        
        // Test with a known password (you'll need to provide this)
        const testPassword = 'password123'; // Replace with a password you want to test
        const passwordMatch = await bcrypt.compare(testPassword, userWithPassword.password);
        
        console.log(`Password test result: ${passwordMatch ? 'MATCH' : 'NO MATCH'}`);
        console.log('If NO MATCH, try with the correct password or check hashing mechanism');
      } else {
        console.log('User found but has no password (might be using OAuth)');
      }
    }
  } catch (error) {
    console.error('Error testing database connection:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main(); 