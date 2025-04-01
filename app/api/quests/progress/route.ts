import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

// POST: Update quest progress
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get request body
    const { questId, increment = 1 } = await req.json();

    if (!questId) {
      return NextResponse.json(
        { message: "Quest ID is required" },
        { status: 400 }
      );
    }

    // Get the quest
    const quest = await db.quest.findUnique({
      where: {
        id: questId,
        isActive: true,
      },
    });

    if (!quest) {
      return NextResponse.json(
        { message: "Quest not found or inactive" },
        { status: 404 }
      );
    }

    // Get or create user quest record
    let userQuest = await db.userQuest.findUnique({
      where: {
        userId_questId: {
          userId: session.user.id,
          questId,
        },
      },
    });

    // If user quest doesn't exist, create it
    if (!userQuest) {
      userQuest = await db.userQuest.create({
        data: {
          userId: session.user.id,
          questId,
          progress: 0,
        },
      });
    }

    // If quest is already completed, don't update progress
    if (userQuest.isCompleted) {
      return NextResponse.json({
        message: "Quest already completed",
        quest: {
          ...quest,
          progress: userQuest.progress,
          isCompleted: true,
          completedAt: userQuest.completedAt,
        },
      });
    }

    // Update progress
    const newProgress = userQuest.progress + increment;
    const isCompleted = newProgress >= quest.requirement;
    const completedAt = isCompleted ? new Date() : null;

    // Update the user quest record
    const updatedUserQuest = await db.userQuest.update({
      where: {
        id: userQuest.id,
      },
      data: {
        progress: newProgress,
        isCompleted,
        completedAt,
      },
    });

    // If quest is completed, award score
    if (isCompleted && !userQuest.isCompleted) {
      // Get or create user score record
      let userScore = await db.score.findUnique({
        where: {
          userId: session.user.id,
        },
      });

      if (!userScore) {
        userScore = await db.score.create({
          data: {
            userId: session.user.id,
            points: quest.scoreReward,
          },
        });
      } else {
        // Update user score
        userScore = await db.score.update({
          where: {
            id: userScore.id,
          },
          data: {
            points: {
              increment: quest.scoreReward,
            },
          },
        });
      }

      // Record the transaction
      await db.scoreTransaction.create({
        data: {
          scoreId: userScore.id,
          amount: quest.scoreReward,
          reason: `Completed quest: ${quest.title}`,
          sourceType: "QUEST_REWARD",
          sourceId: quest.id,
        },
      });
    }

    return NextResponse.json({
      message: isCompleted ? "Quest completed!" : "Quest progress updated",
      quest: {
        ...quest,
        progress: updatedUserQuest.progress,
        isCompleted: updatedUserQuest.isCompleted,
        completedAt: updatedUserQuest.completedAt,
      },
      scoreAwarded: isCompleted && !userQuest.isCompleted ? quest.scoreReward : 0,
    });
  } catch (error) {
    console.error("Error updating quest progress:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
} 