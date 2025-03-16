// This script tests the NextAuth credentials provider directly
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

// Mock the authorize function from auth.ts
async function authorizeUser(credentials) {
  try {
    if (!credentials?.emailOrUsername || !credentials?.password) {
      console.log("Missing credentials");
      return null;
    }

    // Check if input is email or username
    const isEmail = credentials.emailOrUsername.includes('@');
    
    console.log(`Attempting to find user by ${isEmail ? 'email' : 'username'}: ${credentials.emailOrUsername}`);
    
    // Find user by email or name (username)
    const user = await prisma.user.findFirst({
      where: isEmail 
        ? { email: credentials.emailOrUsername }
        : { name: credentials.emailOrUsername },
    });

    if (!user) {
      console.log("User not found");
      return null;
    }

    if (!user.password) {
      console.log("User has no password (OAuth account)");
      return null;
    }

    // Check if user is banned
    if (user.status === 'BANNED' || user.isBanned) {
      console.log("User is banned");
      return null;
    }

    console.log("Comparing passwords");
    console.log("Input password:", credentials.password);
    console.log("Stored password hash:", user.password);
    
    const isPasswordValid = await bcrypt.compare(credentials.password, user.password);
    console.log("Password comparison result:", isPasswordValid);

    if (!isPasswordValid) {
      console.log("Invalid password");
      return null;
    }

    console.log("Authentication successful");
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      image: user.image,
      role: user.role,
    };
  } catch (error) {
    console.error("Error in authorize function:", error);
    return null;
  }
}

async function main() {
  try {
    // Test with a real user from your database
    // Replace with actual credentials
    const testCredentials = {
      emailOrUsername: "hootoo", // or use an email
      password: "newpassword123" // using the new password
    };
    
    console.log(`Testing authentication for: ${testCredentials.emailOrUsername}`);
    const result = await authorizeUser(testCredentials);
    
    if (result) {
      console.log("Authentication successful!");
      console.log("User:", result);
    } else {
      console.log("Authentication failed!");
    }
  } catch (error) {
    console.error("Error testing authentication:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main(); 