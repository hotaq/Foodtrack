import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Type definitions to help TypeScript
interface Score {
  id: string;
  userId: string;
  points: number;
}

interface Item {
  id: string;
  name: string;
  description: string;
  imageUrl?: string;
  price: number;
  type: string;
  effect: string;
  duration?: number;
  cooldown?: number;
}

interface UserItem {
  id: string;
  userId: string;
  itemId: string;
  quantity: number;
  lastUsed?: Date;
  item: Item;
}

// GET: Get all active items for the marketplace
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: "You must be logged in to view marketplace items" },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { 
        role: true,
        score: {
          select: {
            points: true
          }
        }
      }
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    const isAdmin = user.role === "ADMIN";
    // Get the points from the score object, defaulting to 0 if not available
    const userPoints = user.score?.points || 0;

    // Get all items if admin, otherwise only active items
    const items = await prisma.item.findMany({
      where: isAdmin ? {} : { isActive: true },
      orderBy: { createdAt: 'desc' },
    });

    // Get user's inventory
    const userItems = await prisma.userItem.findMany({
      where: { userId },
      select: {
        itemId: true,
        quantity: true,
      },
    });

    const userItemMap = userItems.reduce((acc, item) => {
      acc[item.itemId] = item.quantity;
      return acc;
    }, {} as Record<string, number>);

    // Get item use logs to check cooldowns
    const itemUseLogs = await prisma.itemUseLog.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    const lastUsedMap: Record<string, Date> = {};
    for (const log of itemUseLogs) {
      if (!lastUsedMap[log.itemId]) {
        lastUsedMap[log.itemId] = log.createdAt;
      }
    }

    // Format items with additional info for the frontend
    const formattedItems = items.map((item) => {
      const quantity = userItemMap[item.id] || 0;
      const lastUsed = lastUsedMap[item.id];
      
      let cooldownEnds = null;
      if (lastUsed && item.cooldown) {
        const cooldownTime = new Date(lastUsed);
        cooldownTime.setHours(cooldownTime.getHours() + item.cooldown);
        
        if (cooldownTime > new Date()) {
          cooldownEnds = cooldownTime.toISOString();
        }
      }

      return {
        ...item,
        userOwns: quantity > 0,
        quantity,
        lastUsed: lastUsed ? lastUsed.toISOString() : null,
        cooldownEnds,
        canAfford: userPoints >= item.price,
        isActive: item.isActive,
      };
    });

    return NextResponse.json({
      items: formattedItems,
      userScore: userPoints,
      isAdmin,
    });
  } catch (error) {
    console.error("Error fetching marketplace items:", error);
    return NextResponse.json(
      { error: "Failed to fetch marketplace items" },
      { status: 500 }
    );
  }
} 