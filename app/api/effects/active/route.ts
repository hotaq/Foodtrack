import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    // Ensure user is authenticated
    if (!session || !session.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    
    const userId = session.user.id;
    
    // Get active effects that have not expired
    const activeEffects = await db.activeEffect.findMany({
      where: {
        userId,
        expiresAt: {
          gt: new Date()
        }
      },
      orderBy: {
        expiresAt: 'asc'
      }
    });
    
    return NextResponse.json({
      activeEffects
    });
  } catch (error) {
    console.error("Error fetching active effects:", error);
    return NextResponse.json({ 
      message: "Failed to fetch active effects",
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
} 