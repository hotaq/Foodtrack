import { Metadata } from "next";
import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import AdminUsersPage from "./admin-users";
import { Role, UserStatus } from "@prisma/client";

export const metadata: Metadata = {
  title: "User Management | Meal Tracker",
  description: "Manage user accounts, roles, and permissions",
};

// Simple type for our formatted users
type FormattedUser = {
  id: string;
  name: string;
  email: string;
  image: string | null;
  role: Role;
  currentStreak: number;
  bestStreak: number;
  mealCount: number;
  completedQuests: number;
  status: UserStatus;
  createdAt: Date;
};

export default async function UsersPage() {
  const session = await getServerSession(authOptions);

  // Check if user is authenticated and has admin role
  if (!session || !session.user || session.user.role !== "ADMIN") {
    redirect("/login?error=You must be an admin to access this page");
  }

  // Get all users
  const users = await db.user.findMany({
    orderBy: {
      createdAt: "desc",
    },
  });

  // Fetch streaks separately
  const streaks = await db.streak.findMany();
  const streakMap = new Map(streaks.map(s => [s.userId, s]));
  
  // Count meals for each user
  const mealCounts = await db.$queryRaw`
    SELECT "userId", COUNT(*) as "count" 
    FROM "Meal" 
    GROUP BY "userId"
  ` as { userId: string, count: bigint }[];
  
  const mealCountMap = new Map(mealCounts.map(m => [m.userId, Number(m.count)]));
  
  // Count completed quests for each user
  const questCounts = await db.$queryRaw`
    SELECT "userId", COUNT(*) as "count" 
    FROM "UserQuest" 
    WHERE "isCompleted" = true
    GROUP BY "userId"
  ` as { userId: string, count: bigint }[];
  
  const questCountMap = new Map(questCounts.map(q => [q.userId, Number(q.count)]));

  // Format user data
  const formattedUsers = users.map(user => {
    const streak = streakMap.get(user.id);
    return {
      id: user.id,
      name: user.name || "",
      email: user.email,
      image: user.image,
      role: user.role,
      currentStreak: streak?.currentStreak || 0,
      bestStreak: streak?.longestStreak || 0,
      mealCount: mealCountMap.get(user.id) || 0,
      completedQuests: questCountMap.get(user.id) || 0,
      status: user.status,
      createdAt: user.createdAt,
    } as FormattedUser;
  });

  return <AdminUsersPage users={formattedUsers} />;
} 