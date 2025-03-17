import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

// PATCH /api/meals/[id] - Update a meal (e.g., food name)
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user.id) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    const { foodName } = await request.json();
    const mealId = params.id;

    // Find the meal
    const meal = await db.meal.findUnique({
      where: {
        id: mealId,
      },
    });

    // Check if meal exists
    if (!meal) {
      return NextResponse.json(
        { message: "Meal not found" },
        { status: 404 }
      );
    }

    // Check if user owns the meal
    if (meal.userId !== session.user.id && session.user.role !== "ADMIN") {
      return NextResponse.json(
        { message: "You don't have permission to update this meal" },
        { status: 403 }
      );
    }

    // Update the meal
    const updatedMeal = await db.meal.update({
      where: {
        id: mealId,
      },
      data: {
        foodName,
      },
    });

    return NextResponse.json(updatedMeal);
  } catch (error) {
    console.error("[UPDATE_MEAL_ERROR]", error);
    return NextResponse.json(
      { message: "Something went wrong" },
      { status: 500 }
    );
  }
}

// DELETE /api/meals/[id] - Delete a meal (admin only)
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user.id) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    const mealId = params.id;

    // Find the meal
    const meal = await db.meal.findUnique({
      where: {
        id: mealId,
      },
    });

    // Check if meal exists
    if (!meal) {
      return NextResponse.json(
        { message: "Meal not found" },
        { status: 404 }
      );
    }

    // Check if user is an admin or the owner of the meal
    if (meal.userId !== session.user.id && session.user.role !== "ADMIN") {
      return NextResponse.json(
        { message: "You don't have permission to delete this meal" },
        { status: 403 }
      );
    }

    // Delete the meal
    await db.meal.delete({
      where: {
        id: mealId,
      },
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("[DELETE_MEAL_ERROR]", error);
    return NextResponse.json(
      { message: "Something went wrong" },
      { status: 500 }
    );
  }
} 