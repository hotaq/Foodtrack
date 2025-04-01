import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

// POST: Create a new quest (admin only)
export async function POST(req: Request) {
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
    const { title, description, type, requirement, scoreReward, isActive } = await req.json();
    
    // Validate required fields
    if (!title || !description || !type) {
      return NextResponse.json({ message: "Missing required fields" }, { status: 400 });
    }
    
    // Create the quest
    const quest = await (db as any).quest.create({
      data: {
        title,
        description,
        type,
        requirement: Number(requirement) || 1,
        scoreReward: Number(scoreReward) || 5,
        isActive: Boolean(isActive),
        createdBy: session.user.id,
      },
    });
    
    return NextResponse.json({
      message: "Quest created successfully",
      quest,
    });
  } catch (error) {
    console.error("Error creating quest:", error);
    return NextResponse.json({ message: "Failed to create quest" }, { status: 500 });
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

// GET: List all quests (admin only)
export async function GET() {
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
    
    // Get all quests
    const quests = await (db as any).quest.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: {
            userQuests: true,
          },
        },
      },
    });
    
    return NextResponse.json({ quests });
  } catch (error) {
    console.error("Error fetching quests:", error);
    return NextResponse.json({ message: "Failed to fetch quests" }, { status: 500 });
  }
} 