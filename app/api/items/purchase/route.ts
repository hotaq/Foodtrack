import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

interface User {
  id: string;
  name?: string | null;
  email?: string | null;
  role: string;
}

interface Score {
  id: string;
  userId: string;
  points: number;
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
}

interface UserItem {
  id: string;
  userId: string;
  itemId: string;
  quantity: number;
  lastUsed: Date | null;
}

// POST: Purchase an item
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: "You must be logged in to purchase items" },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const { itemId } = await request.json();

    if (!itemId) {
      return NextResponse.json(
        { error: "Item ID is required" },
        { status: 400 }
      );
    }

    // Get the user's role to check if admin
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { 
        role: true,
        score: {
          select: {
            id: true,
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
    
    // Get the item details
    const item = await prisma.item.findUnique({
      where: { id: itemId },
    });

    if (!item) {
      return NextResponse.json(
        { error: "Item not found" },
        { status: 404 }
      );
    }

    // If not an admin, check if the user has enough points
    if (!isAdmin) {
      if (!user.score) {
        return NextResponse.json(
          { error: "User score record not found" },
          { status: 400 }
        );
      }

      if (user.score.points < item.price) {
        return NextResponse.json(
          { error: "Insufficient score points" },
          { status: 400 }
        );
      }
    }

    // Continue with the transaction
    const result = await prisma.$transaction(async (prisma) => {
      // Check if the user already has this item
      const existingUserItem = await prisma.userItem.findUnique({
        where: {
          userId_itemId: {
            userId,
            itemId,
          },
        },
      });

      // Add or update the item in the user's inventory
      const userItem = existingUserItem
        ? await prisma.userItem.update({
            where: {
              id: existingUserItem.id,
            },
            data: {
              quantity: {
                increment: 1,
              },
            },
          })
        : await prisma.userItem.create({
            data: {
              userId,
              itemId,
              quantity: 1,
            },
          });

      // Log the purchase
      const itemPurchaseLog = await prisma.itemPurchaseLog.create({
        data: {
          userId,
          itemId,
          price: isAdmin ? 0 : item.price, // Admin purchases are free
        },
      });

      // If not admin, deduct the points from the user's score
      let updatedScore = user.score;
      if (!isAdmin && user.score) {
        updatedScore = await prisma.score.update({
          where: {
            id: user.score.id,
          },
          data: {
            points: {
              decrement: item.price,
            },
            transactions: {
              create: {
                amount: -item.price,
                reason: `Purchase of ${item.name}`,
                sourceType: "ITEM_PURCHASE",
                sourceId: item.id,
              },
            },
          },
        });
      }

      return {
        userItem,
        updatedScore,
      };
    });

    // Return success response with updated data
    return NextResponse.json({
      success: true,
      message: isAdmin ? `Admin purchase successful! You got ${item.name} for free.` : `Successfully purchased ${item.name}!`,
      userItem: result.userItem,
      newScore: isAdmin ? user.score?.points || 0 : result.updatedScore?.points || 0,
      isAdminPurchase: isAdmin
    });
  } catch (error) {
    console.error("Error purchasing item:", error);
    return NextResponse.json(
      { error: "Failed to purchase item" },
      { status: 500 }
    );
  }
} 