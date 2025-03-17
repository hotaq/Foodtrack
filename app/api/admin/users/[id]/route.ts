import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { hash } from "bcrypt";
import { authOptions } from "@/lib/auth";
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