import { getServerSession } from "next-auth";
import { db } from "@/lib/db";
import { authOptions } from "@/lib/auth";
import LeaderboardClient from "./leaderboard-client";

export default async function LeaderboardPage() {
  const session = await getServerSession(authOptions);
  
  try {
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

    // Serialize data to prevent issues with date objects
    const serializedStreaks = topStreaks.map(streak => ({
      ...streak,
      user: {
        ...streak.user,
        createdAt: streak.user.createdAt.toISOString()
      }
    }));

    return (
      <LeaderboardClient 
        topStreaks={serializedStreaks} 
        currentUserRank={currentUserRank}
        isLoggedIn={!!session}
      />
    );
  } catch (error) {
    console.error("Error loading leaderboard data:", error);
    
    // Return a fallback UI in case of error
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <h1 className="text-2xl font-bold mb-4">Leaderboard Unavailable</h1>
        <p className="text-gray-500 mb-4">Sorry, we couldn&apos;t load the leaderboard data at this time.</p>
        <a href="/dashboard" className="text-primary hover:underline">Return to Dashboard</a>
      </div>
    );
  }
} 