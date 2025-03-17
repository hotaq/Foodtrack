import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  const session = await getServerSession(authOptions);
  
  if (!session || !session.user) {
    console.log("Meal Trend API: Unauthorized access attempt");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  
  try {
    console.log(`Meal Trend API: Fetching data for user ${session.user.id}`);
    
    // Calculate date range for the last 30 days
    const today = new Date();
    today.setHours(23, 59, 59, 999); // End of today
    
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(today.getDate() - 29); // 30 days including today
    thirtyDaysAgo.setHours(0, 0, 0, 0); // Start of the day
    
    console.log(`Meal Trend API: Date range from ${thirtyDaysAgo.toISOString()} to ${today.toISOString()}`);
    
    // Get all meals for the user in the last 30 days
    const meals = await db.meal.findMany({
      where: {
        userId: session.user.id,
        date: {
          gte: thirtyDaysAgo,
          lte: today,
        },
      },
      select: {
        date: true,
      },
      orderBy: {
        date: "asc",
      },
    });
    
    console.log(`Meal Trend API: Found ${meals.length} meals in the last 30 days`);
    
    // Create a map to count meals per day
    const mealCountByDay = new Map();
    
    // Initialize all days in the range with 0 meals
    for (let i = 0; i < 30; i++) {
      const date = new Date(thirtyDaysAgo);
      date.setDate(thirtyDaysAgo.getDate() + i);
      const dateString = `${date.getMonth() + 1}/${date.getDate()}`;
      mealCountByDay.set(dateString, 0);
    }
    
    // Count meals for each day
    meals.forEach(meal => {
      const mealDate = new Date(meal.date);
      const dateString = `${mealDate.getMonth() + 1}/${mealDate.getDate()}`;
      
      if (mealCountByDay.has(dateString)) {
        mealCountByDay.set(dateString, mealCountByDay.get(dateString) + 1);
      }
    });
    
    // Convert map to array format for the chart
    const trendData = Array.from(mealCountByDay.entries()).map(([name, value]) => ({
      name,
      value,
    }));
    
    // Sort by date
    trendData.sort((a, b) => {
      const [aMonth, aDay] = a.name.split('/').map(Number);
      const [bMonth, bDay] = b.name.split('/').map(Number);
      
      if (aMonth !== bMonth) {
        return aMonth - bMonth;
      }
      return aDay - bDay;
    });
    
    console.log(`Meal Trend API: Returning trend data with ${trendData.length} data points`);
    
    return NextResponse.json(trendData);
  } catch (error) {
    console.error("Error fetching meal trend data:", error);
    return NextResponse.json({ error: "Failed to fetch meal trend data" }, { status: 500 });
  }
} 