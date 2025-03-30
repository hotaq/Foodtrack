import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

// GET endpoint to retrieve meal time settings
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    // Check if user is authenticated (any role can view settings)
    if (!session || !session.user) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get the settings (or create default settings if none exist)
    let settings = await db.mealTimeSettings.findFirst();
    
    if (!settings) {
      // Only admins can create settings
      if (session.user.role !== "ADMIN") {
        // Return default settings for non-admin users if no settings exist
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
      }
      
      // Admin creates settings
      settings = await db.mealTimeSettings.create({
        data: {
          // Default values are already set in the schema
        }
      });
    }

    return NextResponse.json(settings, { status: 200 });
  } catch (error) {
    console.error("Error fetching meal time settings:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

// PUT endpoint to update meal time settings - admin only
export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    // Check if user is authenticated and an admin
    if (!session || !session.user || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { message: "Unauthorized - Only admins can update meal time settings" },
        { status: 401 }
      );
    }

    const {
      breakfastStart,
      breakfastEnd,
      lunchStart,
      lunchEnd,
      dinnerStart,
      dinnerEnd
    } = await req.json();

    // Validate input
    if (
      typeof breakfastStart !== 'number' ||
      typeof breakfastEnd !== 'number' ||
      typeof lunchStart !== 'number' ||
      typeof lunchEnd !== 'number' ||
      typeof dinnerStart !== 'number' ||
      typeof dinnerEnd !== 'number'
    ) {
      return NextResponse.json(
        { message: "Invalid input. All values must be numbers representing hours in 24h format." },
        { status: 400 }
      );
    }

    // Validate ranges
    if (
      breakfastStart < 0 || breakfastStart > 23 ||
      breakfastEnd < 0 || breakfastEnd > 23 ||
      lunchStart < 0 || lunchStart > 23 ||
      lunchEnd < 0 || lunchEnd > 23 ||
      dinnerStart < 0 || dinnerStart > 23 ||
      dinnerEnd < 0 || dinnerEnd > 23
    ) {
      return NextResponse.json(
        { message: "Invalid hour values. Hours must be between 0 and 23." },
        { status: 400 }
      );
    }

    // Validate meal time order
    if (
      breakfastStart >= breakfastEnd ||
      lunchStart >= lunchEnd ||
      dinnerStart >= dinnerEnd
    ) {
      return NextResponse.json(
        { message: "Start time must be before end time for each meal." },
        { status: 400 }
      );
    }

    // Get existing settings or create new ones
    const existingSettings = await db.mealTimeSettings.findFirst();
    
    // Update or create settings
    let settings;
    if (existingSettings) {
      settings = await db.mealTimeSettings.update({
        where: {
          id: existingSettings.id
        },
        data: {
          breakfastStart,
          breakfastEnd,
          lunchStart,
          lunchEnd,
          dinnerStart,
          dinnerEnd,
          updatedBy: session.user.id
        }
      });
    } else {
      settings = await db.mealTimeSettings.create({
        data: {
          breakfastStart,
          breakfastEnd,
          lunchStart,
          lunchEnd,
          dinnerStart,
          dinnerEnd,
          updatedBy: session.user.id
        }
      });
    }

    return NextResponse.json(
      { 
        message: "Meal time settings updated successfully",
        settings
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error updating meal time settings:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
} 