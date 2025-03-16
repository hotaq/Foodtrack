import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

// GET /api/favorites - Get all favorites for the current user
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    try {
      // Try to use the Prisma client directly
      const favorites = await db.favorite.findMany({
        where: {
          userId: session.user.id,
        },
        include: {
          meal: {
            include: {
              user: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      return NextResponse.json(favorites);
    } catch (prismaError) {
      console.error("Prisma error:", prismaError);
      
      // Fallback to raw SQL if Prisma client fails
      const favorites = await db.$queryRaw`
        SELECT f.id as "favoriteId", f."createdAt" as "favoriteCreatedAt", 
               m.id as "mealId", m.type, m."imageUrl", m.date, m."isFood", m."foodName",
               u.id as "userId", u.name as "userName", u.image as "userImage"
        FROM "Favorite" f
        JOIN "Meal" m ON f."mealId" = m.id
        JOIN "User" u ON m."userId" = u.id
        WHERE f."userId" = ${session.user.id}
        ORDER BY f."createdAt" DESC
      `;

      // Transform the raw data into a structured format
      const formattedFavorites = Array.isArray(favorites) ? favorites.map((fav: any) => ({
        id: fav.favoriteId,
        createdAt: fav.favoriteCreatedAt,
        userId: session.user.id,
        mealId: fav.mealId,
        meal: {
          id: fav.mealId,
          type: fav.type,
          imageUrl: fav.imageUrl,
          date: fav.date,
          isFood: fav.isFood,
          foodName: fav.foodName,
          user: {
            id: fav.userId,
            name: fav.userName,
            image: fav.userImage,
          }
        }
      })) : [];

      return NextResponse.json(formattedFavorites);
    }
  } catch (error) {
    console.error("Error fetching favorites:", error);
    return NextResponse.json(
      { message: "Something went wrong" },
      { status: 500 }
    );
  }
}

// POST /api/favorites - Add a meal to favorites
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    const { mealId } = await req.json();

    if (!mealId) {
      return NextResponse.json(
        { message: "Meal ID is required" },
        { status: 400 }
      );
    }

    // Check if meal exists
    const meal = await db.meal.findUnique({
      where: {
        id: mealId,
      },
    });

    if (!meal) {
      return NextResponse.json(
        { message: "Meal not found" },
        { status: 404 }
      );
    }

    try {
      // Try to use Prisma client directly
      // Check if already favorited
      const existingFavorite = await db.favorite.findUnique({
        where: {
          userId_mealId: {
            userId: session.user.id,
            mealId,
          },
        },
      });

      if (existingFavorite) {
        return NextResponse.json(
          { message: "Meal already in favorites" },
          { status: 409 }
        );
      }

      // Add to favorites
      const favorite = await db.favorite.create({
        data: {
          userId: session.user.id,
          mealId,
        },
      });

      return NextResponse.json(
        { message: "Added to favorites", favorite },
        { status: 201 }
      );
    } catch (prismaError) {
      console.error("Prisma error:", prismaError);
      
      // Fallback to raw SQL if Prisma client fails
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
    }
  } catch (error) {
    console.error("Error adding to favorites:", error);
    return NextResponse.json(
      { message: "Something went wrong" },
      { status: 500 }
    );
  }
} 