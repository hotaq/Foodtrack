// This script resets an admin user's password
// Run with: node scripts/reset-admin-password.js

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const readline = require('readline');

const prisma = new PrismaClient();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

async function resetAdminPassword() {
  try {
    console.log('=== Reset Admin Password ===');
    
    // Get admin email
    const email = await question('Enter admin email: ');
    const newPassword = await question('Enter new password: ');
    
    if (!email || !newPassword) {
      console.error('Email and new password are required');
      process.exit(1);
    }
    
    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { email },
    });
    
    if (!user) {
      console.error(`User with email ${email} not found`);
      process.exit(1);
    }
    
    if (user.role !== 'ADMIN') {
      console.error(`User ${email} is not an admin`);
      process.exit(1);
    }
    
    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    // Update user password
    await prisma.user.update({
      where: { email },
      data: {
        password: hashedPassword,
      },
    });
    
    console.log(`Password reset successful for admin: ${email}`);
    process.exit(0);
  } catch (error) {
    console.error('Error resetting admin password:', error);
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

resetAdminPassword(); 