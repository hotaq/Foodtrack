import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { randomUUID } from "crypto";

// GET: Get all quests
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
    
    // Get all quests
    const quests = await db.quest.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: {
            userQuests: true,
          },
        },
      },
    });
    
    return NextResponse.json(quests);
  } catch (error) {
    console.error("Error fetching quests:", error);
    return NextResponse.json({ message: "Failed to fetch quests" }, { status: 500 });
  }
}

// POST: Create a new quest
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
    
    // Parse request body
    const body = await req.json();
    console.log("Create quest request body:", JSON.stringify(body, null, 2));
    
    const { title, description, scoreReward, type, requirement, isActive, startDate, endDate } = body;
    
    // Validate required fields
    if (!title || !description || !scoreReward || !type || requirement === undefined) {
      return NextResponse.json({ message: "Missing required fields" }, { status: 400 });
    }
    
    // Create new quest
    console.log("Creating quest with data:", {
      title,
      description,
      scoreReward: Number(scoreReward),
      type,
      requirement: Number(requirement),
      isActive: Boolean(isActive),
      startDate,
      endDate,
      createdBy: session.user.id
    });
    
    // Use raw query to bypass Prisma client validation
    const result = await db.$queryRaw`
      INSERT INTO "Quest" (
        "id", "title", "description", "scoreReward", "type", 
        "requirement", "isActive", "startDate", "endDate", 
        "createdBy", "createdAt", "updatedAt"
      ) 
      VALUES (
        ${randomUUID()}, ${title}, ${description}, ${Number(scoreReward)}, ${type}::"QuestType", 
        ${Number(requirement)}, ${Boolean(isActive)}, 
        ${startDate ? startDate : null}::timestamp, 
        ${endDate ? endDate : null}::timestamp, 
        ${session.user.id}, NOW(), NOW()
      )
      RETURNING *
    `;
    
    // Type assertion for the raw query result
    const newQuest = Array.isArray(result) && result.length > 0 ? result[0] : null;
    
    if (!newQuest) {
      throw new Error("Failed to create quest");
    }
    
    return NextResponse.json({
      message: "Quest created successfully",
      quest: newQuest,
    }, { status: 201 });
  } catch (error) {
    console.error("Error creating quest:", error);
    const errorMessage = typeof error === 'object' && error !== null ? 
      (error as Error).message || "Unknown error" : 
      String(error);
    
    return NextResponse.json({ 
      message: "Failed to create quest", 
      error: errorMessage 
    }, { status: 500 });
  }
}

// PATCH: Update quest active status (admin only)
export async function PATCH(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    // Ensure user is authenticated and is an admin
    if (!session || !session.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    
    const user = await (db as any).user.findUnique({
      where: { id: session.user.id },
    });
    
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ message: "Forbidden: Admin access required" }, { status: 403 });
    }
    
    // Parse request body
    const { questId, isActive } = await req.json();
    
    if (!questId) {
      return NextResponse.json({ message: "Quest ID is required" }, { status: 400 });
    }
    
    // Update the quest
    const updatedQuest = await (db as any).quest.update({
      where: { id: questId },
      data: { 
        isActive: Boolean(isActive),
        updatedAt: new Date(),
      },
    });
    
    return NextResponse.json({
      message: "Quest updated successfully",
      quest: updatedQuest,
    });
  } catch (error) {
    console.error("Error updating quest:", error);
    return NextResponse.json({ message: "Failed to update quest" }, { status: 500 });
  }
}

// DELETE: Remove a quest (admin only)
export async function DELETE(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    // Ensure user is authenticated and is an admin
    if (!session || !session.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    
    const user = await (db as any).user.findUnique({
      where: { id: session.user.id },
    });
    
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ message: "Forbidden: Admin access required" }, { status: 403 });
    }
    
    // Get questId from URL
    const url = new URL(req.url);
    const questId = url.searchParams.get('id');
    
    if (!questId) {
      return NextResponse.json({ message: "Quest ID is required" }, { status: 400 });
    }
    
    // First delete related user quests
    await (db as any).userQuest.deleteMany({
      where: { questId },
    });
    
    // Then delete the quest
    await (db as any).quest.delete({
      where: { id: questId },
    });
    
    return NextResponse.json({
      message: "Quest deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting quest:", error);
    return NextResponse.json({ message: "Failed to delete quest" }, { status: 500 });
  }
} 