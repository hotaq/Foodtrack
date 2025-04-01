import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

interface User {
  id: string;
  name?: string | null;
  email?: string | null;
  role: string;
}

interface Item {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  price: number;
  type: string;
  effect: string | null;
  duration: number | null;
  cooldown: number | null;
  isActive: boolean;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

// POST: Seed marketplace items (admin only)
export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    
    // Check if user is authenticated and has admin role
    if (!session || !session.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    
    const user = session.user as User;
    
    if (user.role !== "ADMIN") {
      return NextResponse.json({ message: "Admin access required" }, { status: 403 });
    }
    
    // Define sample items
    const sampleItems = [
      {
        name: "Health Potion",
        description: "Restores health points",
        imageUrl: "/images/items/potion.png",
        price: 50,
        type: "CONSUMABLE",
        effect: "HEALTH_BOOST",
        duration: 3600,  // 1 hour in seconds
        cooldown: 1800,  // 30 minutes in seconds
        isActive: true,
        createdBy: user.id
      },
      {
        name: "Shield of Protection",
        description: "Protects your streak from attacks by other users",
        imageUrl: "/images/items/shield.png",
        price: 150,
        type: "EQUIPMENT",
        effect: "STREAK_PROTECT",
        duration: 86400,  // 24 hours in seconds
        cooldown: 43200,  // 12 hours in seconds
        isActive: true,
        createdBy: user.id
      },
      {
        name: "Power Sword",
        description: "Decreases another user's streak by 1 when used",
        imageUrl: "/images/items/sword.png",
        price: 200,
        type: "EQUIPMENT",
        effect: "STREAK_DECREASE",
        duration: 0,  // Immediate effect
        cooldown: 43200,  // 12 hours in seconds
        isActive: true,
        createdBy: user.id
      },
      {
        name: "Magic Wand",
        description: "Doubles points earned for the next meal",
        imageUrl: "/images/items/wand.png",
        price: 300,
        type: "CONSUMABLE",
        effect: "SCORE_MULTIPLIER",
        duration: 3600,  // 1 hour in seconds
        cooldown: 7200,  // 2 hours in seconds
        isActive: true,
        createdBy: user.id
      },
      {
        name: "Bonus Time",
        description: "Extends meal window time",
        imageUrl: "/images/items/bonus.png",
        price: 100,
        type: "CONSUMABLE",
        effect: "TIME_EXTENSION",
        duration: 1800,  // 30 minutes in seconds
        cooldown: 21600,  // 6 hours in seconds
        isActive: true,
        createdBy: user.id
      }
    ];
    
    // Delete existing items
    await (db as any).item.deleteMany({});
    
    // Create sample items
    const createdItems = await (db as any).item.createMany({
      data: sampleItems,
    });
    
    return NextResponse.json({ 
      message: `Seeded ${createdItems.count} items successfully` 
    });
    
  } catch (error) {
    console.error("Error seeding items:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
} 