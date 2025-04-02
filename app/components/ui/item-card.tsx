'use client';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { ReactNode } from 'react';
import Image from 'next/image';
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Edit, Trash2, Clock, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

interface ItemCardProps {
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
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onToggleStatus: (id: string, status: boolean) => void;
}

export function ItemCard({
  id,
  name,
  description,
  imageUrl,
  price,
  type,
  effect,
  duration,
  cooldown,
  isActive,
  onEdit,
  onDelete,
  onToggleStatus
}: ItemCardProps) {
  // Format effect for display
  const formatEffect = (effect: string | null) => {
    if (!effect) return "None";
    return effect
      .replace(/_/g, " ")
      .split(" ")
      .map(word => word.charAt(0) + word.slice(1).toLowerCase())
      .join(" ");
  };

  // Format type for display
  const formatType = (type: string) => {
    return type
      .replace(/_/g, " ")
      .split(" ")
      .map(word => word.charAt(0) + word.slice(1).toLowerCase())
      .join(" ");
  };

  return (
    <Card className={cn(
      "overflow-hidden transition-all duration-300 group hover:shadow-md",
      !isActive && "opacity-70"
    )}>
      <div className="relative">
        <div className="w-full aspect-square overflow-hidden bg-secondary/30">
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={name}
              fill
              className="object-cover transition-transform group-hover:scale-105"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground">
              No Image
            </div>
          )}
        </div>
        
        <div className="absolute top-2 right-2 flex flex-col gap-2">
          <Badge variant={isActive ? "default" : "outline"} className="capitalize">
            {isActive ? "Active" : "Inactive"}
          </Badge>
          <Badge variant="secondary" className="capitalize">
            {formatType(type)}
          </Badge>
        </div>
      </div>
      
      <CardContent className="p-4">
        <h3 className="font-semibold text-lg line-clamp-1">{name}</h3>
        <p className="text-muted-foreground text-sm mt-1 line-clamp-2">{description}</p>
        
        <div className="mt-3 space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Price:</span>
            <span className="font-medium">{price} points</span>
          </div>
          
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Effect:</span>
            <span className="font-medium">{formatEffect(effect)}</span>
          </div>
          
          {(duration || cooldown) && (
            <div className="grid grid-cols-2 gap-2 mt-2">
              {duration && (
                <div className="flex items-center gap-1 text-xs">
                  <Clock className="h-3 w-3 text-muted-foreground" />
                  <span>Duration: {Math.floor(duration / 60)}m</span>
                </div>
              )}
              
              {cooldown && (
                <div className="flex items-center gap-1 text-xs">
                  <Zap className="h-3 w-3 text-muted-foreground" />
                  <span>Cooldown: {Math.floor(cooldown / 60)}m</span>
                </div>
              )}
            </div>
          )}
        </div>
      </CardContent>
      
      <CardFooter className="p-4 pt-0 flex justify-between gap-2">
        <Button
          variant="outline"
          size="sm"
          className="flex-1"
          onClick={() => onToggleStatus(id, !isActive)}
        >
          {isActive ? "Disable" : "Enable"}
        </Button>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onEdit(id)}
        >
          <Edit className="h-4 w-4" />
        </Button>
        
        <Button
          variant="ghost"
          size="sm"
          className="text-destructive hover:text-destructive"
          onClick={() => onDelete(id)}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </CardFooter>
    </Card>
  );
} 