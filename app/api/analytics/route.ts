import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  const session = await getServerSession(authOptions);
  
  if (!session || !session.user) {
    console.log("Analytics API: Unauthorized access attempt");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  
  try {
    console.log(`Analytics API: Fetching data for user ${session.user.id}`);
    
    // Get meal counts by type for the user
    const mealsByType = await db.meal.groupBy({
      by: ["type"],
      where: {
        userId: session.user.id,
      },
      _count: {
        id: true,
      },
    });
    
    console.log("Analytics API: Meal counts by type:", mealsByType);
    
    // Get meal counts by day of week
    const meals = await db.meal.findMany({
      where: {
        userId: session.user.id,
      },
      select: {
        id: true,
        type: true,
        date: true,
      },
    });
    
    console.log(`Analytics API: Found ${meals.length} meals for user`);
    
    // Process meals by day of week
    const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const mealsByDay = dayNames.map(day => ({
      name: day,
      count: 0,
    }));
    
    meals.forEach(meal => {
      const dayOfWeek = new Date(meal.date).getDay();
      mealsByDay[dayOfWeek].count += 1;
    });
    
    // Process meals by type
    const mealCountByType = {
      BREAKFAST: 0,
      LUNCH: 0,
      DINNER: 0,
    };
    
    if (mealsByType && mealsByType.length > 0) {
      mealsByType.forEach(item => {
        if (item && item.type && item._count && item._count.id) {
          mealCountByType[item.type] = item._count.id;
        }
      });
    }
    
    console.log("Analytics API: Processed data:", { mealCountByType, mealsByDay });
    
    return NextResponse.json({
      mealCountByType,
      mealsByDay,
    });
  } catch (error) {
    console.error("Error fetching analytics data:", error);
    return NextResponse.json({ error: "Failed to fetch analytics data" }, { status: 500 });
  }
} 