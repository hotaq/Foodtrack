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

    // Check if already favorited using raw SQL
    const existingFavorites = await db.$queryRaw`
      SELECT * FROM "Favorite" 
      WHERE "userId" = ${session.user.id} AND "mealId" = ${mealId}
    `;

    if (Array.isArray(existingFavorites) && existingFavorites.length > 0) {
      return NextResponse.json(
        { message: "Meal already in favorites" },
        { status: 409 }
      );
    }

    // Add to favorites using raw SQL
    await db.$executeRaw`
      INSERT INTO "Favorite" ("id", "userId", "mealId", "createdAt")
      VALUES (gen_random_uuid(), ${session.user.id}, ${mealId}, NOW())
    `;

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

    const { mealId } = params;

    // Check if the favorite exists using raw SQL
    const favorites = await db.$queryRaw`
      SELECT * FROM "Favorite" 
      WHERE "userId" = ${session.user.id} AND "mealId" = ${mealId}
    `;

    if (!Array.isArray(favorites) || favorites.length === 0) {
      return NextResponse.json(
        { message: "Favorite not found" },
        { status: 404 }
      );
    }

    // Remove from favorites using raw SQL
    await db.$executeRaw`
      DELETE FROM "Favorite" 
      WHERE "userId" = ${session.user.id} AND "mealId" = ${mealId}
    `;

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