import { Metadata } from "next";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import Link from "next/link";
import { 
  BarChart4, 
  Circle, 
  Clock, 
  Flame, 
  ImageIcon, 
  ShoppingBag, 
  Trophy, 
  UserIcon, 
  Users, 
  Utensils 
} from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = {
  title: "Admin Dashboard | Meal Tracker",
  description: "Manage users, meals, quests, and more",
};

export default async function AdminPage() {
  const session = await getServerSession(authOptions);

  // Check if user is authenticated and has admin role
  if (!session || !session.user || session.user.role !== "ADMIN") {
    redirect("/login?error=You must be an admin to access this page");
  }

  // Get total users
  const userCount = await db.user.count();

  // Get total meal count
  const mealCount = await db.meal.count();

  // Get today's meal count
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  const todaysMeals = await db.meal.count({
    where: {
      date: {
        gte: today,
        lt: tomorrow,
      },
    },
  });

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
          image: true,
        },
      },
    },
  });

  // Get recent users
  const recentUsers = await db.user.findMany({
    orderBy: {
      createdAt: "desc",
    },
    take: 5,
    include: {
      streak: true,
    },
  });

  // Get meal counts by type
  const mealsByType = await db.meal.groupBy({
    by: ["type"],
    _count: {
      id: true,
    },
  });

  // Format meal type data
  const mealTypeStats = mealsByType.reduce((acc, meal) => {
    acc[meal.type] = meal._count.id;
    return acc;
  }, {} as Record<string, number>);

  // Get quest count
  const questCount = await db.quest.count();

  // Get item count
  const itemCount = await db.item.count();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          Manage your users, meals, quests, and more.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Users Card */}
        <Card className="relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-xl">
              <UserIcon className="h-5 w-5 text-primary" />
              Users
            </CardTitle>
            <CardDescription>Total registered users</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{userCount}</div>
          </CardContent>
          <CardFooter className="text-muted-foreground text-sm pt-0">
            <div className="flex items-center">
              <div className="h-1.5 w-1.5 rounded-full bg-primary mr-1.5"></div>
              Growing steadily
            </div>
          </CardFooter>
        </Card>

        {/* Total Meals Card */}
        <Card className="relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-xl">
              <ImageIcon className="h-5 w-5 text-blue-500" />
              Meals
            </CardTitle>
            <CardDescription>Total meal submissions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{mealCount}</div>
          </CardContent>
          <CardFooter className="text-muted-foreground text-sm pt-0">
            <div className="flex items-center">
              <div className="h-1.5 w-1.5 rounded-full bg-blue-500 mr-1.5"></div>
              {todaysMeals} today
            </div>
          </CardFooter>
        </Card>

        {/* Quests Card */}
        <Card className="relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-r from-amber-500/10 to-amber-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-xl">
              <Trophy className="h-5 w-5 text-amber-500" />
              Quests
            </CardTitle>
            <CardDescription>Active quests</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{questCount}</div>
          </CardContent>
          <CardFooter className="text-muted-foreground text-sm pt-0">
            <div className="flex items-center">
              <div className="h-1.5 w-1.5 rounded-full bg-amber-500 mr-1.5"></div>
              Motivating users
            </div>
          </CardFooter>
        </Card>

        {/* Items Card */}
        <Card className="relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-r from-green-500/10 to-green-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-xl">
              <ShoppingBag className="h-5 w-5 text-green-500" />
              Items
            </CardTitle>
            <CardDescription>Marketplace items</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{itemCount}</div>
          </CardContent>
          <CardFooter className="text-muted-foreground text-sm pt-0">
            <div className="flex items-center">
              <div className="h-1.5 w-1.5 rounded-full bg-green-500 mr-1.5"></div>
              Available for purchase
            </div>
          </CardFooter>
        </Card>
      </div>

      {/* Meal Type Stats */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Utensils className="h-5 w-5" />
            Meal Distribution
          </CardTitle>
          <CardDescription>
            Breakdown of meal submissions by meal type
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div className="flex flex-col items-center gap-2 p-4 border rounded-lg">
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10">
                <Circle className="h-5 w-5 text-primary" />
              </div>
              <div className="text-2xl font-bold">{mealTypeStats.BREAKFAST || 0}</div>
              <div className="text-sm text-muted-foreground">Breakfast</div>
            </div>
            
            <div className="flex flex-col items-center gap-2 p-4 border rounded-lg">
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-500/10">
                <Circle className="h-5 w-5 text-blue-500" />
              </div>
              <div className="text-2xl font-bold">{mealTypeStats.LUNCH || 0}</div>
              <div className="text-sm text-muted-foreground">Lunch</div>
            </div>
            
            <div className="flex flex-col items-center gap-2 p-4 border rounded-lg">
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-amber-500/10">
                <Circle className="h-5 w-5 text-amber-500" />
              </div>
              <div className="text-2xl font-bold">{mealTypeStats.DINNER || 0}</div>
              <div className="text-sm text-muted-foreground">Dinner</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Streaks */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Flame className="h-5 w-5 text-orange-500" />
              Top Streaks
            </CardTitle>
            <CardDescription>
              Users with the highest consecutive meal submissions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topStreaks.map((streak) => (
                <div key={streak.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                      {streak.user.image ? (
                        <img 
                          src={streak.user.image} 
                          alt={streak.user.name || "User"} 
                          className="h-full w-full rounded-full object-cover"
                        />
                      ) : (
                        <UserIcon className="h-5 w-5 text-muted-foreground" />
                      )}
                    </div>
                    <div>
                      <div className="font-medium">{streak.user.name}</div>
                      <div className="text-sm text-muted-foreground">{streak.user.email}</div>
                    </div>
                  </div>
                  <Badge variant="secondary" className="flex items-center gap-1">
                    <Flame className="h-3 w-3" />
                    {streak.currentStreak} days
                  </Badge>
                </div>
              ))}
              {topStreaks.length === 0 && (
                <div className="text-center py-6 text-muted-foreground">
                  No active streaks found
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recent Users */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-500" />
              Recently Joined
            </CardTitle>
            <CardDescription>
              Most recent user registrations
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentUsers.map((user) => (
                <div key={user.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                      {user.image ? (
                        <img 
                          src={user.image} 
                          alt={user.name || "User"} 
                          className="h-full w-full rounded-full object-cover"
                        />
                      ) : (
                        <UserIcon className="h-5 w-5 text-muted-foreground" />
                      )}
                    </div>
                    <div>
                      <div className="font-medium">{user.name}</div>
                      <div className="text-sm text-muted-foreground">{user.email}</div>
                    </div>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Admin Tools */}
      <div>
        <h2 className="text-xl font-bold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <Link href="/admin/quests">
            <Card className="hover:bg-muted/50 transition-colors cursor-pointer h-full">
              <CardHeader className="p-4">
                <Trophy className="h-8 w-8 text-amber-500" />
              </CardHeader>
              <CardContent className="pb-4 pt-0">
                <CardTitle className="text-base">Manage Quests</CardTitle>
                <CardDescription>Create and edit quests</CardDescription>
              </CardContent>
            </Card>
          </Link>
          
          <Link href="/admin/items">
            <Card className="hover:bg-muted/50 transition-colors cursor-pointer h-full">
              <CardHeader className="p-4">
                <ShoppingBag className="h-8 w-8 text-green-500" />
              </CardHeader>
              <CardContent className="pb-4 pt-0">
                <CardTitle className="text-base">Marketplace Items</CardTitle>
                <CardDescription>Manage available items</CardDescription>
              </CardContent>
            </Card>
          </Link>
          
          <Link href="/admin/users">
            <Card className="hover:bg-muted/50 transition-colors cursor-pointer h-full">
              <CardHeader className="p-4">
                <Users className="h-8 w-8 text-blue-500" />
              </CardHeader>
              <CardContent className="pb-4 pt-0">
                <CardTitle className="text-base">User Management</CardTitle>
                <CardDescription>Manage user accounts</CardDescription>
              </CardContent>
            </Card>
          </Link>
          
          <Link href="/admin/meal-time-settings">
            <Card className="hover:bg-muted/50 transition-colors cursor-pointer h-full">
              <CardHeader className="p-4">
                <Clock className="h-8 w-8 text-purple-500" />
              </CardHeader>
              <CardContent className="pb-4 pt-0">
                <CardTitle className="text-base">Meal Times</CardTitle>
                <CardDescription>Configure meal windows</CardDescription>
              </CardContent>
            </Card>
          </Link>
          
          <Link href="/admin/analytics">
            <Card className="hover:bg-muted/50 transition-colors cursor-pointer h-full">
              <CardHeader className="p-4">
                <BarChart4 className="h-8 w-8 text-indigo-500" />
              </CardHeader>
              <CardContent className="pb-4 pt-0">
                <CardTitle className="text-base">Analytics</CardTitle>
                <CardDescription>View platform metrics</CardDescription>
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>
    </div>
  );
} 