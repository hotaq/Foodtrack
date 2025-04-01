import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

// POST: Seed quests data (admin only)
export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    
    // Ensure user is authenticated and is an admin
    if (!session || !session.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    
    const user = await (db as any).user.findUnique({
      where: { id: session.user.id },
    }) as User | null;
    
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ message: "Forbidden: Admin access required" }, { status: 403 });
    }
    
    // Define sample quests
    const sampleQuests = [
      {
        title: "Daily Meal Tracker",
        description: "Upload 3 meals in a single day",
        scoreReward: 10,
        type: "MEAL_UPLOAD",
        requirement: 3,
        isActive: true,
        createdBy: session.user.id,
      },
      {
        title: "Streak Builder",
        description: "Maintain a 3-day streak of meal uploads",
        scoreReward: 15,
        type: "STREAK_ACHIEVEMENT",
        requirement: 3,
        isActive: true,
        createdBy: session.user.id,
      },
      {
        title: "Item Collector",
        description: "Purchase your first item from the marketplace",
        scoreReward: 5,
        type: "ITEM_PURCHASE",
        requirement: 1,
        isActive: true,
        createdBy: session.user.id,
      },
      {
        title: "Meal Master",
        description: "Upload 10 meals",
        scoreReward: 20,
        type: "MEAL_UPLOAD",
        requirement: 10,
        isActive: true,
        createdBy: session.user.id,
      },
      {
        title: "Item Experimenter",
        description: "Use 3 different items",
        scoreReward: 15,
        type: "ITEM_USE",
        requirement: 3,
        isActive: true,
        createdBy: session.user.id,
      },
    ];
    
    // Delete existing quests first
    await (db as any).userQuest.deleteMany({});
    await (db as any).quest.deleteMany({});
    
    // Create the sample quests
    const createdQuests = await (db as any).quest.createMany({
      data: sampleQuests,
    });
    
    return NextResponse.json({
      message: "Quests seeded successfully",
      count: createdQuests.count,
    });
  } catch (error) {
    console.error("Error seeding quests:", error);
    return NextResponse.json({ message: "Failed to seed quests" }, { status: 500 });
  }
} 