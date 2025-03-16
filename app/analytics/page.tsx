import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import AnalyticsClient from "./analytics-client";

export default async function AnalyticsPage() {
  const session = await getServerSession(authOptions);
  
  if (!session || !session.user) {
    redirect("/login");
  }
  
  // Get user data
  const user = await db.user.findUnique({
    where: {
      id: session.user.id,
    },
    include: {
      streak: true,
    },
  });
  
  if (!user) {
    redirect("/login");
  }
  
  // Get meal counts by type for the user
  const mealsByType = await db.meal.groupBy({
    by: ["type"],
    where: {
      userId: user.id,
    },
    _count: {
      id: true,
    },
  });
  
  // Get meal counts by day of week
  const meals = await db.meal.findMany({
    where: {
      userId: user.id,
    },
    select: {
      id: true,
      type: true,
      date: true,
    },
  });
  
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
  
  mealsByType.forEach(item => {
    mealCountByType[item.type] = item._count.id;
  });
  
  return (
    <AnalyticsClient 
      user={user} 
      mealCountByType={mealCountByType} 
      mealsByDay={mealsByDay} 
    />
  );
} 