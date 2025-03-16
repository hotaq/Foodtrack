import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

// PATCH /api/admin/users/[id]/streak - Update user streak
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check if user is authenticated and is an admin
    const session = await getServerSession(authOptions);
    if (!session || !session.user || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const userId = params.id;
    const { currentStreak, longestStreak } = await req.json();

    // Get the user
    const user = await db.user.findUnique({
      where: { id: userId },
      include: { streak: true }
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    let streak;
    
    // If user has no streak record, create one
    if (!user.streak) {
      streak = await db.streak.create({
        data: {
          userId,
          currentStreak: currentStreak || 0,
          longestStreak: longestStreak || 0,
          lastMealDate: new Date(),
        }
      });
    } else {
      // Update existing streak
      streak = await db.streak.update({
        where: { id: user.streak.id },
        data: {
          currentStreak: currentStreak !== undefined ? currentStreak : user.streak.currentStreak,
          longestStreak: longestStreak !== undefined ? longestStreak : user.streak.longestStreak,
          lastMealDate: new Date(),
        }
      });
    }

    return NextResponse.json({
      message: "Streak updated successfully",
      streak
    });
  } catch (error) {
    console.error("Error updating streak:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 