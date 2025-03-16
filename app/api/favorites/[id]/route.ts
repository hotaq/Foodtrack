import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

// DELETE /api/favorites/[id] - Remove a meal from favorites
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    const mealId = params.id;

    // Check if favorite exists
    const favorite = await db.favorite.findUnique({
      where: {
        userId_mealId: {
          userId: session.user.id,
          mealId,
        },
      },
    });

    if (!favorite) {
      return NextResponse.json(
        { message: "Favorite not found" },
        { status: 404 }
      );
    }

    // Remove from favorites
    await db.favorite.delete({
      where: {
        userId_mealId: {
          userId: session.user.id,
          mealId,
        },
      },
    });

    return NextResponse.json(
      { message: "Removed from favorites" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error removing from favorites:", error);
    return NextResponse.json(
      { message: "Something went wrong" },
      { status: 500 }
    );
  }
} 