import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { hash } from "bcrypt";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { db } from "@/lib/db";

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
    // Check if user is authenticated and is an admin
    const session = await getServerSession(authOptions);
    if (!session || !session.user || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const userId = params.id;

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

    // Delete user's meals
    await db.meal.deleteMany({
      where: { userId },
    });

    // Delete user's streak
    await db.streak.deleteMany({
      where: { userId },
    });

    // Delete user
    await db.user.delete({
      where: { id: userId },
    });

    return NextResponse.json({
      message: "User deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting user:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 