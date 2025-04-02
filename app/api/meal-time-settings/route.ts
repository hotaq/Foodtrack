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

// PUT endpoint to update meal time settings (admin only)
export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    // Check if user is authenticated
    if (!session || !session.user) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }
    
    // Check if user is an admin
    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: { role: true, name: true }
    });
    
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json(
        { message: "Forbidden: Admin access required" },
        { status: 403 }
      );
    }
    
    // Parse request body
    const body = await req.json();
    
    // Validate input
    const { breakfastStart, breakfastEnd, lunchStart, lunchEnd, dinnerStart, dinnerEnd } = body;
    
    if (
      typeof breakfastStart !== 'number' || 
      typeof breakfastEnd !== 'number' ||
      typeof lunchStart !== 'number' ||
      typeof lunchEnd !== 'number' ||
      typeof dinnerStart !== 'number' ||
      typeof dinnerEnd !== 'number'
    ) {
      return NextResponse.json(
        { message: "Invalid input: All times must be numbers" },
        { status: 400 }
      );
    }
    
    // Validate ranges (0-23)
    const timeFields = [breakfastStart, breakfastEnd, lunchStart, lunchEnd, dinnerStart, dinnerEnd];
    if (timeFields.some(time => time < 0 || time > 23)) {
      return NextResponse.json(
        { message: "Invalid input: Time values must be between 0 and 23" },
        { status: 400 }
      );
    }
    
    // Validate meal time ranges
    if (breakfastStart >= breakfastEnd) {
      return NextResponse.json(
        { message: "Breakfast end time must be after start time" },
        { status: 400 }
      );
    }
    
    if (lunchStart >= lunchEnd) {
      return NextResponse.json(
        { message: "Lunch end time must be after start time" },
        { status: 400 }
      );
    }
    
    if (dinnerStart >= dinnerEnd) {
      return NextResponse.json(
        { message: "Dinner end time must be after start time" },
        { status: 400 }
      );
    }
    
    // Find existing settings
    const existingSettings = await db.mealTimeSettings.findFirst();

    let timeUpdate = '';
    if (existingSettings) {
      // Format time changes for notification message
      const changes = [];
      if (breakfastStart !== existingSettings.breakfastStart || breakfastEnd !== existingSettings.breakfastEnd) {
        changes.push(`breakfast: ${formatTime(breakfastStart)}-${formatTime(breakfastEnd)}`);
      }
      if (lunchStart !== existingSettings.lunchStart || lunchEnd !== existingSettings.lunchEnd) {
        changes.push(`lunch: ${formatTime(lunchStart)}-${formatTime(lunchEnd)}`);
      }
      if (dinnerStart !== existingSettings.dinnerStart || dinnerEnd !== existingSettings.dinnerEnd) {
        changes.push(`dinner: ${formatTime(dinnerStart)}-${formatTime(dinnerEnd)}`);
      }
      
      if (changes.length > 0) {
        timeUpdate = `(${changes.join(', ')})`;
      }
    }
    
    let updatedSettings;
    
    if (existingSettings) {
      // Update existing settings
      updatedSettings = await db.mealTimeSettings.update({
        where: { id: existingSettings.id },
        data: {
          breakfastStart,
          breakfastEnd,
          lunchStart,
          lunchEnd,
          dinnerStart,
          dinnerEnd,
          updatedAt: new Date(),
          updatedBy: session.user.id
        }
      });
    } else {
      // Create new settings if none exist
      updatedSettings = await db.mealTimeSettings.create({
        data: {
          breakfastStart,
          breakfastEnd,
          lunchStart,
          lunchEnd,
          dinnerStart,
          dinnerEnd,
          updatedAt: new Date(),
          updatedBy: session.user.id
        }
      });
    }

    // Create a notification about the schedule change
    if (timeUpdate) {
      // Store this notification in the database to show to users on next login
      await db.notification.create({
        data: {
          title: "Meal Time Update",
          content: `Admin ${user.name} updated meal schedule ${timeUpdate}`,
          type: "SYSTEM",
          isRead: false,
          isGlobal: true,
          createdAt: new Date()
        }
      });
    }
    
    return NextResponse.json(updatedSettings, { status: 200 });
    
  } catch (error) {
    console.error("Error updating meal time settings:", error);
    return NextResponse.json(
      { message: "Failed to update meal time settings" },
      { status: 500 }
    );
  }
}

// Helper function to format time in 12-hour format
function formatTime(hour: number): string {
  const period = hour < 12 ? 'AM' : 'PM';
  const displayHour = hour % 12 || 12;
  return `${displayHour}${period}`;
} 