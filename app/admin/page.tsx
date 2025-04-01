import { Metadata } from "next";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import AdminDashboard from "./admin-dashboard";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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
    <>
      <AdminDashboard 
        users={users} 
        mealCount={mealCount} 
        topStreaks={topStreaks} 
        mealsByType={mealsByType} 
      />
      
      <div className="container mx-auto px-4 my-8">
        <h2 className="text-2xl font-bold mb-4">Admin Tools</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link href="/admin/meals">
            <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Meal Management</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  View, filter, and manage user meal submissions
                </p>
              </CardContent>
            </Card>
          </Link>
          
          <Link href="/admin/users">
            <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">User Management</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Manage user accounts, roles, and permissions
                </p>
              </CardContent>
            </Card>
          </Link>
          
          <Link href="/admin/meal-time-settings">
            <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Meal Time Settings</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Configure meal time windows and notification settings
                </p>
              </CardContent>
            </Card>
          </Link>
          
          <Link href="/admin/quests">
            <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Quest Management</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Create and manage quests and user rewards
                </p>
              </CardContent>
            </Card>
          </Link>
          
          <Link href="/admin/items">
            <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Marketplace Items</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Create and manage items for the marketplace
                </p>
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>
    </>
  );
} 