import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

// POST /api/admin/users/[id]/items/clear-cooldown?itemId=xxx - Clear cooldown for a specific user item
export async function POST(
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
      },
      include: {
        item: true,
        user: {
          select: {
            name: true
          }
        }
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
    console.log(`Admin ${session.user.name} (${session.user.id}) cleared cooldown for ${userItem.item.name} owned by ${userItem.user.name}`);

    return NextResponse.json({
      message: "Item cooldown cleared successfully",
      item: {
        id: userItemId,
        name: userItem.item.name,
        cooldownCleared: true
      }
    });
  } catch (error) {
    console.error("Error clearing item cooldown:", error);
    return NextResponse.json(
      { error: "Failed to clear item cooldown" },
      { status: 500 }
    );
  }
} 