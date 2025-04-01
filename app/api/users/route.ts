import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET: Fetch users for targeting with items
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: "You must be logged in to view users" },
        { status: 401 }
      );
    }
    
    const userId = session.user.id;
    
    // Only return active users who are not the current user
    const users = await prisma.user.findMany({
      where: {
        id: { not: userId },
        status: "ACTIVE",
      },
      select: {
        id: true,
        name: true,
      },
      orderBy: {
        name: 'asc',
      },
    });
    
    return NextResponse.json({ users });
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 }
    );
  }
} 