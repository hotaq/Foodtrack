import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// This function will check all users and reset streaks if they missed a day
export async function GET() {
  try {
    // Get all users with their streaks
    const usersWithStreaks = await db.user.findMany({
      where: {
        streak: {
          isNot: null
        }
      },
      include: {
        streak: true
      }
    });

    const now = new Date();
    const updates = [];

    // Check each user's streak and reset if needed
    for (const user of usersWithStreaks) {
      if (!user.streak || !user.streak.lastMealDate) continue;

      const lastMealDate = new Date(user.streak.lastMealDate);
      
      // Calculate days difference
      const timeDiff = now.getTime() - lastMealDate.getTime();
      const daysDiff = Math.floor(timeDiff / (1000 * 3600 * 24));

      // If more than 1 day has passed since the last meal, reset streak to 0
      if (daysDiff > 1) {
        updates.push(
          db.streak.update({
            where: {
              userId: user.id
            },
            data: {
              currentStreak: 0
            }
          })
        );
      }
    }

    // Execute all updates in parallel
    if (updates.length > 0) {
      await Promise.all(updates);
    }

    return NextResponse.json({
      message: "Streaks updated successfully",
      resetsPerformed: updates.length
    });
    
  } catch (error) {
    console.error("Error updating streaks:", error);
    return NextResponse.json(
      { message: "Error updating streaks" },
      { status: 500 }
    );
  }
} 