// This script resets a user's password
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function resetPassword(emailOrUsername, newPassword) {
  try {
    // Check if input is email or username
    const isEmail = emailOrUsername.includes('@');
    
    // Find user by email or name (username)
    const user = await prisma.user.findFirst({
      where: isEmail 
        ? { email: emailOrUsername }
        : { name: emailOrUsername },
    });

    if (!user) {
      console.log("User not found");
      return false;
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    // Update the user's password
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword },
    });
    
    console.log("Password updated successfully");
    return true;
  } catch (error) {
    console.error("Error resetting password:", error);
    return false;
  } finally {
    await prisma.$disconnect();
  }
}

async function main() {
  // Replace with the user's email or username and the new password
  const emailOrUsername = "hootoo"; // or use an email
  const newPassword = "newpassword123"; // replace with the desired password
  
  console.log(`Resetting password for: ${emailOrUsername}`);
  const success = await resetPassword(emailOrUsername, newPassword);
  
  if (success) {
    console.log("Password reset successful!");
  } else {
    console.log("Password reset failed!");
  }
}

main(); 