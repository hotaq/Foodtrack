// This script creates the database schema directly without using Prisma migrations
const { Client } = require('pg');

// Database URL
const DATABASE_URL = "postgresql://neondb_owner:npg_HL4UfuYA8lpJ@ep-super-breeze-a1ggrbbp-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require";

// Create a PostgreSQL client
const client = new Client({
  connectionString: DATABASE_URL,
});

// Function to create enum type if it doesn't exist
async function createEnumIfNotExists(enumName, values) {
  try {
    // Check if enum type exists
    const checkEnum = await client.query(`
      SELECT EXISTS (
        SELECT 1 FROM pg_type WHERE typname = $1
      )
    `, [enumName]);
    
    if (!checkEnum.rows[0].exists) {
      console.log(`Creating enum type ${enumName}...`);
      await client.query(`CREATE TYPE "${enumName}" AS ENUM (${values.map(v => `'${v}'`).join(', ')})`);
    }
  } catch (error) {
    console.error(`Error creating enum ${enumName}:`, error);
    throw error;
  }
}

async function main() {
  try {
    console.log('Connecting to database...');
    await client.connect();
    
    console.log('Creating enum types...');
    await createEnumIfNotExists('Role', ['USER', 'ADMIN']);
    await createEnumIfNotExists('UserStatus', ['ACTIVE', 'BANNED']);
    await createEnumIfNotExists('MealType', ['BREAKFAST', 'LUNCH', 'DINNER']);
    
    console.log('Creating User table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS "User" (
        "id" TEXT PRIMARY KEY,
        "name" TEXT UNIQUE NOT NULL,
        "email" TEXT UNIQUE NOT NULL,
        "emailVerified" TIMESTAMP,
        "password" TEXT,
        "image" TEXT,
        "role" "Role" NOT NULL DEFAULT 'USER',
        "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE',
        "banReason" TEXT,
        "banDate" TIMESTAMP,
        "isBanned" BOOLEAN NOT NULL DEFAULT false,
        "resetToken" TEXT,
        "resetTokenExpiry" TIMESTAMP,
        "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP NOT NULL
      )
    `);
    
    console.log('Creating Account table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS "Account" (
        "id" TEXT PRIMARY KEY,
        "userId" TEXT NOT NULL,
        "type" TEXT NOT NULL,
        "provider" TEXT NOT NULL,
        "providerAccountId" TEXT NOT NULL,
        "refresh_token" TEXT,
        "access_token" TEXT,
        "expires_at" INTEGER,
        "token_type" TEXT,
        "scope" TEXT,
        "id_token" TEXT,
        "session_state" TEXT,
        UNIQUE("provider", "providerAccountId"),
        FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE
      )
    `);
    
    console.log('Creating Session table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS "Session" (
        "id" TEXT PRIMARY KEY,
        "sessionToken" TEXT UNIQUE NOT NULL,
        "userId" TEXT NOT NULL,
        "expires" TIMESTAMP NOT NULL,
        FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE
      )
    `);
    
    console.log('Creating VerificationToken table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS "VerificationToken" (
        "identifier" TEXT NOT NULL,
        "token" TEXT UNIQUE NOT NULL,
        "expires" TIMESTAMP NOT NULL,
        UNIQUE("identifier", "token")
      )
    `);
    
    console.log('Creating Meal table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS "Meal" (
        "id" TEXT PRIMARY KEY,
        "type" "MealType" NOT NULL,
        "imageUrl" TEXT NOT NULL,
        "imageKey" TEXT NOT NULL,
        "date" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP NOT NULL,
        "isFood" BOOLEAN NOT NULL DEFAULT true,
        "foodName" TEXT,
        "userId" TEXT NOT NULL,
        FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE
      )
    `);
    
    console.log('Creating Streak table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS "Streak" (
        "id" TEXT PRIMARY KEY,
        "currentStreak" INTEGER NOT NULL DEFAULT 0,
        "longestStreak" INTEGER NOT NULL DEFAULT 0,
        "lastMealDate" TIMESTAMP,
        "userId" TEXT UNIQUE NOT NULL,
        FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE
      )
    `);
    
    console.log('Creating Favorite table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS "Favorite" (
        "id" TEXT PRIMARY KEY,
        "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "userId" TEXT NOT NULL,
        "mealId" TEXT NOT NULL,
        UNIQUE("userId", "mealId"),
        FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE,
        FOREIGN KEY ("mealId") REFERENCES "Meal"("id") ON DELETE CASCADE
      )
    `);
    
    console.log('Schema created successfully!');
  } catch (error) {
    console.error('Error creating schema:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

main(); 