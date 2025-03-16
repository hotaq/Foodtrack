import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

// Define a type for Meal
type Meal = {
  id: string;
  type: string;
  imageUrl: string;
  imageKey: string;
  date: Date;
  createdAt: Date;
  updatedAt: Date;
  userId: string;
};

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user.id) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    const { type, imageUrl, imageKey, isFood = true, foodName = null } = await req.json();

    // Validate input
    if (!type || !imageUrl || !imageKey) {
      return NextResponse.json(
        { message: "Missing required fields" },
        { status: 400 }
      );
    }

    // Validate that the image URL is from EdgeStore
    if (!imageUrl.includes('edgestore.dev')) {
      return NextResponse.json(
        { message: "Invalid image source" },
        { status: 400 }
      );
    }

    // Check if meal of this type already exists for today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const existingMeal = await db.meal.findFirst({
      where: {
        userId: session.user.id,
        type,
        date: {
          gte: today,
        },
      },
    });

    if (existingMeal) {
      return NextResponse.json(
        { message: `You have already uploaded a ${type.toLowerCase()} photo today` },
        { status: 409 }
      );
    }

    // Create meal with food verification data
    const meal = await db.meal.create({
      data: {
        type,
        imageUrl,
        imageKey,
        userId: session.user.id,
        ...(isFood !== undefined ? { isFood } : {}),
        ...(foodName ? { foodName } : {}),
      },
    });

    // Update streak
    await updateStreak(session.user.id);

    return NextResponse.json(
      { 
        message: "Meal saved successfully",
        meal
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Meal upload error:", error);
    return NextResponse.json(
      { message: "Something went wrong" },
      { status: 500 }
    );
  }
}

async function updateStreak(userId: string) {
  // Get user's streak
  const userWithStreak = await db.user.findUnique({
    where: {
      id: userId,
    },
    include: {
      streak: true,
      meals: {
        where: {
          date: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
          },
        },
      },
    },
  });

  if (!userWithStreak || !userWithStreak.streak) {
    return;
  }

  const { streak } = userWithStreak;
  const todaysMeals = userWithStreak.meals as Meal[];

  // Check if all three meals have been submitted today
  const hasBreakfast = todaysMeals.some(meal => meal.type === "BREAKFAST");
  const hasLunch = todaysMeals.some(meal => meal.type === "LUNCH");
  const hasDinner = todaysMeals.some(meal => meal.type === "DINNER");
  
  const allMealsSubmitted = hasBreakfast && hasLunch && hasDinner;
  
  if (allMealsSubmitted) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    let { currentStreak, longestStreak, lastMealDate } = streak;
    
    // If last meal date was yesterday, increment streak
    if (lastMealDate) {
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      yesterday.setHours(0, 0, 0, 0);
      
      const lastMealDay = new Date(lastMealDate);
      lastMealDay.setHours(0, 0, 0, 0);
      
      if (lastMealDay.getTime() === yesterday.getTime()) {
        currentStreak += 1;
        
        if (currentStreak > longestStreak) {
          longestStreak = currentStreak;
        }
      } else if (lastMealDay.getTime() !== today.getTime()) {
        // If last meal date was not yesterday and not today, reset streak
        currentStreak = 1;
      }
    } else {
      // First time submitting all meals
      currentStreak = 1;
      
      if (currentStreak > longestStreak) {
        longestStreak = currentStreak;
      }
    }
    
    // Update streak
    await db.streak.update({
      where: {
        userId,
      },
      data: {
        currentStreak,
        longestStreak,
        lastMealDate: today,
      },
    });
  }
} 