import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import AdminDashboard from "./admin-dashboard";

// Define a type for the meal group result
type MealGroupResult = {
  type: string;
  _count: {
    id: number;
  };
};

export default async function AdminPage() {
  const session = await getServerSession(authOptions);

  // Check if user is authenticated and has admin role
  if (!session || !session.user || session.user.role !== "ADMIN") {
    redirect("/login?error=You must be an admin to access this page");
  }

  // Get all users with their streaks
  const users = await db.user.findMany({
    include: {
      streak: true,
      meals: {
        orderBy: {
          date: "desc",
        },
        take: 10,
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  // Get total meal count
  const mealCount = await db.meal.count();

  // Get users with highest streaks
  const topStreaks = await db.streak.findMany({
    where: {
      currentStreak: {
        gt: 0,
      },
    },
    orderBy: {
      currentStreak: "desc",
    },
    take: 5,
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });

  // Get meal counts by type
  const mealsByType = await db.meal.groupBy({
    by: ["type"],
    _count: {
      id: true,
    },
  });

  return (
    <AdminDashboard 
      users={users} 
      mealCount={mealCount} 
      topStreaks={topStreaks} 
      mealsByType={mealsByType} 
    />
  );
} 