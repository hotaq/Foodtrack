// This script creates an admin user in the database
// Run with: node scripts/create-admin.js

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const readline = require('readline');

const prisma = new PrismaClient();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

async function createAdminUser() {
  try {
    console.log('=== Create Admin User ===');
    
    // Get admin details
    const name = await question('Enter admin name: ');
    const email = await question('Enter admin email: ');
    const password = await question('Enter admin password: ');
    
    if (!email || !password) {
      console.error('Email and password are required');
      process.exit(1);
    }
    
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });
    
    if (existingUser) {
      // Update existing user to admin
      console.log(`User ${email} already exists. Updating to admin role...`);
      
      const hashedPassword = await bcrypt.hash(password, 10);
      
      await prisma.user.update({
        where: { email },
        data: {
          role: 'ADMIN',
          password: hashedPassword,
          name: name || existingUser.name,
        },
      });
      
      console.log(`User ${email} has been updated to admin role.`);
    } else {
      // Create new admin user
      const hashedPassword = await bcrypt.hash(password, 10);
      
      const user = await prisma.user.create({
        data: {
          name,
          email,
          password: hashedPassword,
          role: 'ADMIN',
          streak: {
            create: {
              currentStreak: 0,
              longestStreak: 0,
            },
          },
        },
      });
      
      console.log(`Admin user created: ${user.email}`);
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error creating admin user:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

function question(query) {
  return new Promise((resolve) => {
    rl.question(query, (answer) => {
      resolve(answer);
    });
  });
}

createAdminUser(); 