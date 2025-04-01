"use client";

import { useState } from "react";
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
  onPurchase,
  onUse
}: MarketplaceItemProps) {
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [isUsing, setIsUsing] = useState(false);
  const { toast } = useToast();

  // Check if the item is on cooldown
  const isOnCooldown = () => {
    if (!lastUsed || !cooldown) return false;
    
    const lastUsedDate = new Date(lastUsed);
    const cooldownTime = cooldown * 1000; // Convert seconds to milliseconds
    const currentTime = new Date().getTime();
    
    return (currentTime - lastUsedDate.getTime()) < cooldownTime;
  };

  // Calculate remaining cooldown time
  const getRemainingCooldown = () => {
    if (!lastUsed || !cooldown) return null;
    
    const lastUsedDate = new Date(lastUsed);
    const cooldownTime = cooldown * 1000; // Convert seconds to milliseconds
    const currentTime = new Date().getTime();
    const elapsedTime = currentTime - lastUsedDate.getTime();
    
    if (elapsedTime < cooldownTime) {
      const remainingTime = cooldownTime - elapsedTime;
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
                <span>{cooldownRemaining}</span>
              </div>
            ) : quantity <= 0 ? (
              "Out of Stock"
            ) : (
              <>
                <Check className="h-4 w-4 mr-1" />
                Use
              </>
            )}
          </Button>
        ) : (
          <Button 
            onClick={handlePurchase} 
            disabled={isPurchasing || !canAfford}
            variant={canAfford ? "default" : "outline"}
            size="sm"
          >
            {isPurchasing ? (
              "Buying..."
            ) : canAfford ? (
              <>
                <ShoppingCart className="h-4 w-4 mr-1" />
                Buy
              </>
            ) : (
              <>
                <AlertCircle className="h-4 w-4 mr-1" />
                Can't Afford
              </>
            )}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
} 