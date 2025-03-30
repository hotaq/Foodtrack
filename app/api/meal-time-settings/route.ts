import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

// GET endpoint to retrieve meal time settings for all authenticated users
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    // Check if user is authenticated
    if (!session || !session.user) {
      return NextResponse.json(
        { message: "Please sign in to view meal time settings" },
        { status: 401 }
      );
    }

    // Get the settings from the database
    const settings = await db.mealTimeSettings.findFirst();
    
    // If settings exist in the database, return them
    if (settings) {
      return NextResponse.json(settings, { status: 200 });
    }
    
    // Otherwise return default settings
    return NextResponse.json({
      id: "default",
      breakfastStart: 6,
      breakfastEnd: 9,
      lunchStart: 12,
      lunchEnd: 15,
      dinnerStart: 16, 
      dinnerEnd: 20,
      updatedAt: new Date(),
      updatedBy: null
    }, { status: 200 });
    
  } catch (error) {
    console.error("Error fetching meal time settings:", error);
    return NextResponse.json(
      { message: "Failed to fetch meal time settings" },
      { status: 500 }
    );
  }
} 