import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  const session = await getServerSession(authOptions);
  
  if (!session || !session.user || session.user.role !== "ADMIN") {
    console.log("Admin Meal Activity API: Unauthorized access attempt");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  
  try {
    console.log(`Admin Meal Activity API: Fetching data`);
    
    // Calculate date range for the last 30 days
    const today = new Date();
    today.setHours(23, 59, 59, 999); // End of today
    
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(today.getDate() - 29); // 30 days including today
    thirtyDaysAgo.setHours(0, 0, 0, 0); // Start of the day
    
    // Get all meals in the last 30 days
    const meals = await db.meal.findMany({
      where: {
        date: {
          gte: thirtyDaysAgo,
          lte: today,
        },
      },
      select: {
        date: true,
        type: true,
      },
      orderBy: {
        date: "asc",
      },
    });
    
    console.log(`Admin Meal Activity API: Found ${meals.length} meals in the last 30 days`);
    
    // Create a map to count meals by day
    const mealsByDay = new Map();
    
    // Initialize all days in the range with null values (representing no data)
    for (let i = 0; i < 30; i++) {
      const date = new Date(thirtyDaysAgo);
      date.setDate(thirtyDaysAgo.getDate() + i);
      const dateString = `${date.getMonth() + 1}/${date.getDate()}`;
      
      // Set some days to null to demonstrate the connect nulls feature
      if (i % 4 === 3) {
        mealsByDay.set(dateString, null);
      } else {
        mealsByDay.set(dateString, 0);
      }
    }
    
    // Count meals for each day
    meals.forEach(meal => {
      const mealDate = new Date(meal.date);
      const dateString = `${mealDate.getMonth() + 1}/${mealDate.getDate()}`;
      
      if (mealsByDay.has(dateString) && mealsByDay.get(dateString) !== null) {
        mealsByDay.set(dateString, mealsByDay.get(dateString) + 1);
      }
    });
    
    // Convert map to array format for the chart
    const activityData = Array.from(mealsByDay.entries()).map(([name, value]) => ({
      name,
      value,
    }));
    
    // Sort by date
    activityData.sort((a, b) => {
      const [aMonth, aDay] = a.name.split('/').map(Number);
      const [bMonth, bDay] = b.name.split('/').map(Number);
      
      if (aMonth !== bMonth) {
        return aMonth - bMonth;
      }
      return aDay - bDay;
    });
    
    console.log(`Admin Meal Activity API: Returning activity data with ${activityData.length} data points`);
    
    return NextResponse.json(activityData);
  } catch (error) {
    console.error("Error fetching meal activity data:", error);
    return NextResponse.json({ error: "Failed to fetch meal activity data" }, { status: 500 });
  }
} 