import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

// POST: Use an item
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    // Ensure user is authenticated
    if (!session || !session.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    
    const userId = session.user.id;
    
    // Parse request body
    const { itemId, targetUserId } = await req.json();
    
    if (!itemId) {
      return NextResponse.json({ message: "Item ID is required" }, { status: 400 });
    }
    
    // Check if user has the item
    const userItem = await (db as any).userItem.findFirst({
      where: {
        userId: session.user.id,
        itemId,
        quantity: { gt: 0 }
      },
      include: {
        item: true
      }
    });
    
    if (!userItem) {
      return NextResponse.json({ message: "You don't own this item" }, { status: 404 });
    }
    
    // Check cooldown period if applicable
    if (userItem.lastUsed && userItem.item.cooldown) {
      const cooldownEnds = new Date(userItem.lastUsed);
      cooldownEnds.setSeconds(cooldownEnds.getSeconds() + userItem.item.cooldown); // Using seconds from the schema
      
      if (cooldownEnds > new Date()) {
        const timeRemaining = Math.ceil((cooldownEnds.getTime() - new Date().getTime()) / (1000 * 60));
        return NextResponse.json({ 
          message: `This item is on cooldown. Try again in ${timeRemaining} minute(s)` 
        }, { status: 400 });
      }
    }
    
    // Process different item types and effects
    let effectMessage = null;
    let effectResult = null;
    
    // Get user's score
    const userScore = await (db as any).score.findUnique({
      where: { userId }
    });
    
    if (userItem.item.type === "CONSUMABLE") {
      // Handle consumable items with different effects
      switch (userItem.item.effect) {
        case "SCORE_MULTIPLIER":
          // Create an active effect for score multiplier
          await (db as any).activeEffect.create({
            data: {
              userId,
              itemId,
              type: "SCORE_MULTIPLIER",
              multiplier: 2.0, // Default 2x multiplier
              expiresAt: new Date(Date.now() + (userItem.item.duration || 3600) * 1000),
            }
          });
          effectMessage = "Score multiplier active! Your points are now doubled for a limited time.";
          effectResult = "SCORE_MULTIPLIER_APPLIED";
          break;
          
        case "TIME_EXTENSION":
          // Create an active effect for time extension
          await (db as any).activeEffect.create({
            data: {
              userId,
              itemId,
              type: "TIME_EXTENSION",
              timeExtension: 15, // Default 15 minutes extension
              expiresAt: new Date(Date.now() + (userItem.item.duration || 3600) * 1000),
            }
          });
          effectMessage = "Time extension activated! You have extra time for meal submissions.";
          effectResult = "TIME_EXTENSION_APPLIED";
          break;
          
        default:
          effectMessage = "Item used successfully, but no special effect was applied.";
          effectResult = "NO_EFFECT";
      }
    } else if (userItem.item.type === "EQUIPMENT") {
      // Handle equipment items
      switch (userItem.item.effect) {
        case "STREAK_PROTECT":
          // Create an active effect for streak protection
          await (db as any).activeEffect.create({
            data: {
              userId,
              itemId,
              type: "STREAK_PROTECT",
              expiresAt: new Date(Date.now() + (userItem.item.duration || 86400) * 1000),
            }
          });
          effectMessage = "Shield of Protection activated! Your streak is now protected from attacks for 24 hours.";
          effectResult = "STREAK_PROTECTION_APPLIED";
          break;
          
        case "STREAK_DECREASE":
          // Verify target user exists
          if (!targetUserId) {
            return NextResponse.json({ 
              message: "You must select a target user to use this item" 
            }, { status: 400 });
          }
          
          // Check if target user exists
          const targetUser = await (db as any).user.findUnique({
            where: { id: targetUserId },
            include: { streak: true }
          });
          
          if (!targetUser) {
            return NextResponse.json({ 
              message: "Target user not found" 
            }, { status: 404 });
          }
          
          // Check if target user has streak protection active
          const activeProtection = await (db as any).activeEffect.findFirst({
            where: {
              userId: targetUserId,
              type: "STREAK_PROTECT",
              expiresAt: { gt: new Date() }
            }
          });
          
          if (activeProtection) {
            effectMessage = "Attack failed! Target user has an active Shield of Protection.";
            effectResult = "ATTACK_BLOCKED";
          } else if (targetUser.streak && targetUser.streak.currentStreak > 0) {
            // Decrease target user's streak by 1
            await (db as any).streak.update({
              where: { userId: targetUserId },
              data: {
                currentStreak: {
                  decrement: 1
                }
              }
            });
            effectMessage = `Attack successful! You decreased ${targetUser.name}'s streak by 1.`;
            effectResult = "STREAK_DECREASED";
          } else {
            effectMessage = "Attack had no effect. Target user has no active streak.";
            effectResult = "NO_EFFECT";
          }
          break;
          
        default:
          effectMessage = "Equipment item equipped successfully.";
          effectResult = "EQUIPMENT_APPLIED";
      }
    } else if (userItem.item.type === "SPECIAL") {
      // Handle special items
      effectMessage = "Special item used successfully.";
      effectResult = "SPECIAL_EFFECT_APPLIED";
    } else {
      // Unknown item type
      effectMessage = "Item used, but effect is unknown.";
      effectResult = "UNKNOWN_EFFECT";
    }
    
    // Update userItem (decrease quantity and set lastUsed)
    await (db as any).userItem.update({
      where: {
        id: userItem.id
      },
      data: {
        quantity: { decrement: 1 },
        lastUsed: new Date()
      }
    });
    
    // Log the item use with correct fields from the schema
    await (db as any).itemUseLog.create({
      data: {
        userId: session.user.id,
        itemId: itemId,
        targetUserId: targetUserId || null,
        effect: effectResult // Use the string effect result
      }
    });
    
    // Record in item history as well
    await (db as any).itemHistory.create({
      data: {
        userId: session.user.id,
        itemId: itemId,
        targetUserId: targetUserId || null,
        action: "USE",
        effectResult: effectResult
      }
    });
    
    return NextResponse.json({
      message: "Item used successfully!",
      effect: effectMessage
    });
  } catch (error) {
    console.error("Error using item:", error);
    return NextResponse.json({ message: "Failed to use item" }, { status: 500 });
  }
} 