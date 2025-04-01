import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

// Type definitions for TypeScript
interface Quest {
  id: string;
  title: string;
  description: string;
  type: string;
  requirement: number;
  scoreReward: number;
}

interface UserQuest {
  id: string;
  userId: string;
  questId: string;
  progress: number;
  isCompleted: boolean;
  completedAt: Date | null;
  quest: Quest;
}

interface Score {
  id: string;
  userId: string;
  points: number;
}

// POST: Update quest progress
export async function POST(req: Request) {
  try {
    let userId: string;
    
    // Parse request body
    const body = await req.json();
    const { questType, amount = 1, userId: serverSideUserId } = body;
    
    // Handle two cases: authenticated user request and server-side request with userId
    if (serverSideUserId) {
      // Server-side request with userId (trusted)
      userId = serverSideUserId;
    } else {
      // Client-side request (needs authentication)
      const session = await getServerSession(authOptions);
      if (!session || !session.user) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
      }
      userId = session.user.id;
    }
    
    if (!questType) {
      return NextResponse.json({ message: "Quest type is required" }, { status: 400 });
    }

    // Get user's active quests of the specified type
    const userQuests = await (db as any).userQuest.findMany({
      where: {
        userId: userId,
        isCompleted: false,
        quest: {
          type: questType,
          isActive: true,
        },
      },
      include: {
        quest: true,
      },
    }) as UserQuest[];

    const updatedQuests = [];
    const completedQuests = [];

    // Update progress for each matching quest
    for (const userQuest of userQuests) {
      const newProgress = Math.min(userQuest.progress + amount, userQuest.quest.requirement);
      const isNowCompleted = newProgress >= userQuest.quest.requirement;
      
      // Update the quest progress
      const updatedQuest = await (db as any).userQuest.update({
        where: { id: userQuest.id },
        data: {
          progress: newProgress,
          isCompleted: isNowCompleted,
          completedAt: isNowCompleted ? new Date() : undefined,
        },
        include: {
          quest: true,
        },
      }) as UserQuest;
      
      updatedQuests.push(updatedQuest);
      
      // If quest is completed, award points
      if (isNowCompleted) {
        completedQuests.push(updatedQuest);
        
        // Get user's score record
        const userScore = await (db as any).score.findUnique({
          where: { userId: userId },
        }) as Score | null;
        
        if (userScore) {
          // Update score
          await (db as any).score.update({
            where: { id: userScore.id },
            data: {
              points: userScore.points + updatedQuest.quest.scoreReward,
              transactions: {
                create: {
                  amount: updatedQuest.quest.scoreReward,
                  reason: `Completed quest: ${updatedQuest.quest.title}`,
                  sourceType: "QUEST_REWARD",
                  sourceId: updatedQuest.questId,
                },
              },
            },
          });
        } else {
          // Create score if it doesn't exist
          await (db as any).score.create({
            data: {
              userId: userId,
              points: updatedQuest.quest.scoreReward,
              transactions: {
                create: {
                  amount: updatedQuest.quest.scoreReward,
                  reason: `Completed quest: ${updatedQuest.quest.title}`,
                  sourceType: "QUEST_REWARD",
                  sourceId: updatedQuest.questId,
                },
              },
            },
          });
        }
      }
    }
    
    return NextResponse.json({
      message: "Quest progress updated",
      updatedQuests: updatedQuests.length,
      completedQuests: completedQuests.length,
    });
  } catch (error) {
    console.error("Error updating quest progress:", error);
    return NextResponse.json({ message: "Failed to update quest progress" }, { status: 500 });
  }
} 