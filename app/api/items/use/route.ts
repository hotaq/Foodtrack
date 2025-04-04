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
    
    // Check if user has the item with sufficient quantity
    const userItem = await db.userItem.findFirst({
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
      const lastUsedDate = new Date(userItem.lastUsed);
      // Convert to milliseconds for accurate cooldown calculation
      const cooldownMs = userItem.item.cooldown * 1000; 
      const currentTime = new Date().getTime();
      const elapsedMs = currentTime - lastUsedDate.getTime();
      const remainingMs = Math.max(0, cooldownMs - elapsedMs);
      
      // Check if the user is an admin
      const user = await db.user.findUnique({
        where: { id: userId },
        select: { role: true }
      });
      const isAdmin = user && user.role === "ADMIN";
      
      // Allow admins to bypass cooldown
      if (!isAdmin && remainingMs > 0) {
        const minutes = Math.floor(remainingMs / 60000);
        const seconds = Math.floor((remainingMs % 60000) / 1000);
        const timeDisplay = `${minutes}m ${seconds}s`;
        
        console.log(`Item ${userItem.item.name} is on cooldown. Remaining: ${timeDisplay}`);
        
        return NextResponse.json({ 
          message: `This item is on cooldown. Please wait ${timeDisplay} before using it again.`,
          remainingTime: {
            ms: remainingMs,
            minutes,
            seconds
          }
        }, { status: 400 });
      }
    }
    
    // Process different item types and effects
    let effectMessage = null;
    let effectResult = null;
    
    // Get user's score
    
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
          
        case "ATTACK_BOOST":
          // Create an active effect for attack boost
          await (db as any).activeEffect.create({
            data: {
              userId,
              itemId,
              type: "ATTACK_BOOST",
              multiplier: 2.0, // 2x attack power
              expiresAt: new Date(Date.now() + (userItem.item.duration || 3600) * 1000),
            }
          });
          effectMessage = "Attack Boost activated! Your attack power is now doubled for a limited time.";
          effectResult = "ATTACK_BOOST_APPLIED";
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
          
          // Check if the attacking user has ATTACK_BOOST active
          const attackerBoost = await (db as any).activeEffect.findFirst({
            where: {
              userId: userId,
              type: "ATTACK_BOOST",
              expiresAt: { gt: new Date() }
            }
          });
          
          // Check if target user has streak protection active
          const activeProtection = await (db as any).activeEffect.findFirst({
            where: {
              userId: targetUserId,
              type: "STREAK_PROTECT",
              expiresAt: { gt: new Date() }
            }
          });
          
          // If the target has protection but the attacker has a Power Sword,
          // the protection is bypassed
          const protectionBypassed = activeProtection && attackerBoost;
          
          if (activeProtection && !protectionBypassed) {
            // Protection works - attack is blocked
            effectMessage = "Attack failed! Target user has an active Shield of Protection.";
            effectResult = "ATTACK_BLOCKED";
          } else if (protectionBypassed) {
            // Power Sword broke through the shield!
            console.log("Power Sword bypassed Shield of Protection!");
            
            // For Magic Wand with Power Sword boost, decrease by a larger amount (2-5)
            const basePower = attackerBoost ? 2 : 1;
            const decreaseAmount = Math.floor(Math.random() * 3) + basePower; // 2-4 or 1-3
            const newStreak = Math.max(0, targetUser.streak.currentStreak - decreaseAmount);
            
            // Update the target user's streak
            await (db as any).streak.update({
              where: { userId: targetUserId },
              data: {
                currentStreak: newStreak
              }
            });
            
            effectMessage = `Power Sword broke through the Shield of Protection! You decreased ${targetUser.name}'s streak by ${decreaseAmount} points!`;
            effectResult = "PROTECTION_BYPASSED_STREAK_DECREASED";
          } else if (targetUser.streak && targetUser.streak.currentStreak > 0) {
            // No protection - normal attack
            // Calculate decrease amount: enhanced if attacker has Power Sword
            const basePower = attackerBoost ? 2 : 1;
            const decreaseAmount = Math.floor(Math.random() * 3) + basePower; // 2-4 or 1-3
            const newStreak = Math.max(0, targetUser.streak.currentStreak - decreaseAmount);
            
            // Update the target user's streak
            await (db as any).streak.update({
              where: { userId: targetUserId },
              data: {
                currentStreak: newStreak
              }
            });
            
            const attackTypeMsg = attackerBoost ? "Power Sword enhanced attack" : "attack";
            effectMessage = `${attackTypeMsg} successful! You decreased ${targetUser.name}'s streak by ${decreaseAmount} points!`;
            effectResult = "STREAK_DECREASED";
          } else {
            effectMessage = "Attack had no effect. Target user has no active streak.";
            effectResult = "NO_EFFECT";
          }
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
          // Duration is stored in hours in the database, convert to seconds for calculation
          // 1 hour = 3600 seconds
          const durationInSeconds = userItem.item.duration ? userItem.item.duration * 3600 : 86400; // Default 24 hours
          await (db as any).activeEffect.create({
            data: {
              userId,
              itemId,
              type: "STREAK_PROTECT",
              expiresAt: new Date(Date.now() + durationInSeconds * 1000), // Convert seconds to milliseconds
            }
          });
          const durationHours = Math.floor(durationInSeconds / 3600);
          effectMessage = `Shield of Protection activated! Your streak is now protected from attacks for ${durationHours} hours.`;
          effectResult = "STREAK_PROTECTION_APPLIED";
          break;
          
        case "ATTACK_BOOST":
          // Create an active effect for attack boost
          const attackBoostDuration = userItem.item.duration ? userItem.item.duration * 3600 : 86400; // Default 24 hours
          await (db as any).activeEffect.create({
            data: {
              userId,
              itemId,
              type: "ATTACK_BOOST",
              multiplier: 2.0, // 2x attack power
              expiresAt: new Date(Date.now() + attackBoostDuration * 1000), // Convert seconds to milliseconds
            }
          });
          const boostHours = Math.floor(attackBoostDuration / 3600);
          effectMessage = `Power Sword activated! Your attack power is now doubled for ${boostHours} hours.`;
          effectResult = "ATTACK_BOOST_APPLIED";
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
    // Make sure we don't go below 0
    const updatedQuantity = Math.max(0, userItem.quantity - 1);
    
    // Update the userItem with current timestamp for lastUsed
    const currentTime = new Date();
    
    // Extra debug logs for STREAK_DECREASE items
    if (userItem.item.effect === "STREAK_DECREASE") {
      console.log(`[Magic Wand Debug] Setting lastUsed for ${userItem.id}:`);
      console.log(`- Current time: ${currentTime.toISOString()}`);
      console.log(`- Previous lastUsed: ${userItem.lastUsed ? new Date(userItem.lastUsed).toISOString() : 'null'}`);
      console.log(`- Cooldown period: ${userItem.item.cooldown || 0} seconds`);
    }
    
    await (db as any).userItem.update({
      where: {
        id: userItem.id
      },
      data: {
        quantity: updatedQuantity,
        lastUsed: currentTime
      }
    });
    
    // Double-check the lastUsed was set properly for STREAK_DECREASE items
    if (userItem.item.effect === "STREAK_DECREASE") {
      const updatedItem = await (db as any).userItem.findUnique({
        where: { id: userItem.id },
        select: { lastUsed: true }
      });
      
      console.log(`[Magic Wand Debug] Verified lastUsed after update: ${updatedItem.lastUsed ? new Date(updatedItem.lastUsed).toISOString() : 'null'}`);
    }
    
    console.log(`Item used at ${currentTime.toISOString()}, cooldown period: ${userItem.item.cooldown || 0} seconds`);
    
    // Log the item use with correct fields from the schema
    await (db as any).itemUseLog.create({
      data: {
        userId: session.user.id,
        itemId: itemId,
        targetUserId: targetUserId || null,
        effect: effectResult, // Use the string effect result
        createdAt: currentTime // Ensure the timestamp matches the lastUsed
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