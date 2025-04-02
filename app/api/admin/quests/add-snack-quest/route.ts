import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { QuestType } from "@prisma/client";

// POST: Create a Snack Time quest
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    // Ensure user is authenticated and is an admin
    if (!session || !session.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    
    const user = await db.user.findUnique({
      where: { id: session.user.id },
    });
    
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ message: "Forbidden: Admin access required" }, { status: 403 });
    }
    
    // Parse request body for customization options (optional)
    const { 
      scoreReward = 10, 
      requirement = 1, 
      isActive = true,
      customTitle,
      customDescription  
    } = await req.json();
    
    // Create the Snack Time quest with defaults or custom values
    const quest = await db.quest.create({
      data: {
        title: customTitle || "Snack Time",
        description: customDescription || "Share your favorite snacks! Upload an image of a snack you're enjoying to earn rewards.",
        type: "SPECIAL_EVENT" as QuestType,
        requirement: Number(requirement),
        scoreReward: Number(scoreReward),
        isActive: Boolean(isActive),
        createdBy: session.user.id,
      },
    });
    
    return NextResponse.json({
      message: "Snack Time quest created successfully",
      quest,
    });
  } catch (error) {
    console.error("Error creating Snack Time quest:", error);
    return NextResponse.json({ message: "Failed to create Snack Time quest" }, { status: 500 });
  }
}

// GET: Check if Snack Time quest exists
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    // Ensure user is authenticated and is an admin
    if (!session || !session.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    
    const user = await db.user.findUnique({
      where: { id: session.user.id },
    });
    
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ message: "Forbidden: Admin access required" }, { status: 403 });
    }
    
    // Find any existing Snack Time quests
    const existingSnackQuests = await db.quest.findMany({
      where: {
        title: {
          contains: "Snack Time",
          mode: "insensitive"
        }
      }
    });
    
    return NextResponse.json({ 
      exists: existingSnackQuests.length > 0,
      quests: existingSnackQuests
    });
  } catch (error) {
    console.error("Error checking for Snack Time quests:", error);
    return NextResponse.json({ message: "Failed to check Snack Time quests" }, { status: 500 });
  }
} 