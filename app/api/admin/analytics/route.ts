import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { MealType, QuestType } from "@prisma/client";

export async function GET(req: Request) {
  try {
    // Check admin access
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });
    
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Determine date range from URL params (default to year)
    const { searchParams } = new URL(req.url);
    const range = searchParams.get("range") || "year";
    
    // Get start date based on range
    const now = new Date();
    const startDate = new Date();
    
    switch (range) {
      case "week":
        startDate.setDate(now.getDate() - 7);
        break;
      case "month":
        startDate.setMonth(now.getMonth() - 1);
        break;
      case "quarter":
        startDate.setMonth(now.getMonth() - 3);
        break;
      case "year":
      default:
        startDate.setFullYear(now.getFullYear() - 1);
        break;
    }

    // ---------- User Activity Data ----------
    // Get monthly user counts
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    
    // Get users created in each month
    const usersByMonth = await db.$queryRaw<{ month: number, count: bigint }[]>`
      SELECT EXTRACT(MONTH FROM "createdAt") as month, COUNT(*) as count
      FROM "User"
      WHERE "createdAt" >= ${startDate}
      GROUP BY EXTRACT(MONTH FROM "createdAt")
      ORDER BY month
    `;
    
    // Get active users (users who created meals) by month
    const activeUsersByMonth = await db.$queryRaw<{ month: number, count: bigint }[]>`
      SELECT EXTRACT(MONTH FROM m."date") as month, COUNT(DISTINCT m."userId") as count
      FROM "Meal" m
      WHERE m."date" >= ${startDate}
      GROUP BY EXTRACT(MONTH FROM m."date")
      ORDER BY month
    `;
    
    // Initialize userActivityData with all months
    const userActivityData = months.map(month => ({
      month,
      active: 0,
      new: 0
    }));
    
    // Fill in the actual data
    usersByMonth.forEach(item => {
      const monthIndex = Number(item.month) - 1; // Convert 1-based month to 0-based index
      if (monthIndex >= 0 && monthIndex < 12) {
        userActivityData[monthIndex].new = Number(item.count);
      }
    });
    
    activeUsersByMonth.forEach(item => {
      const monthIndex = Number(item.month) - 1;
      if (monthIndex >= 0 && monthIndex < 12) {
        userActivityData[monthIndex].active = Number(item.count);
      }
    });

    // ---------- Quest Completion Data ----------
    // Get quest completion by month
    const questCompletionByMonth = await db.$queryRaw<{ month: number, completed: bigint }[]>`
      SELECT EXTRACT(MONTH FROM "completedAt") as month, COUNT(*) as completed
      FROM "UserQuest"
      WHERE "isCompleted" = true
      AND "completedAt" IS NOT NULL
      AND "completedAt" >= ${startDate}
      GROUP BY EXTRACT(MONTH FROM "completedAt")
      ORDER BY month
    `;
    
    // Get assigned quests by month
    const assignedQuestsByMonth = await db.$queryRaw<{ month: number, assigned: bigint }[]>`
      SELECT EXTRACT(MONTH FROM "createdAt") as month, COUNT(*) as assigned
      FROM "UserQuest"
      WHERE "createdAt" >= ${startDate}
      GROUP BY EXTRACT(MONTH FROM "createdAt")
      ORDER BY month
    `;
    
    // Initialize questCompletionData with all months
    const questCompletionData = months.map(month => ({
      date: month,
      completed: 0,
      assigned: 0
    }));
    
    // Fill in the actual data
    questCompletionByMonth.forEach(item => {
      const monthIndex = Number(item.month) - 1;
      if (monthIndex >= 0 && monthIndex < 12) {
        questCompletionData[monthIndex].completed = Number(item.completed);
      }
    });
    
    assignedQuestsByMonth.forEach(item => {
      const monthIndex = Number(item.month) - 1;
      if (monthIndex >= 0 && monthIndex < 12) {
        questCompletionData[monthIndex].assigned = Number(item.assigned);
      }
    });

    // ---------- Meal Type Distribution ----------
    // Get meal counts by type
    const mealsByType = await db.meal.groupBy({
      by: ["type"],
      _count: {
        id: true,
      },
    });
    
    // Format meal type data
    const mealTypeData = Object.values(MealType).map(type => {
      const count = mealsByType.find(m => m.type === type)?._count?.id || 0;
      return {
        name: type === "BREAKFAST" ? "Breakfast" : 
              type === "LUNCH" ? "Lunch" : 
              type === "DINNER" ? "Dinner" : type,
        value: count
      };
    });
    
    // Add snacks if there are meals with foodName = "Snack"
    const snackCount = await db.meal.count({
      where: {
        foodName: "Snack"
      }
    });
    
    if (snackCount > 0) {
      mealTypeData.push({
        name: "Snacks",
        value: snackCount
      });
    }

    // ---------- Quest Distribution by Type ----------
    // Get quest counts by type
    const questsByType = await db.quest.groupBy({
      by: ["type"],
      _count: {
        id: true,
      },
    });
    
    // Format quest type data
    const questTypeData = Object.values(QuestType).map(type => {
      const count = questsByType.find(q => q.type === type)?._count?.id || 0;
      return {
        type,
        count
      };
    });

    // ---------- Summary Stats ----------
    // Total users
    const totalUsers = await db.user.count();
    
    // New users in the last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const newUsers = await db.user.count({
      where: {
        createdAt: {
          gte: thirtyDaysAgo
        }
      }
    });
    
    // Active users who logged in or posted a meal in the last 30 days
    const activeUsersPastMonth = await db.$queryRaw<{ count: bigint }[]>`
      SELECT COUNT(DISTINCT "userId") as count
      FROM "Meal"
      WHERE "date" >= ${thirtyDaysAgo}
    `;
    
    const activeUsers = Number(activeUsersPastMonth[0]?.count || 0);
    
    // Quest completion rate
    const totalCompletedQuests = await db.userQuest.count({
      where: {
        isCompleted: true
      }
    });
    
    const totalAssignedQuests = await db.userQuest.count();
    const completionRate = totalAssignedQuests > 0 ? 
      Math.round((totalCompletedQuests / totalAssignedQuests) * 100) : 0;
    
    // User growth last month
    const twoMonthsAgo = new Date();
    twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2);
    
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
    
    const usersPreviousMonth = await db.user.count({
      where: {
        createdAt: {
          gte: twoMonthsAgo,
          lt: oneMonthAgo
        }
      }
    });
    
    const usersLastMonth = await db.user.count({
      where: {
        createdAt: {
          gte: oneMonthAgo
        }
      }
    });
    
    const userGrowthPercent = usersPreviousMonth > 0 ? 
      parseFloat((((usersLastMonth - usersPreviousMonth) / usersPreviousMonth) * 100).toFixed(1)) : 0;
    
    // Quest completions growth
    const completedQuestsPreviousMonth = await db.userQuest.count({
      where: {
        completedAt: {
          gte: twoMonthsAgo,
          lt: oneMonthAgo
        },
        isCompleted: true
      }
    });
    
    const completedQuestsLastMonth = await db.userQuest.count({
      where: {
        completedAt: {
          gte: oneMonthAgo
        },
        isCompleted: true
      }
    });
    
    const questCompletionGrowthPercent = completedQuestsPreviousMonth > 0 ? 
      parseFloat((((completedQuestsLastMonth - completedQuestsPreviousMonth) / completedQuestsPreviousMonth) * 100).toFixed(1)) : 0;
    
    // Return all data
    return NextResponse.json({
      userActivityData,
      questCompletionData,
      mealTypeData,
      questTypeData,
      summary: {
        totalUsers,
        newUsers,
        activeUsers,
        totalCompletedQuests,
        totalAssignedQuests,
        completionRate,
        userGrowthPercent,
        questCompletionGrowthPercent
      }
    });
  } catch (error) {
    console.error("Error fetching analytics data:", error);
    return NextResponse.json(
      { error: "Failed to fetch analytics data" },
      { status: 500 }
    );
  }
} 