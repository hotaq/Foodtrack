import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    // Ensure user is authenticated
    if (!session || !session.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    
    const body = await req.json();
    const { questId } = body;
    
    if (!questId) {
      return NextResponse.json({ message: "Quest ID is required" }, { status: 400 });
    }
    
    // Check if the quest exists and is active
    const quest = await db.quest.findUnique({
      where: { id: questId },
    });
    
    if (!quest) {
      return NextResponse.json({ message: "Quest not found" }, { status: 404 });
    }
    
    if (!quest.isActive) {
      return NextResponse.json({ message: "Quest is not currently active" }, { status: 400 });
    }
    
    // Check if the quest has expired
    if (quest.endDate && new Date(quest.endDate) < new Date()) {
      return NextResponse.json({ message: "This quest has expired" }, { status: 400 });
    }
    
    // Check if the quest has started
    if (quest.startDate && new Date(quest.startDate) > new Date()) {
      return NextResponse.json({ message: "This quest has not started yet" }, { status: 400 });
    }
    
    // Check if the user has already completed this quest based on frequency rules
    const existingUserQuest = await db.userQuest.findFirst({
      where: {
        userId: session.user.id,
        questId: questId,
      },
      orderBy: {
        completedAt: 'desc',
      },
    });
    
    // If quest is ONCE type and user has completed it before
    if (quest.frequency === "ONCE" && existingUserQuest) {
      return NextResponse.json({ 
        message: "You have already completed this quest" 
      }, { status: 400 });
    }
    
    // If quest is DAILY type, check if user has completed it today
    if (quest.frequency === "DAILY" && existingUserQuest) {
      const lastCompletionDate = new Date(existingUserQuest.completedAt);
      const today = new Date();
      
      if (
        lastCompletionDate.getDate() === today.getDate() &&
        lastCompletionDate.getMonth() === today.getMonth() &&
        lastCompletionDate.getFullYear() === today.getFullYear()
      ) {
        return NextResponse.json({ 
          message: "You have already completed this quest today" 
        }, { status: 400 });
      }
    }
    
    // Create a new userQuest record
    const userQuest = await db.userQuest.create({
      data: {
        userId: session.user.id,
        questId: questId,
        isCompleted: true,
        completedAt: new Date(),
      },
    });
    
    // Award the user with score points
    await db.user.update({
      where: { id: session.user.id },
      data: {
        score: {
          increment: quest.scoreReward,
        },
      },
    });
    
    return NextResponse.json({
      message: "Quest completed successfully",
      reward: quest.scoreReward,
      userQuest: userQuest,
    });
    
  } catch (error) {
    console.error("Error completing quest:", error);
    return NextResponse.json({ message: "Failed to complete quest" }, { status: 500 });
  }
} 