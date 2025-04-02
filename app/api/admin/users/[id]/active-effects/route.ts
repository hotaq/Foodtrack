import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

// GET /api/admin/users/[id]/active-effects - Get all active effects for a user
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

    // Get all active effects for the user, including expired ones for admin visibility
    const activeEffects = await db.activeEffect.findMany({
      where: { userId },
      orderBy: [
        // Show active effects first, then expired
        { expiresAt: 'desc' }
      ]
    });

    // Get items data for each effect
    const effectsWithItems = await Promise.all(
      activeEffects.map(async (effect) => {
        const item = await db.item.findUnique({
          where: { id: effect.itemId },
          select: { name: true, imageUrl: true, type: true }
        });
        
        return {
          ...effect,
          isActive: effect.expiresAt > new Date(),
          item
        };
      })
    );

    return NextResponse.json(effectsWithItems);
  } catch (error) {
    console.error("Error fetching user active effects:", error);
    return NextResponse.json(
      { error: "Failed to fetch active effects" },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/users/[id]/active-effects?effectId=xxx - Delete a specific active effect
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
    
    // Get the effect ID from the query parameter
    const { searchParams } = new URL(req.url);
    const effectId = searchParams.get("effectId");
    
    if (!effectId) {
      return NextResponse.json(
        { error: "Effect ID is required" },
        { status: 400 }
      );
    }

    // Verify the effect exists and belongs to the specified user
    const effect = await db.activeEffect.findFirst({
      where: {
        id: effectId,
        userId
      }
    });

    if (!effect) {
      return NextResponse.json(
        { error: "Active effect not found" },
        { status: 404 }
      );
    }

    // Delete the active effect
    await db.activeEffect.delete({
      where: { id: effectId }
    });

    // Log the admin action
    console.log(`Admin ${session.user.name} (${session.user.id}) deleted active effect ${effectId} for user ${userId}`);

    return NextResponse.json({
      message: "Active effect deleted successfully"
    });
  } catch (error) {
    console.error("Error deleting active effect:", error);
    return NextResponse.json(
      { error: "Failed to delete active effect" },
      { status: 500 }
    );
  }
} 