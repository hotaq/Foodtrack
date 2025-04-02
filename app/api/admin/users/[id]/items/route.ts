import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

// GET /api/admin/users/[id]/items - Get all items for a user
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check if user is authenticated and is an admin
    const session = await getServerSession(authOptions);
    if (!session || !session.user || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const userId = params.id;

    // Get all items for the user with item details
    const userItems = await db.userItem.findMany({
      where: { userId },
      include: {
        item: true
      },
      orderBy: { 
        updatedAt: 'desc' 
      }
    });

    // Format the response with cooldown information
    const formattedItems = userItems.map(userItem => {
      const now = new Date();
      const lastUsed = userItem.lastUsed;
      
      // Calculate cooldown status
      let cooldownStatus = null;
      if (lastUsed && userItem.item.cooldown) {
        const cooldownEnds = new Date(lastUsed.getTime() + (userItem.item.cooldown * 1000));
        const isOnCooldown = cooldownEnds > now;
        
        if (isOnCooldown) {
          cooldownStatus = {
            isOnCooldown: true,
            endsAt: cooldownEnds,
            timeRemaining: Math.ceil((cooldownEnds.getTime() - now.getTime()) / 1000) // in seconds
          };
        }
      }
      
      return {
        ...userItem,
        cooldownStatus
      };
    });

    return NextResponse.json(formattedItems);
  } catch (error) {
    console.error("Error fetching user items:", error);
    return NextResponse.json(
      { error: "Failed to fetch user items" },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/users/[id]/items?itemId=xxx - Delete a specific user item
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check if user is authenticated and is an admin
    const session = await getServerSession(authOptions);
    if (!session || !session.user || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const userId = params.id;
    
    // Get the user item ID from the query parameter
    const { searchParams } = new URL(req.url);
    const userItemId = searchParams.get("itemId");
    
    if (!userItemId) {
      return NextResponse.json(
        { error: "Item ID is required" },
        { status: 400 }
      );
    }

    // Verify the user item exists and belongs to the specified user
    const userItem = await db.userItem.findFirst({
      where: {
        id: userItemId,
        userId
      }
    });

    if (!userItem) {
      return NextResponse.json(
        { error: "User item not found" },
        { status: 404 }
      );
    }

    // Delete the user item
    await db.userItem.delete({
      where: { id: userItemId }
    });

    // Log the admin action
    console.log(`Admin ${session.user.name} (${session.user.id}) deleted item ${userItemId} for user ${userId}`);

    return NextResponse.json({
      message: "User item deleted successfully"
    });
  } catch (error) {
    console.error("Error deleting user item:", error);
    return NextResponse.json(
      { error: "Failed to delete user item" },
      { status: 500 }
    );
  }
}

// PATCH /api/admin/users/[id]/items/clear-cooldown?itemId=xxx - Clear cooldown for a specific user item
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check if user is authenticated and is an admin
    const session = await getServerSession(authOptions);
    if (!session || !session.user || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const userId = params.id;
    
    // Get the user item ID from the query parameter
    const { searchParams } = new URL(req.url);
    const userItemId = searchParams.get("itemId");
    
    if (!userItemId) {
      return NextResponse.json(
        { error: "Item ID is required" },
        { status: 400 }
      );
    }

    // Verify the user item exists and belongs to the specified user
    const userItem = await db.userItem.findFirst({
      where: {
        id: userItemId,
        userId
      }
    });

    if (!userItem) {
      return NextResponse.json(
        { error: "User item not found" },
        { status: 404 }
      );
    }

    // Clear the cooldown by setting lastUsed to null
    await db.userItem.update({
      where: { id: userItemId },
      data: { lastUsed: null }
    });

    // Log the admin action
    console.log(`Admin ${session.user.name} (${session.user.id}) cleared cooldown for item ${userItemId} for user ${userId}`);

    return NextResponse.json({
      message: "Item cooldown cleared successfully"
    });
  } catch (error) {
    console.error("Error clearing item cooldown:", error);
    return NextResponse.json(
      { error: "Failed to clear item cooldown" },
      { status: 500 }
    );
  }
} 