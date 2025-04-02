import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { hash } from "bcrypt";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

// GET /api/admin/users/[id] - Get user details
export async function GET(
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

    // Get basic user data
    const user = await db.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Get related data with separate queries to avoid Prisma schema issues
    const streak = await db.streak.findFirst({
      where: { userId }
    });
    
    const score = await db.score.findFirst({
      where: { userId }
    });
    
    const mealCount = await db.meal.count({
      where: { userId }
    });
    
    // Try to get completed quests count, handling potential schema differences
    let completedQuestsCount = 0;
    try {
      // First try with userQuest if that relation exists
      completedQuestsCount = await db.userQuest.count({
        where: { 
          userId,
          isCompleted: true
        }
      });
    } catch (error) {
      console.error("Error counting completed quests:", error);
      // Fallback to 0 if the relation doesn't exist
    }

    // Format the user data
    const userDetails = {
      id: user.id,
      name: user.name,
      email: user.email,
      image: user.image,
      role: user.role,
      status: user.status || "ACTIVE",
      isBanned: user.isBanned || false,
      currentStreak: streak?.currentStreak || 0,
      bestStreak: streak?.longestStreak || 0,
      score: score?.points || 0,
      mealCount,
      completedQuests: completedQuestsCount,
      createdAt: user.createdAt
    };

    return NextResponse.json(userDetails);
  } catch (error) {
    console.error("Error fetching user details:", error);
    return NextResponse.json(
      { error: "Failed to fetch user details" },
      { status: 500 }
    );
  }
}

// PUT /api/admin/users/[id] - Update user details
export async function PUT(
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
    const {
      name,
      email,
      password,
      currentStreak,
      bestStreak,
      score,
      status,
      role
    } = await req.json();

    // Get the user
    const user = await db.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Prepare data for update
    const updateData: {
      name: string;
      email: string;
      role: string;
      status: string;
      password?: string;
    } = {
      name,
      email,
      role,
      status,
    };

    // Only update password if provided
    if (password) {
      updateData.password = await hash(password, 10);
    }

    // Get or create user streak to update
    const userStreak = await db.streak.findFirst({
      where: { userId }
    });

    if (userStreak) {
      // Update existing streak
      await db.streak.update({
        where: { id: userStreak.id },
        data: {
          currentStreak,
          longestStreak: bestStreak
        }
      });
    } else {
      // Create new streak record if none exists
      await db.streak.create({
        data: {
          userId,
          currentStreak,
          longestStreak: bestStreak
        }
      });
    }

    // Update score if provided
    if (typeof score === 'number') {
      const userScore = await db.score.findFirst({
        where: { userId }
      });

      if (userScore) {
        await db.score.update({
          where: { id: userScore.id },
          data: { points: score }
        });
      } else {
        await db.score.create({
          data: {
            userId,
            points: score
          }
        });
      }
    }

    // Update user
    const updatedUser = await db.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        isBanned: true,
      },
    });

    return NextResponse.json({
      message: "User updated successfully",
      user: updatedUser
    });
  } catch (error) {
    console.error("Error updating user:", error);
    return NextResponse.json(
      { error: "Failed to update user: " + (error instanceof Error ? error.message : "Unknown error") },
      { status: 500 }
    );
  }
}

// PATCH /api/admin/users/[id] - Update user (ban/unban or reset password)
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
    const { action, newPassword, isBanned } = await req.json();

    // Get the user
    const user = await db.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Handle different actions
    if (action === "ban") {
      // Update user's banned status
      const updatedUser = await db.user.update({
        where: { id: userId },
        data: { 
          isBanned: isBanned 
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          isBanned: true,
        },
      });

      return NextResponse.json(updatedUser);
    } 
    else if (action === "resetPassword") {
      // Hash the new password
      const hashedPassword = await hash(newPassword, 10);

      // Update user's password
      const updatedUser = await db.user.update({
        where: { id: userId },
        data: { 
          password: hashedPassword 
        },
        select: {
          id: true,
          name: true,
          email: true,
        },
      });

      return NextResponse.json({
        message: "Password reset successfully",
        user: updatedUser,
      });
    }

    return NextResponse.json(
      { error: "Invalid action" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Error updating user:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/users/[id] - Delete a user
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    // Check if user is authenticated and is an admin
    if (!session || !session.user || session.user.role !== "ADMIN") {
      return new NextResponse("Unauthorized", { status: 403 });
    }

    const userId = params.id;

    // Check if user exists
    const user = await db.user.findUnique({
      where: {
        id: userId,
      },
    });

    if (!user) {
      return new NextResponse("User not found", { status: 404 });
    }

    // Check if trying to delete an admin account
    if (user.role === "ADMIN") {
      return new NextResponse("Cannot delete admin accounts", { status: 403 });
    }

    // Delete user's streak
    await db.streak.deleteMany({
      where: {
        userId: userId,
      },
    });

    // Delete user's meals
    await db.meal.deleteMany({
      where: {
        userId: userId,
      },
    });

    // Delete the user
    await db.user.delete({
      where: {
        id: userId,
      },
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("[DELETE_USER_ERROR]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
} 