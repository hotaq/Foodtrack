import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  const session = await getServerSession(authOptions);
  
  if (!session || !session.user) {
    console.log("Weekly Pattern API: Unauthorized access attempt");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  
  try {
    console.log(`Weekly Pattern API: Fetching data for user ${session.user.id}`);
    
    // Get all meals for the user
    const meals = await db.meal.findMany({
      where: {
        userId: session.user.id,
      },
      select: {
        type: true,
        date: true,
      },
      orderBy: {
        date: "asc",
      },
    });
    
    console.log(`Weekly Pattern API: Found ${meals.length} meals total`);
    
    // Create a map to count meals by hour of day
    const mealsByHour = new Map();
    
    // Initialize hours with null values (representing no data)
    for (let i = 0; i < 24; i++) {
      mealsByHour.set(i, null);
    }
    
    // Count meals by hour
    meals.forEach(meal => {
      const mealDate = new Date(meal.date);
      const hour = mealDate.getHours();
      
      // If we already have a value, increment it, otherwise set to 1
      if (mealsByHour.get(hour) !== null) {
        mealsByHour.set(hour, mealsByHour.get(hour) + 1);
      } else {
        mealsByHour.set(hour, 1);
      }
    });
    
    // Convert map to array format for the chart
    const hourlyData = Array.from(mealsByHour.entries()).map(([hour, count]) => ({
      name: `${hour}:00`,
      value: count,
    }));
    
    // Sort by hour
    hourlyData.sort((a, b) => {
      return parseInt(a.name) - parseInt(b.name);
    });
    
    console.log(`Weekly Pattern API: Returning hourly data with ${hourlyData.length} data points`);
    
    return NextResponse.json(hourlyData);
  } catch (error) {
    console.error("Error fetching weekly pattern data:", error);
    return NextResponse.json({ error: "Failed to fetch weekly pattern data" }, { status: 500 });
  }
} 