import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

// Type for user quest data
interface UserQuestInfo {
  isAccepted: boolean;
  progress: number;
  isCompleted: boolean;
  completedAt: Date | null;
}

// Interface for quest data
interface Quest {
  id: string;
  title: string;
  description: string;
  type: string;
  requirement: number;
  scoreReward: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

// Interface for user quest data
interface UserQuest {
  id: string;
  userId: string;
  questId: string;
  progress: number;
  isCompleted: boolean;
  completedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  quest: Quest;
}

// GET: Get all active quests for the user
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // Find active quests
    const activeQuests = await (db as any).quest.findMany({
      where: { isActive: true },
    }) as Quest[];

    // Fetch user's current quests
    const userQuests = await (db as any).userQuest.findMany({
      where: { userId: session.user.id },
      include: { quest: true },
    }) as UserQuest[];

    // Map of accepted quest IDs
    const userQuestMap = new Map<string, UserQuestInfo>();
    userQuests.forEach((uq: UserQuest) => {
      userQuestMap.set(uq.questId, {
        isAccepted: true,
        progress: uq.progress,
        isCompleted: uq.isCompleted,
        completedAt: uq.completedAt,
      });
    });

    // Format the quests with user acceptance status
    const formattedQuests = activeQuests.map((quest: Quest) => {
      const userQuestInfo = userQuestMap.get(quest.id);
      return {
        id: quest.id,
        title: quest.title,
        description: quest.description,
        type: quest.type,
        requirement: quest.requirement,
        scoreReward: quest.scoreReward,
        isAccepted: !!userQuestInfo,
        isCompleted: userQuestInfo?.isCompleted || false,
        progress: userQuestInfo?.progress || 0,
        completedAt: userQuestInfo?.completedAt || null,
      };
    });

    return NextResponse.json({ quests: formattedQuests });
  } catch (error) {
    console.error("Error retrieving quests:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

// POST: Accept a quest
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { questId } = await req.json();

    if (!questId) {
      return NextResponse.json({ message: "Quest ID is required" }, { status: 400 });
    }

    // Check if quest exists and is active
    const quest = await (db as any).quest.findFirst({
      where: { id: questId, isActive: true },
    });

    if (!quest) {
      return NextResponse.json({ message: "Quest not found or inactive" }, { status: 404 });
    }

    // Check if user already accepted this quest
    const existingUserQuest = await (db as any).userQuest.findUnique({
      where: {
        userId_questId: {
          userId: session.user.id,
          questId: questId,
        },
      },
    });

    if (existingUserQuest) {
      return NextResponse.json({ message: "Quest already accepted" }, { status: 400 });
    }

    // Accept the quest
    await (db as any).userQuest.create({
      data: {
        userId: session.user.id,
        questId: questId,
        progress: 0,
        isCompleted: false,
      },
    });

    return NextResponse.json({ message: "Quest accepted successfully" });
  } catch (error) {
    console.error("Error accepting quest:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
} 