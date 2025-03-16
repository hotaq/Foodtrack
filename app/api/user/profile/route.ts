import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export async function PATCH(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    const { name, image } = await req.json();

    // Validate input
    if (!name) {
      return NextResponse.json(
        { message: "Username is required" },
        { status: 400 }
      );
    }

    // Check if username is already taken by another user
    if (name !== session.user.name) {
      const existingUser = await db.user.findUnique({
        where: {
          name,
        },
      });

      if (existingUser && existingUser.id !== session.user.id) {
        return NextResponse.json(
          { message: "Username is already taken" },
          { status: 409 }
        );
      }
    }

    // Update user profile
    const updatedUser = await db.user.update({
      where: {
        id: session.user.id,
      },
      data: {
        name,
        image,
      },
    });

    return NextResponse.json({
      message: "Profile updated successfully",
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        image: updatedUser.image,
      },
    });
  } catch (error) {
    console.error("Error updating profile:", error);
    return NextResponse.json(
      { message: "Something went wrong" },
      { status: 500 }
    );
  }
} 