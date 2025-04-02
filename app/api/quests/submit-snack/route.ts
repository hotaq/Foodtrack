import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

// POST: Submit a snack image for a quest
export async function POST(req: Request) {
  try {
    console.log("Snack submission API called");
    const session = await getServerSession(authOptions);
    
    // Ensure user is authenticated
    if (!session || !session.user) {
      console.log("Unauthorized snack submission attempt");
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    
    // Parse request body
    const body = await req.json();
    console.log("Snack submission request body:", body);
    const { imageUrl, imageKey = "edgestore", questId } = body;
    
    if (!imageUrl || !questId) {
      console.log("Missing required fields:", { imageUrl, questId });
      return NextResponse.json({ message: "Missing required fields: imageUrl and questId are required" }, { status: 400 });
    }
    
    // Check if the quest exists and is a snack quest
    const quest = await db.quest.findUnique({
      where: { id: questId },
    });
    
    if (!quest) {
      console.log(`Quest not found with ID: ${questId}`);
      return NextResponse.json({ message: "Quest not found" }, { status: 404 });
    }
    
    console.log("Found quest:", quest);
    
    if (!quest.title.toLowerCase().includes("snack")) {
      console.log(`Quest title doesn't include 'snack': ${quest.title}`);
      return NextResponse.json({ message: "This endpoint is only for snack-related quests" }, { status: 400 });
    }
    
    // Check if user already has this quest
    const existingUserQuest = await db.userQuest.findUnique({
      where: {
        userId_questId: {
          userId: session.user.id,
          questId: questId,
        }
      }
    });
    
    console.log("Existing user quest:", existingUserQuest);
    
    // Create a meal record for the snack
    const snackMeal = await db.meal.create({
      data: {
        type: "BREAKFAST", // Default meal type 
        imageUrl,
        imageKey,
        isFood: true,
        foodName: "Snack",
        userId: session.user.id,
      }
    });
    
    console.log("Created snack meal:", snackMeal);
    
    let userQuest;
    let isNewlyCompleted = false;
    
    if (existingUserQuest) {
      // Update progress if user already has the quest
      const newProgress = Math.min(existingUserQuest.progress + 1, quest.requirement);
      const isCompleted = newProgress >= quest.requirement;
      
      isNewlyCompleted = isCompleted && !existingUserQuest.isCompleted;
      
      console.log("Updating existing user quest:", {
        newProgress,
        isCompleted,
        isNewlyCompleted,
        requirement: quest.requirement
      });
      
      userQuest = await db.userQuest.update({
        where: { id: existingUserQuest.id },
        data: {
          progress: newProgress,
          isCompleted: isCompleted,
          completedAt: isCompleted && !existingUserQuest.isCompleted ? new Date() : existingUserQuest.completedAt,
        }
      });
    } else {
      // Assign quest to user if they don't have it yet
      const progress = 1;
      const isCompleted = progress >= quest.requirement;
      isNewlyCompleted = isCompleted;
      
      console.log("Creating new user quest:", {
        progress,
        isCompleted,
        isNewlyCompleted,
        requirement: quest.requirement
      });
      
      userQuest = await db.userQuest.create({
        data: {
          userId: session.user.id,
          questId: questId,
          progress,
          isCompleted,
          completedAt: isCompleted ? new Date() : null,
        }
      });
    }
    
    console.log("User quest after update:", userQuest);
    
    // Award points if quest is newly completed
    let scoreAwarded = 0;
    
    if (isNewlyCompleted) {
      console.log("Quest newly completed! Awarding points...");
      // Get or create user score record
      let userScore = await db.score.findUnique({
        where: { userId: session.user.id }
      });
      
      if (!userScore) {
        userScore = await db.score.create({
          data: {
            userId: session.user.id,
            points: 0,
          }
        });
      }
      
      // Add points for completing the quest
      await db.score.update({
        where: { id: userScore.id },
        data: {
          points: userScore.points + quest.scoreReward,
        }
      });
      
      // Record the transaction
      await db.scoreTransaction.create({
        data: {
          scoreId: userScore.id,
          amount: quest.scoreReward,
          reason: `Completed quest: ${quest.title}`,
          sourceType: "QUEST_REWARD",
          sourceId: quest.id,
        }
      });
      
      scoreAwarded = quest.scoreReward;
      console.log(`Awarded ${scoreAwarded} points for completing quest`);
    }
    
    const response = {
      message: "Snack submission successful",
      mealId: snackMeal.id,
      progress: userQuest.progress,
      requirement: quest.requirement,
      isCompleted: userQuest.isCompleted,
      scoreAwarded,
    };
    
    console.log("Snack submission response:", response);
    return NextResponse.json(response);
    
  } catch (error) {
    console.error("Error submitting snack:", error);
    return NextResponse.json({ message: "Failed to submit snack" }, { status: 500 });
  }
}

// GET: Get snack quests for the user
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    // Ensure user is authenticated
    if (!session || !session.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    
    // Find all snack-related quests
    const snackQuests = await db.quest.findMany({
      where: {
        AND: [
          { title: { contains: "Snack", mode: "insensitive" } },
          { isActive: true }
        ]
      }
    });
    
    if (snackQuests.length === 0) {
      return NextResponse.json({ message: "No active snack quests found" }, { status: 404 });
    }
    
    // Get user's progress on these quests
    const userQuestProgress = await db.userQuest.findMany({
      where: {
        userId: session.user.id,
        questId: { in: snackQuests.map(q => q.id) }
      }
    });
    
    // Combine quest info with user progress
    const questsWithProgress = snackQuests.map(quest => {
      const userQuest = userQuestProgress.find(uq => uq.questId === quest.id);
      return {
        id: quest.id,
        title: quest.title,
        description: quest.description,
        scoreReward: quest.scoreReward,
        requirement: quest.requirement,
        progress: userQuest?.progress || 0,
        isCompleted: userQuest?.isCompleted || false,
        completedAt: userQuest?.completedAt || null,
      };
    });
    
    return NextResponse.json({ quests: questsWithProgress });
    
  } catch (error) {
    console.error("Error fetching snack quests:", error);
    return NextResponse.json({ message: "Failed to fetch snack quests" }, { status: 500 });
  }
} 