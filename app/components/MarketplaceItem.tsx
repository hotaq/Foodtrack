"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart, Check, AlertCircle, Clock } from "lucide-react";
import { useToast } from "@/lib/use-toast-hook";

interface MarketplaceItemProps {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  price: number;
  type: string;
  effect: string | null;
  duration: number | null;
  cooldown: number | null;
  userOwns: boolean;
  quantity: number;
  lastUsed: string | null;
  canAfford: boolean;
  isAdmin: boolean;
  onPurchase: (itemId: string) => Promise<void>;
  onUse: (itemId: string) => Promise<void>;
}

export function MarketplaceItem({
  id,
  name,
  description,
  imageUrl,
  price,
  type,
  effect,
  duration,
  cooldown,
  userOwns,
  quantity,
  lastUsed,
  canAfford,
  isAdmin,
  onPurchase,
  onUse
}: MarketplaceItemProps) {
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [isUsing, setIsUsing] = useState(false);
  const { toast } = useToast();

  // Check if the item is on cooldown
  const isOnCooldown = () => {
    // Admin bypass: Return false immediately for admins
    if (isAdmin) return false;
    
    if (!lastUsed || !cooldown) return false;
    
    const lastUsedDate = new Date(lastUsed);
    const cooldownTimeMs = cooldown * 1000; // Convert seconds to milliseconds
    const currentTime = new Date().getTime();
    const elapsedTime = currentTime - lastUsedDate.getTime();
    
    // Debug cooldown calculation
    console.log(`[${name}] Cooldown check:`);
    console.log(`- Last used: ${lastUsedDate.toISOString()}`);
    console.log(`- Cooldown: ${cooldown} seconds (${cooldownTimeMs}ms)`);
    console.log(`- Current time: ${new Date().toISOString()}`);
    console.log(`- Elapsed time: ${elapsedTime}ms (${Math.floor(elapsedTime/1000)}s)`);
    console.log(`- Is on cooldown: ${elapsedTime < cooldownTimeMs}`);
    
    // If elapsed time is less than cooldown time, item is still on cooldown
    return elapsedTime < cooldownTimeMs;
  };

  // Calculate remaining cooldown time
  const getRemainingCooldown = () => {
    if (!lastUsed || !cooldown) return null;
    
    const lastUsedDate = new Date(lastUsed);
    const cooldownTimeMs = cooldown * 1000; // Convert seconds to milliseconds
    const currentTime = new Date().getTime();
    const elapsedTime = currentTime - lastUsedDate.getTime();
    
    if (elapsedTime < cooldownTimeMs) {
      const remainingTime = cooldownTimeMs - elapsedTime;
      const minutes = Math.floor(remainingTime / 60000);
      const seconds = Math.floor((remainingTime % 60000) / 1000);
      
      return `${minutes}m ${seconds}s`;
    }
    
    return null;
  };

  // Handle purchase
  const handlePurchase = async () => {
    try {
      setIsPurchasing(true);
      await onPurchase(id);
    } catch (error) {
      console.error("Error purchasing item:", error);
      toast({
        title: "Error",
        description: "Failed to purchase item. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsPurchasing(false);
    }
  };

  // Handle use
  const handleUse = async () => {
    // Check if item is on cooldown before attempting to use it
    if (isOnCooldown()) {
      const cooldownText = getRemainingCooldown();
      toast({
        title: "Item on Cooldown",
        description: `This item cannot be used yet. Please wait ${cooldownText} before using it again.`,
        variant: "destructive",
      });
      return;
    }

    try {
      setIsUsing(true);
      await onUse(id);
    } catch (error) {
      console.error("Error using item:", error);
      toast({
        title: "Error",
        description: "Failed to use item. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUsing(false);
    }
  };

  // Format item type for display
  const formatItemType = (itemType: string) => {
    return itemType.charAt(0) + itemType.slice(1).toLowerCase().replace(/_/g, ' ');
  };

  // Format effect for display
  const formatEffect = (itemEffect: string | null) => {
    if (!itemEffect) return "None";
    return itemEffect.split('_').map(word => 
      word.charAt(0) + word.slice(1).toLowerCase()
    ).join(' ');
  };

  // Debug cooldown info when component renders
  useEffect(() => {
    if (lastUsed && cooldown && effect === "STREAK_DECREASE") {
      const lastUsedDate = new Date(lastUsed);
      const cooldownTimeMs = cooldown * 1000;
      const currentTime = new Date().getTime();
      const elapsedTime = currentTime - lastUsedDate.getTime();
      const remainingTime = cooldownTimeMs - elapsedTime;
      
      console.log(`[COOLDOWN DEBUG] ${name} (${effect}):`);
      console.log(`- Last used: ${lastUsedDate.toISOString()}`);
      console.log(`- Cooldown setting: ${cooldown} seconds`);
      console.log(`- Current time: ${new Date().toISOString()}`);
      console.log(`- Elapsed time: ${Math.round(elapsedTime/1000)}s / ${cooldown}s`);
      console.log(`- Remaining time: ${Math.max(0, Math.round(remainingTime/1000))}s`);
      console.log(`- Should be on cooldown: ${elapsedTime < cooldownTimeMs}`);
      console.log(`- Component reports on cooldown: ${isOnCooldown()}`);
    }
  }, [lastUsed, cooldown, name, effect, isOnCooldown]);

  const cooldownRemaining = getRemainingCooldown();
  const onCooldown = isOnCooldown();

  return (
    <Card className="h-full flex flex-col hover:shadow-md transition-shadow">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg">{name}</CardTitle>
          <Badge variant={type === "CONSUMABLE" ? "secondary" : "outline"}>
            {formatItemType(type)}
          </Badge>
        </div>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="flex-grow">
        <div className="relative h-40 w-full mb-4">
          <Image
            src={imageUrl}
            alt={name}
            fill
            className="object-contain rounded-md"
          />
        </div>
        
        <div className="space-y-2 text-sm">
          {effect && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Effect:</span>
              <span className="font-medium">{formatEffect(effect)}</span>
            </div>
          )}
          
          {duration && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Duration:</span>
              <span className="font-medium">{Math.floor(duration / 60)} minutes</span>
            </div>
          )}
          
          {cooldown && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Cooldown:</span>
              <span className="font-medium">{Math.floor(cooldown / 60)} minutes</span>
            </div>
          )}
          
          {userOwns && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Owned:</span>
              <span className="font-medium">{quantity}</span>
            </div>
          )}
        </div>
      </CardContent>
      
      <CardFooter className="pt-2 border-t flex justify-between items-center">
        <div className="font-bold text-primary">
          {price} points
        </div>
        
        {userOwns ? (
          <Button 
            onClick={handleUse} 
            disabled={isUsing || onCooldown || quantity <= 0}
            variant={onCooldown ? "outline" : "default"}
            size="sm"
          >
            {isUsing ? (
              "Using..."
            ) : onCooldown ? (
              <div className="flex items-center space-x-1">
                <Clock className="h-4 w-4 mr-1" />
                <span className="text-xs whitespace-nowrap">Cooldown: {cooldownRemaining}</span>
              </div>
            ) : quantity <= 0 ? (
              "Out of Stock"
            ) : (
              <>
                <Check className="h-4 w-4 mr-1" />
                {isAdmin ? "Use (Admin)" : "Use"}
              </>
            )}
          </Button>
        ) : (
          <Button 
            onClick={handlePurchase} 
            disabled={isPurchasing || (!canAfford && !isAdmin)}
            variant={canAfford || isAdmin ? "default" : "outline"}
            size="sm"
          >
            {isPurchasing ? (
              "Buying..."
            ) : isAdmin ? (
              <>
                <ShoppingCart className="h-4 w-4 mr-1" />
                Buy (Admin)
              </>
            ) : canAfford ? (
              <>
                <ShoppingCart className="h-4 w-4 mr-1" />
                Buy
              </>
            ) : (
              <>
                <AlertCircle className="h-4 w-4 mr-1" />
                Can&apos;t Afford
              </>
            )}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
} 