import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

// Add a meal to favorites
export async function POST(
  request: Request,
  { params }: { params: { mealId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user.id) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    const { mealId } = params;

    // Check if meal exists
    const meal = await db.meal.findUnique({
      where: { id: mealId },
    });

    if (!meal) {
      return NextResponse.json(
        { message: "Meal not found" },
        { status: 404 }
      );
    }

    // For now, we'll just return a success response
    // This will be updated once the Favorite model is properly set up
    return NextResponse.json(
      { message: "Added to favorites" },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error adding favorite:", error);
    return NextResponse.json(
      { message: "Something went wrong" },
      { status: 500 }
    );
  }
}

// Remove a meal from favorites
export async function DELETE(
  request: Request,
  { params }: { params: { mealId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user.id) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    // For now, we'll just return a success response
    // This will be updated once the Favorite model is properly set up
    return NextResponse.json(
      { message: "Removed from favorites" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error removing favorite:", error);
    return NextResponse.json(
      { message: "Something went wrong" },
      { status: 500 }
    );
  }
} 