import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  const session = await getServerSession(authOptions);
  
  if (!session || !session.user || session.user.role !== "ADMIN") {
    console.log("Admin User Growth API: Unauthorized access attempt");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  
  try {
    console.log(`Admin User Growth API: Fetching data`);
    
    // Get all users with their creation dates
    const users = await db.user.findMany({
      select: {
        createdAt: true,
      },
      orderBy: {
        createdAt: "asc",
      },
    });
    
    console.log(`Admin User Growth API: Found ${users.length} users total`);
    
    // Calculate date range for the last 30 days
    const today = new Date();
    today.setHours(23, 59, 59, 999); // End of today
    
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(today.getDate() - 29); // 30 days including today
    thirtyDaysAgo.setHours(0, 0, 0, 0); // Start of the day
    
    // Create a map to count users by day
    const usersByDay = new Map();
    
    // Initialize all days in the range with 0 users
    for (let i = 0; i < 30; i++) {
      const date = new Date(thirtyDaysAgo);
      date.setDate(thirtyDaysAgo.getDate() + i);
      const dateString = `${date.getMonth() + 1}/${date.getDate()}`;
      usersByDay.set(dateString, 0);
    }
    
    // Count cumulative users for each day
    let cumulativeCount = 0;
    
    // First, count users created before the 30-day window
    for (const user of users) {
      const userCreatedAt = new Date(user.createdAt);
      if (userCreatedAt < thirtyDaysAgo) {
        cumulativeCount++;
      }
    }
    
    // Then, count users within the 30-day window
    for (let i = 0; i < 30; i++) {
      const currentDate = new Date(thirtyDaysAgo);
      currentDate.setDate(thirtyDaysAgo.getDate() + i);
      
      // Set to end of the day
      const endOfDay = new Date(currentDate);
      endOfDay.setHours(23, 59, 59, 999);
      
      // Count users created on this day
      const usersCreatedOnDay = users.filter(user => {
        const userCreatedAt = new Date(user.createdAt);
        return userCreatedAt >= currentDate && userCreatedAt <= endOfDay;
      }).length;
      
      // Add to cumulative count
      cumulativeCount += usersCreatedOnDay;
      
      // Store in map
      const dateString = `${currentDate.getMonth() + 1}/${currentDate.getDate()}`;
      usersByDay.set(dateString, cumulativeCount);
    }
    
    // Convert map to array format for the chart
    const growthData = Array.from(usersByDay.entries()).map(([name, value]) => ({
      name,
      value,
    }));
    
    // Sort by date
    growthData.sort((a, b) => {
      const [aMonth, aDay] = a.name.split('/').map(Number);
      const [bMonth, bDay] = b.name.split('/').map(Number);
      
      if (aMonth !== bMonth) {
        return aMonth - bMonth;
      }
      return aDay - bDay;
    });
    
    console.log(`Admin User Growth API: Returning growth data with ${growthData.length} data points`);
    
    return NextResponse.json(growthData);
  } catch (error) {
    console.error("Error fetching user growth data:", error);
    return NextResponse.json({ error: "Failed to fetch user growth data" }, { status: 500 });
  }
} 