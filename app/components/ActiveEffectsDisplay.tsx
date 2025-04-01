"use client";

import { useState, useEffect } from "react";
import { Shield, Sword, Clock, Trophy, TimerReset } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface ActiveEffect {
  id: string;
  type: string;
  expiresAt: string;
  multiplier?: number;
  timeExtension?: number;
}

interface ActiveEffectsDisplayProps {
  userId: string;
}

export default function ActiveEffectsDisplay({ userId }: ActiveEffectsDisplayProps) {
  const [activeEffects, setActiveEffects] = useState<ActiveEffect[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch active effects
  useEffect(() => {
    const fetchActiveEffects = async () => {
      try {
        const response = await fetch(`/api/active-effects?userId=${userId}`);
        if (!response.ok) throw new Error("Failed to fetch active effects");
        const data = await response.json();
        setActiveEffects(data.activeEffects);
      } catch (error) {
        console.error("Error fetching active effects:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchActiveEffects();
    
    // Set up polling to refresh effects every minute
    const intervalId = setInterval(fetchActiveEffects, 60000);
    
    return () => clearInterval(intervalId);
  }, [userId]);

  // Calculate time remaining
  const formatTimeRemaining = (expiresAt: string): string => {
    const now = new Date();
    const expiration = new Date(expiresAt);
    const diffMs = expiration.getTime() - now.getTime();
    
    if (diffMs <= 0) return "Expired";
    
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    if (diffHours > 0) {
      return `${diffHours}h ${diffMinutes}m`;
    } else {
      return `${diffMinutes}m`;
    }
  };

  // Get effect icon and description
  const getEffectDetails = (effect: ActiveEffect) => {
    switch (effect.type) {
      case "STREAK_PROTECT":
        return {
          icon: <Shield className="h-5 w-5 text-blue-500" />,
          title: "Shield of Protection",
          description: "Your streak is protected from attacks"
        };
      case "SCORE_MULTIPLIER":
        return {
          icon: <Trophy className="h-5 w-5 text-yellow-500" />,
          title: "Score Multiplier",
          description: `${effect.multiplier}x points for uploads`
        };
      case "TIME_EXTENSION":
        return {
          icon: <TimerReset className="h-5 w-5 text-green-500" />,
          title: "Time Extension",
          description: `+${effect.timeExtension} min for meal uploads`
        };
      default:
        return {
          icon: <Clock className="h-5 w-5 text-gray-500" />,
          title: "Active Effect",
          description: "An effect is active"
        };
    }
  };

  if (loading) {
    return <div className="animate-pulse h-10 bg-gray-200 rounded-md w-full"></div>;
  }

  if (activeEffects.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-wrap gap-2 mb-4">
      <TooltipProvider>
        {activeEffects.map((effect) => {
          const { icon, title, description } = getEffectDetails(effect);
          const timeRemaining = formatTimeRemaining(effect.expiresAt);
          
          return (
            <Tooltip key={effect.id}>
              <TooltipTrigger asChild>
                <Badge 
                  variant="outline" 
                  className="py-1 px-3 flex items-center gap-1 border-2 border-primary/20 hover:border-primary/50 transition-colors"
                >
                  {icon}
                  <span className="text-xs font-medium">{timeRemaining}</span>
                </Badge>
              </TooltipTrigger>
              <TooltipContent>
                <p className="font-bold">{title}</p>
                <p className="text-xs">{description}</p>
                <p className="text-xs mt-1">Expires in: {timeRemaining}</p>
              </TooltipContent>
            </Tooltip>
          );
        })}
      </TooltipProvider>
    </div>
  );
} 