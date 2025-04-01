'use client';

import { useState, useEffect } from 'react';
import { useToast } from '@/lib/use-toast-hook';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Clock, Trophy, CheckCircle } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

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

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold mb-4">Active Quests 🔥</h2>
        {activeQuests.length === 0 ? (
          <p className="text-muted-foreground text-sm">You don't have any active quests. Accept some quests below!</p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {activeQuests.map(quest => (
              <Card key={quest.id} className="border-l-4 border-l-primary">
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg">{quest.title}</CardTitle>
                    <Badge variant="outline" className="ml-2">
                      {formatQuestType(quest.type)}
                    </Badge>
                  </div>
                  <CardDescription>{quest.description}</CardDescription>
                </CardHeader>
                <CardContent className="pb-2">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Progress:</span>
                      <span className="font-medium">{quest.progress} / {quest.requirement}</span>
                    </div>
                    <Progress value={getProgressPercent(quest.progress, quest.requirement)} />
                  </div>
                </CardContent>
                <CardFooter className="pt-2">
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Trophy className="h-4 w-4 mr-1" />
                    <span>Reward: {quest.scoreReward} points</span>
                  </div>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>

      <div>
        <h2 className="text-xl font-bold mb-4">Available Quests 📋</h2>
        {availableQuests.length === 0 ? (
          <p className="text-muted-foreground text-sm">No new quests available right now. Check back later!</p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {availableQuests.map(quest => (
              <Card key={quest.id}>
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg">{quest.title}</CardTitle>
                    <Badge variant="outline" className="ml-2">
                      {formatQuestType(quest.type)}
                    </Badge>
                  </div>
                  <CardDescription>{quest.description}</CardDescription>
                </CardHeader>
                <CardContent className="pb-2">
                  <div className="flex justify-between text-sm">
                    <span>Target:</span>
                    <span className="font-medium">{quest.requirement} {quest.type === 'DAILY_MEALS' ? 'meals' : 'items'}</span>
                  </div>
                </CardContent>
                <CardFooter className="pt-2 flex justify-between items-center">
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Trophy className="h-4 w-4 mr-1" />
                    <span>Reward: {quest.scoreReward} points</span>
                  </div>
                  <Button 
                    size="sm" 
                    onClick={() => acceptQuest(quest.id)}
                    disabled={accepting === quest.id}
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
            ))}
          </div>
        )}
      </div>

      {completedQuests.length > 0 && (
        <div>
          <h2 className="text-xl font-bold mb-4">Completed Quests ✅</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {completedQuests.map(quest => (
              <Card key={quest.id} className="border-l-4 border-l-green-500 bg-green-50/10">
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg">{quest.title}</CardTitle>
                    <Badge variant="outline" className="ml-2 bg-green-100 text-green-800">
                      Completed
                    </Badge>
                  </div>
                  <CardDescription>{quest.description}</CardDescription>
                </CardHeader>
                <CardContent className="pb-2">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Completed:</span>
                      <span className="font-medium">
                        {quest.completedAt ? new Date(quest.completedAt).toLocaleDateString() : 'Unknown'}
                      </span>
                    </div>
                    <Progress value={100} className="bg-green-100" />
                  </div>
                </CardContent>
                <CardFooter className="pt-2">
                  <div className="flex items-center text-sm text-green-600">
                    <CheckCircle className="h-4 w-4 mr-1" />
                    <span>Earned: {quest.scoreReward} points</span>
                  </div>
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
} 