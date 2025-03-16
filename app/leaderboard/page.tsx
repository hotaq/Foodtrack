import { getServerSession } from "next-auth";
import { db } from "@/lib/db";
import { authOptions } from "@/lib/auth";
import LeaderboardClient from "./leaderboard-client";

export default async function LeaderboardPage() {
  const session = await getServerSession(authOptions);
  
  // Get top users by streak
  const topStreaks = await db.streak.findMany({
    orderBy: {
      currentStreak: "desc",
    },
    take: 50,
    include: {
      user: {
        select: {
          id: true,
          name: true,
          image: true,
          createdAt: true,
          role: true,
        },
      },
    },
  });

  // Get current user's rank if logged in
  let currentUserRank = null;
  if (session?.user?.id) {
    const userStreak = await db.streak.findUnique({
      where: {
        userId: session.user.id,
      },
    });

    if (userStreak) {
      // Count users with higher streaks to determine rank
      const higherStreaks = await db.streak.count({
        where: {
          currentStreak: {
            gt: userStreak.currentStreak,
          },
        },
      });
      
      currentUserRank = {
        rank: higherStreaks + 1,
        streak: userStreak.currentStreak,
        userId: session.user.id
      };
    }
  }

  return (
    <LeaderboardClient 
      topStreaks={topStreaks} 
      currentUserRank={currentUserRank}
      isLoggedIn={!!session}
    />
  );
} 