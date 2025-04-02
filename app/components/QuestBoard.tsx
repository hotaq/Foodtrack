'use client';

import { useState, useEffect } from 'react';
import { Loader2, Trophy, CheckCircle, Sparkles } from 'lucide-react';
import { useToast } from '@/lib/use-toast-hook';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import SnackQuestUploader from './SnackQuestUploader';
import { HighlightGroup, HighlighterItem, Particles } from '../components/ui/highlighter';

// Define the quest types
type Quest = {
  id: string;
  title: string;
  description: string;
  type: string;
  requirement: number;
  scoreReward: number;
  isAccepted: boolean;
  isCompleted: boolean;
  progress: number;
  completedAt: string | null;
};

export default function QuestBoard() {
  const [quests, setQuests] = useState<Quest[]>([]);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState<string | null>(null);
  const { toast } = useToast();

  // Fetch quests when component mounts
  useEffect(() => {
    fetchQuests();
  }, []);

  const fetchQuests = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/quests');
      
      if (!response.ok) {
        throw new Error('Failed to fetch quests');
      }
      
      const data = await response.json();
      setQuests(data.quests);
    } catch (error) {
      console.error('Error fetching quests:', error);
      toast({
        title: 'Error',
        description: 'Failed to load quests',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const acceptQuest = async (questId: string) => {
    try {
      setAccepting(questId);
      
      const response = await fetch('/api/quests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ questId }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to accept quest');
      }
      
      toast({
        title: 'Quest Accepted! 🎯',
        description: 'You have successfully accepted this quest',
      });
      
      // Update quests state
      setQuests(quests.map(quest => 
        quest.id === questId 
          ? { ...quest, isAccepted: true } 
          : quest
      ));
      
    } catch (error) {
      console.error('Error accepting quest:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to accept quest',
        variant: 'destructive',
      });
    } finally {
      setAccepting(null);
    }
  };

  // Helper function to format quest type for display
  const formatQuestType = (type: string) => {
    return type.split('_').map(word => 
      word.charAt(0) + word.slice(1).toLowerCase()
    ).join(' ');
  };

  // Calculate progress percentage
  const getProgressPercent = (progress: number, requirement: number) => {
    return Math.min(Math.round((progress / requirement) * 100), 100);
  };

  // Create color scheme based on quest type
  const getQuestColorScheme = (type: string, title: string) => {
    if (title.toLowerCase().includes('snack')) {
      return {
        bgGradient: 'bg-gradient-to-br from-amber-50/20 to-transparent',
        border: 'border-amber-500/20',
        progress: 'bg-amber-100 [&>div]:bg-amber-500',
        badge: 'bg-amber-100 text-amber-800',
        icon: 'text-amber-500',
        button: 'bg-amber-500 hover:bg-amber-600',
        particle: '#f59e0b',
        highlight: 'before:bg-amber-500'
      };
    }
    
    if (type === 'DAILY_MEALS') {
      return {
        bgGradient: 'bg-gradient-to-br from-emerald-50/20 to-transparent',
        border: 'border-emerald-500/20',
        progress: 'bg-emerald-100 [&>div]:bg-emerald-500',
        badge: 'bg-emerald-100 text-emerald-800',
        icon: 'text-emerald-500',
        button: 'bg-emerald-500 hover:bg-emerald-600',
        particle: '#10b981',
        highlight: 'before:bg-emerald-500'
      };
    }
    
    if (type === 'STREAK') {
      return {
        bgGradient: 'bg-gradient-to-br from-blue-50/20 to-transparent',
        border: 'border-blue-500/20',
        progress: 'bg-blue-100 [&>div]:bg-blue-500',
        badge: 'bg-blue-100 text-blue-800',
        icon: 'text-blue-500',
        button: 'bg-blue-500 hover:bg-blue-600',
        particle: '#3b82f6',
        highlight: 'before:bg-blue-500'
      };
    }
    
    return {
      bgGradient: 'bg-gradient-to-br from-violet-50/20 to-transparent',
      border: 'border-violet-500/20',
      progress: 'bg-violet-100 [&>div]:bg-violet-500',
      badge: 'bg-violet-100 text-violet-800',
      icon: 'text-violet-500',
      button: 'bg-violet-500 hover:bg-violet-600',
      particle: '#8b5cf6',
      highlight: 'before:bg-violet-500'
    };
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[300px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!quests || quests.length === 0) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Daily Quests 📝</CardTitle>
          <CardDescription>
            No quests available at the moment. Check back later!
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  // Group quests by accepted status
  const activeQuests = quests.filter(quest => quest.isAccepted && !quest.isCompleted);
  const availableQuests = quests.filter(quest => !quest.isAccepted);
  const completedQuests = quests.filter(quest => quest.isCompleted);

  const activeQuestsSection = (
    <div className="space-y-4">
      {activeQuests.length === 0 ? (
        <div className="text-center py-6 bg-muted/20 rounded-lg border border-dashed border-muted">
          <div className="flex flex-col items-center justify-center space-y-2">
            <Trophy className="h-8 w-8 text-muted-foreground/50" />
            <p className="text-muted-foreground font-medium">No active quests</p>
            <p className="text-xs text-muted-foreground">Accept a quest below to get started</p>
          </div>
        </div>
      ) : (
        <div>
          {/* Show the SnackQuestUploader for active snack quests */}
          {activeQuests.some(quest => quest.title.toLowerCase().includes('snack')) && (
            <div className="mb-4">
              <SnackQuestUploader />
            </div>
          )}
          
          {/* Show regular quest cards for non-snack quests */}
          <HighlightGroup className="group space-y-4">
            {activeQuests
              .filter(quest => !quest.title.toLowerCase().includes('snack'))
              .map((quest) => {
                const colorScheme = getQuestColorScheme(quest.type, quest.title);
                return (
                  <HighlighterItem 
                    key={quest.id}
                    color={colorScheme.highlight}
                    className="group/card"
                  >
                    <Card 
                      className={`mb-4 border-2 ${colorScheme.border} ${colorScheme.bgGradient} transition-all duration-300 hover:shadow-md`}
                    >
                      <div className="relative overflow-hidden">
                        <Particles 
                          className="absolute inset-0 opacity-0 transition-opacity duration-500 group-hover/card:opacity-100" 
                          quantity={30} 
                          color={colorScheme.particle}
                        />
                        <CardHeader className="pb-2 relative z-10">
                          <div className="flex justify-between items-start">
                            <div className="flex items-center gap-2">
                              <Trophy className={`h-5 w-5 ${colorScheme.icon}`} />
                              <CardTitle className="text-lg">{quest.title}</CardTitle>
                            </div>
                            <Badge className={`ml-2 ${colorScheme.badge}`}>
                              {formatQuestType(quest.type)}
                            </Badge>
                          </div>
                          <CardDescription>{quest.description}</CardDescription>
                        </CardHeader>
                        <CardContent className="pb-2 relative z-10">
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span>Progress:</span>
                              <span className="font-medium">{quest.progress} / {quest.requirement}</span>
                            </div>
                            <Progress value={getProgressPercent(quest.progress, quest.requirement)} className={`h-2 ${colorScheme.progress}`} />
                          </div>
                        </CardContent>
                        <CardFooter className="pt-2 relative z-10">
                          <div className="flex items-center text-sm text-muted-foreground">
                            <Trophy className={`h-4 w-4 mr-1 ${colorScheme.icon}`} />
                            <span>Reward: {quest.scoreReward} points</span>
                          </div>
                        </CardFooter>
                      </div>
                    </Card>
                  </HighlighterItem>
                );
              })}
          </HighlightGroup>
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-amber-100">
            <Sparkles className="h-4 w-4 text-amber-600" />
          </span>
          Active Quests
        </h2>
        {activeQuestsSection}
      </div>

      <div>
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-blue-100">
            <CheckCircle className="h-4 w-4 text-blue-600" />
          </span>
          Available Quests
        </h2>
        {availableQuests.length === 0 ? (
          <div className="text-center py-6 bg-muted/20 rounded-lg border border-dashed border-muted">
            <div className="flex flex-col items-center justify-center space-y-2">
              <CheckCircle className="h-8 w-8 text-muted-foreground/50" />
              <p className="text-muted-foreground font-medium">No quests available</p>
              <p className="text-xs text-muted-foreground">Check back later for new quests</p>
            </div>
          </div>
        ) : (
          <HighlightGroup className="group grid gap-4 md:grid-cols-2">
            {availableQuests.map(quest => {
              const colorScheme = getQuestColorScheme(quest.type, quest.title);
              return (
                <HighlighterItem 
                  key={quest.id}
                  highlightColor={colorScheme.highlight}
                  className="group/card"
                >
                  <Card 
                    className={`border-2 ${colorScheme.border} ${colorScheme.bgGradient} transition-all duration-300 hover:shadow-md relative overflow-hidden`}
                  >
                    <Particles 
                      className="absolute inset-0 opacity-0 transition-opacity duration-500 group-hover/card:opacity-100" 
                      quantity={30} 
                      color={colorScheme.particle}
                      staticity={80}
                    />
                    <CardHeader className="pb-2 relative z-10">
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-2">
                          <Trophy className={`h-5 w-5 ${colorScheme.icon}`} />
                          <CardTitle className="text-lg">{quest.title}</CardTitle>
                        </div>
                        <Badge className={`ml-2 ${colorScheme.badge}`}>
                          {formatQuestType(quest.type)}
                        </Badge>
                      </div>
                      <CardDescription>{quest.description}</CardDescription>
                    </CardHeader>
                    <CardContent className="pb-2 relative z-10">
                      <div className="flex justify-between text-sm">
                        <span>Target:</span>
                        <span className="font-medium">{quest.requirement} {quest.type === 'DAILY_MEALS' ? 'meals' : 'items'}</span>
                      </div>
                    </CardContent>
                    <CardFooter className="pt-2 flex justify-between items-center relative z-10">
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Trophy className={`h-4 w-4 mr-1 ${colorScheme.icon}`} />
                        <span>Reward: {quest.scoreReward} points</span>
                      </div>
                      <Button 
                        size="sm" 
                        onClick={() => acceptQuest(quest.id)}
                        disabled={accepting === quest.id}
                        className={colorScheme.button}
                      >
                        {accepting === quest.id ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Accepting...
                          </>
                        ) : (
                          'Accept'
                        )}
                      </Button>
                    </CardFooter>
                  </Card>
                </HighlighterItem>
              );
            })}
          </HighlightGroup>
        )}
      </div>

      {completedQuests.length > 0 && (
        <div>
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-green-100">
              <CheckCircle className="h-4 w-4 text-green-600" />
            </span>
            Completed Quests
          </h2>
          <HighlightGroup className="group grid gap-4 md:grid-cols-2">
            {completedQuests.map(quest => {
              return (
                <HighlighterItem 
                  key={quest.id}
                  highlightColor="before:bg-green-500"
                  className="group/card opacity-80 hover:opacity-100 transition-opacity duration-300"
                >
                  <Card 
                    className="border-2 border-green-500/20 bg-gradient-to-br from-green-50/20 to-transparent transition-all duration-300 hover:shadow-md relative overflow-hidden"
                  >
                    <Particles 
                      className="absolute inset-0 opacity-0 transition-opacity duration-500 group-hover/card:opacity-100" 
                      quantity={30} 
                      color="#22c55e"
                      staticity={80}
                    />
                    <CardHeader className="pb-2 relative z-10">
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-2">
                          <Trophy className="h-5 w-5 text-green-500" />
                          <CardTitle className="text-lg">{quest.title}</CardTitle>
                        </div>
                        <Badge className="bg-green-100 text-green-800">
                          Completed
                        </Badge>
                      </div>
                      <CardDescription>{quest.description}</CardDescription>
                    </CardHeader>
                    <CardContent className="pb-2 relative z-10">
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Completed on:</span>
                          <span className="font-medium">
                            {quest.completedAt ? new Date(quest.completedAt).toLocaleDateString() : 'Unknown'}
                          </span>
                        </div>
                        <Progress value={100} className="h-2 bg-green-100 [&>div]:bg-green-500" />
                      </div>
                    </CardContent>
                    <CardFooter className="pt-2 relative z-10">
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Trophy className="h-4 w-4 mr-1 text-green-500" />
                        <span>Reward: {quest.scoreReward} points</span>
                      </div>
                    </CardFooter>
                  </Card>
                </HighlighterItem>
              );
            })}
          </HighlightGroup>
        </div>
      )}
    </div>
  );
} 