// This script tests login with admin credentials
// Run with: node scripts/test-login.js

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const readline = require('readline');

const prisma = new PrismaClient();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

async function testLogin() {
  try {
    console.log('=== Test Login ===');
    
    // Get login credentials
    const emailOrUsername = await question('Enter email or username: ');
    const password = await question('Enter password: ');
    
    if (!emailOrUsername || !password) {
      console.error('Email/username and password are required');
      process.exit(1);
    }
    
    // Check if input is email or username
    const isEmail = emailOrUsername.includes('@');
    
    // Find user by email or name (username)
    const user = await prisma.user.findFirst({
      where: isEmail 
        ? { email: emailOrUsername }
        : { name: emailOrUsername },
    });
    
    if (!user) {
      console.error(`User with ${isEmail ? 'email' : 'username'} ${emailOrUsername} not found`);
      process.exit(1);
    }
    
    if (!user.password) {
      console.error(`User has no password set`);
      process.exit(1);
    }
    
    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    
    if (!isPasswordValid) {
      console.error('Invalid password');
      process.exit(1);
    }
    
    console.log(`Login successful for user: ${user.name} (${user.email})`);
    console.log(`Role: ${user.role}`);
    process.exit(0);
  } catch (error) {
    console.error('Error testing login:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
    rl.close();
  }
}

function question(query) {
  return new Promise((resolve) => {
    rl.question(query, (answer) => {
      resolve(answer);
    });
  });
}

testLogin(); 