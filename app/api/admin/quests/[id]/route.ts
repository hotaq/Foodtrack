import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

// GET: Get a specific quest
export async function GET(req: Request, { params }: { params: { id: string } }) {
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
    
    const { id } = params;
    
    // Get the quest
    const quest = await db.quest.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            userQuests: true,
          },
        },
      },
    });
    
    if (!quest) {
      return NextResponse.json({ message: "Quest not found" }, { status: 404 });
    }
    
    return NextResponse.json(quest);
  } catch (error) {
    console.error("Error fetching quest:", error);
    return NextResponse.json({ message: "Failed to fetch quest" }, { status: 500 });
  }
}

// PUT: Update a quest
export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    // Fix the Next.js warning by using await with params
    const { id } = await Promise.resolve(params);
    console.log("PUT quest update request received for ID:", id);
    
    const session = await getServerSession(authOptions);
    
    // Ensure user is authenticated and is an admin
    if (!session || !session.user) {
      console.log("Unauthorized: No session or user");
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    
    const user = await db.user.findUnique({
      where: { id: session.user.id },
    });
    
    if (!user || user.role !== "ADMIN") {
      console.log("Forbidden: User not admin", user?.role);
      return NextResponse.json({ message: "Forbidden: Admin access required" }, { status: 403 });
    }
    
    // Check if the quest exists
    const existingQuest = await db.quest.findUnique({
      where: { id },
    });
    
    if (!existingQuest) {
      console.log("Quest not found with ID:", id);
      return NextResponse.json({ message: "Quest not found" }, { status: 404 });
    }
    
    // Parse request body
    const body = await req.json();
    console.log("Request body:", JSON.stringify(body, null, 2));
    
    const { title, description, scoreReward, type, requirement, isActive, startDate, endDate, frequency } = body;
    
    // Log explicitly to identify fields
    console.log("Extract fields:", { 
      title, 
      description, 
      scoreReward: typeof scoreReward, 
      type, 
      requirement: typeof requirement, 
      isActive: typeof isActive,
      isActiveValue: isActive,
      startDate,
      endDate,
      frequency,
      frequencyType: typeof frequency
    });
    
    // Ensure frequency is handled correctly
    let frequencyValue = frequency;
    if (!frequencyValue && frequencyValue !== null) {
      // If frequency is undefined or empty string, check existing quest
      frequencyValue = existingQuest.frequency || "UNLIMITED";
      console.log("Using default frequency:", frequencyValue);
    } else {
      console.log("Using provided frequency:", frequencyValue);
    }
    
    // Validate required fields
    if (!title || !description || !scoreReward || !type || requirement === undefined) {
      console.log("Missing required fields:", { title, description, scoreReward, type, requirement });
      return NextResponse.json({ message: "Missing required fields" }, { status: 400 });
    }
    
    // Update the quest
    try {
      // Prepare update data - handle isActive explicitly
      const updateData = {
        title,
        description,
        scoreReward: Number(scoreReward),
        type,
        requirement: Number(requirement),
        isActive: isActive !== undefined ? Boolean(isActive) : existingQuest.isActive,
        updatedAt: new Date(),
      };
      
      // Add date fields if provided
      if (startDate !== undefined) {
        // @ts-ignore - Fields exist in DB but Prisma client may not be updated
        updateData.startDate = startDate;
      }
      
      if (endDate !== undefined) {
        // @ts-ignore - Fields exist in DB but Prisma client may not be updated
        updateData.endDate = endDate;
      }
      
      if (frequency !== undefined) {
        // @ts-ignore - Fields exist in DB but Prisma client may not be updated
        updateData.frequency = frequencyValue;
      }
      
      console.log("Update data:", JSON.stringify(updateData, null, 2));
      
      // Use SQL CASE expressions to handle null values properly
      const result = await db.$queryRaw`
        UPDATE "Quest"
        SET 
          "title" = ${updateData.title},
          "description" = ${updateData.description},
          "scoreReward" = ${updateData.scoreReward},
          "type" = ${updateData.type}::"QuestType",
          "requirement" = ${updateData.requirement},
          "isActive" = ${updateData.isActive},
          "startDate" = CASE 
            WHEN ${startDate === null} THEN NULL 
            WHEN ${startDate === undefined} THEN "startDate" 
            ELSE ${startDate}::timestamp 
          END,
          "endDate" = CASE 
            WHEN ${endDate === null} THEN NULL 
            WHEN ${endDate === undefined} THEN "endDate" 
            ELSE ${endDate}::timestamp 
          END,
          "frequency" = ${frequencyValue},
          "updatedAt" = ${updateData.updatedAt}
        WHERE "id" = ${id}
        RETURNING *
      `;
      
      // Type assertion for the raw query result
      const updatedQuest = Array.isArray(result) && result.length > 0 ? result[0] : null;
      
      if (!updatedQuest) {
        throw new Error("Failed to update quest");
      }
      
      console.log("Updated quest:", updatedQuest);
      
      return NextResponse.json({ 
        message: "Quest updated successfully", 
        quest: updatedQuest
      }, { status: 200 });
    } catch (dbError) {
      console.error("Database error updating quest:", dbError);
      // Extract meaningful error message for debugging
      const errorMessage = typeof dbError === 'object' && dbError !== null ? 
        (dbError as Error).message || "Unknown database error" : 
        String(dbError);
      const errorDetails = typeof dbError === 'object' && dbError !== null && 'meta' in dbError ? 
        (dbError as any).meta : {};
      
      return NextResponse.json({ 
        message: "Failed to update quest in database", 
        error: errorMessage,
        details: errorDetails
      }, { status: 500 });
    }
  } catch (error) {
    console.error("Error updating quest:", error);
    const errorMessage = typeof error === 'object' && error !== null ? 
      (error as Error).message || "Unknown error" : 
      String(error);
        
    return NextResponse.json({ 
      message: "Failed to update quest", 
      error: errorMessage
    }, { status: 500 });
  }
}

// DELETE: Delete a quest
export async function DELETE(req: Request, { params }: { params: { id: string } }) {
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
    
    const { id } = params;
    
    // Check if the quest exists
    const existingQuest = await db.quest.findUnique({
      where: { id },
    });
    
    if (!existingQuest) {
      return NextResponse.json({ message: "Quest not found" }, { status: 404 });
    }
    
    // First delete related user quests
    await db.userQuest.deleteMany({
      where: { questId: id },
    });
    
    // Then delete the quest
    await db.quest.delete({
      where: { id },
    });
    
    return NextResponse.json({
      message: "Quest deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting quest:", error);
    return NextResponse.json({ message: "Failed to delete quest" }, { status: 500 });
  }
} 