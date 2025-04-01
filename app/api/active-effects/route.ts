import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: "You must be logged in to view active effects" },
        { status: 401 }
      );
    }
    
    // Get the requesting user's ID
    const currentUserId = session.user.id;
    
    // Get URL parameters
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    
    // Only allow users to see their own effects unless they're an admin
    // Check if the user is an admin
    const user = await prisma.user.findUnique({
      where: { id: currentUserId },
      select: { role: true }
    });
    
    const isAdmin = user?.role === "ADMIN";
    
    if (userId !== currentUserId && !isAdmin) {
      return NextResponse.json(
        { error: "You can only view your own active effects" },
        { status: 403 }
      );
    }
    
    // Query active effects for the user
    const activeEffects = await prisma.activeEffect.findMany({
      where: {
        userId: userId || currentUserId,
        expiresAt: { gt: new Date() } // Only return non-expired effects
      },
      orderBy: {
        expiresAt: 'asc' // Show effects expiring soonest first
      }
    });
    
    return NextResponse.json({
      activeEffects
    });
  } catch (error) {
    console.error("Error fetching active effects:", error);
    return NextResponse.json(
      { error: "Failed to fetch active effects" },
      { status: 500 }
    );
  }
} 