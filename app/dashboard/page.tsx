import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import DashboardClient from "@/app/dashboard/dashboard-client";
import { authOptions } from "@/lib/auth";

interface MealType {
  type: string;
  id: string;
  imageUrl: string;
  imageKey: string;
  date: Date;
}

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session || !session.user || !session.user.id) {
    redirect("/login");
  }

  // Get user data with streak
  const user = await db.user.findUnique({
    where: {
      id: session.user.id,
    },
    include: {
      streak: true,
      meals: {
        where: {
          date: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
          },
        },
        orderBy: {
          date: "asc",
        },
      },
    },
  });

  if (!user) {
    redirect("/login");
  }

  // Check which meals have been submitted today
  const todaysMeals = {
    BREAKFAST: user.meals.find((meal: MealType) => meal.type === "BREAKFAST"),
    LUNCH: user.meals.find((meal: MealType) => meal.type === "LUNCH"),
    DINNER: user.meals.find((meal: MealType) => meal.type === "DINNER"),
  };

  return (
    <DashboardClient 
      user={user} 
      streak={user.streak} 
      todaysMeals={todaysMeals} 
    />
  );
} 