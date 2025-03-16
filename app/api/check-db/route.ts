import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    // Check database connection
    const databaseUrl = process.env.DATABASE_URL || "Not set";
    console.log("DATABASE_URL:", databaseUrl);
    
    // Try to query the database
    const userCount = await db.user.count();
    
    return NextResponse.json({
      status: "success",
      message: "Database connection successful",
      userCount,
      databaseUrl: databaseUrl.replace(/\/\/.*:.*@/, "//***:***@"), // Hide credentials
    });
  } catch (error) {
    console.error("Database connection error:", error);
    
    return NextResponse.json({
      status: "error",
      message: "Database connection failed",
      error: error instanceof Error ? error.message : String(error),
    }, { status: 500 });
  }
} 