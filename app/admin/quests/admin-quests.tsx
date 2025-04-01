"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/lib/use-toast-hook";
import { AlertTriangle, Trophy, Users, CheckCircle, PlusCircle, RefreshCw, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// Define quest types
type QuestType = "MEAL_UPLOAD" | "STREAK_ACHIEVEMENT" | "ITEM_USE" | "ITEM_PURCHASE" | "SPECIAL_EVENT";

interface Quest {
  id: string;
  title: string;
  description: string;
  type: QuestType;
  requirement: number;
  scoreReward: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  _count: {
    userQuests: number;
  };
}

interface AdminQuestPageProps {
  quests: Quest[];
  activeQuestsCount: number;
  totalUserQuestsCount: number;
  completedQuestsCount: number;
}

export default function AdminQuestPage({ 
  quests, 
  activeQuestsCount, 
  totalUserQuestsCount, 
  completedQuestsCount 
}: AdminQuestPageProps) {
  const [isCreatingQuest, setIsCreatingQuest] = useState(false);
  const [newQuest, setNewQuest] = useState({
    title: "",
    description: "",
    type: "MEAL_UPLOAD" as QuestType,
    requirement: 1,
    scoreReward: 5,
    isActive: true
  });
  const [isSeedingQuests, setIsSeedingQuests] = useState(false);
  const [isUpdating, setIsUpdating] = useState<string | null>(null);
  const { toast } = useToast();

  // Seed quests handler
  const handleSeedQuests = async () => {
    try {
      setIsSeedingQuests(true);
      const response = await fetch("/api/seed-quests", {
        method: "POST",
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || "Failed to seed quests");
      }
      
      toast({
        title: "Quests seeded successfully! 🌱",
        description: `Created ${data.count} sample quests.`,
      });
      
      // Refresh the page to show the new quests
      window.location.reload();
    } catch (error) {
      console.error("Error seeding quests:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to seed quests",
        variant: "destructive",
      });
    } finally {
      setIsSeedingQuests(false);
    }
  };

  // Create quest handler
  const handleCreateQuest = async () => {
    try {
      setIsCreatingQuest(true);
      
      // Validate inputs
      if (!newQuest.title || !newQuest.description || !newQuest.type) {
        toast({
          title: "Missing fields",
          description: "Please fill in all required fields",
          variant: "destructive",
        });
        return;
      }
      
      const response = await fetch("/api/admin/quests", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newQuest),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || "Failed to create quest");
      }
      
      toast({
        title: "Quest created! 🏆",
        description: "The new quest has been added successfully",
      });
      
      // Reset form and close dialog
      setNewQuest({
        title: "",
        description: "",
        type: "MEAL_UPLOAD" as QuestType,
        requirement: 1,
        scoreReward: 5,
        isActive: true
      });
      
      // Refresh the page to show the new quest
      window.location.reload();
    } catch (error) {
      console.error("Error creating quest:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create quest",
        variant: "destructive",
      });
    } finally {
      setIsCreatingQuest(false);
    }
  };

  // Toggle quest active status
  const toggleQuestStatus = async (questId: string, currentStatus: boolean) => {
    try {
      setIsUpdating(questId);
      
      const response = await fetch("/api/admin/quests", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          questId,
          isActive: !currentStatus,
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || "Failed to update quest");
      }
      
      toast({
        title: "Quest updated! 🔄",
        description: `Quest is now ${!currentStatus ? "active" : "inactive"}`,
      });
      
      // Refresh the page to show the updated quest
      window.location.reload();
    } catch (error) {
      console.error("Error updating quest:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update quest",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(null);
    }
  };

  // Delete quest handler
  const handleDeleteQuest = async (questId: string) => {
    if (!confirm("Are you sure you want to delete this quest? This will also remove all user progress for this quest.")) {
      return;
    }
    
    try {
      setIsUpdating(questId);
      
      const response = await fetch(`/api/admin/quests?id=${questId}`, {
        method: "DELETE",
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || "Failed to delete quest");
      }
      
      toast({
        title: "Quest deleted! 🗑️",
        description: "The quest has been removed successfully",
      });
      
      // Refresh the page to show the updated list
      window.location.reload();
    } catch (error) {
      console.error("Error deleting quest:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete quest",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(null);
    }
  };

  // Format quest type for display
  const formatQuestType = (type: string) => {
    return type.split('_').map(word => 
      word.charAt(0) + word.slice(1).toLowerCase()
    ).join(' ');
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Quest Management 🏆</h1>
          <p className="text-muted-foreground mt-1">Create and manage quests for users</p>
        </div>
        <div className="flex space-x-3">
          <Button 
            variant="outline" 
            onClick={handleSeedQuests}
            disabled={isSeedingQuests}
          >
            {isSeedingQuests ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Seeding...
              </>
            ) : (
              <>
                <AlertTriangle className="mr-2 h-4 w-4" />
                Seed Sample Quests
              </>
            )}
          </Button>
          
          <Dialog>
            <DialogTrigger asChild>
              <Button>
                <PlusCircle className="mr-2 h-4 w-4" />
                Create Quest
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Create New Quest</DialogTitle>
                <DialogDescription>
                  Add a new quest for users to complete and earn rewards
                </DialogDescription>
              </DialogHeader>
              
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="title">Quest Title</Label>
                  <Input 
                    id="title" 
                    value={newQuest.title}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewQuest({...newQuest, title: e.target.value})}
                    placeholder="e.g., Daily Meal Tracker" 
                  />
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea 
                    id="description" 
                    value={newQuest.description}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNewQuest({...newQuest, description: e.target.value})}
                    placeholder="What users need to do to complete this quest" 
                  />
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="type">Quest Type</Label>
                  <Select 
                    value={newQuest.type}
                    onValueChange={(value: string) => setNewQuest({...newQuest, type: value as QuestType})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select quest type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MEAL_UPLOAD">Meal Upload</SelectItem>
                      <SelectItem value="STREAK_ACHIEVEMENT">Streak Achievement</SelectItem>
                      <SelectItem value="ITEM_USE">Item Use</SelectItem>
                      <SelectItem value="ITEM_PURCHASE">Item Purchase</SelectItem>
                      <SelectItem value="SPECIAL_EVENT">Special Event</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="requirement">Requirement</Label>
                    <Input 
                      id="requirement" 
                      type="number"
                      min="1"
                      value={newQuest.requirement}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewQuest({...newQuest, requirement: parseInt(e.target.value) || 1})}
                    />
                  </div>
                  
                  <div className="grid gap-2">
                    <Label htmlFor="scoreReward">Score Reward</Label>
                    <Input 
                      id="scoreReward" 
                      type="number"
                      min="1"
                      value={newQuest.scoreReward}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewQuest({...newQuest, scoreReward: parseInt(e.target.value) || 1})}
                    />
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Switch 
                    id="isActive" 
                    checked={newQuest.isActive}
                    onCheckedChange={(checked: boolean) => setNewQuest({...newQuest, isActive: checked})}
                  />
                  <Label htmlFor="isActive">Active quest</Label>
                </div>
              </div>
              
              <DialogFooter>
                <Button type="submit" onClick={handleCreateQuest} disabled={isCreatingQuest}>
                  {isCreatingQuest ? (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : "Create Quest"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          
          <Link href="/admin">
            <Button variant="secondary">Back to Dashboard</Button>
          </Link>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center">
              <Trophy className="mr-2 h-5 w-5 text-primary" />
              Active Quests
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{activeQuestsCount}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center">
              <Users className="mr-2 h-5 w-5 text-primary" />
              In-Progress Quests
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{totalUserQuestsCount}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center">
              <CheckCircle className="mr-2 h-5 w-5 text-primary" />
              Completed Quests
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{completedQuestsCount}</p>
          </CardContent>
        </Card>
      </div>
      
      <div className="bg-card rounded-lg p-6">
        <h2 className="text-xl font-bold mb-4">All Quests</h2>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left pb-2">Title</th>
                <th className="text-left pb-2">Type</th>
                <th className="text-left pb-2">Requirement</th>
                <th className="text-left pb-2">Reward</th>
                <th className="text-left pb-2">User Count</th>
                <th className="text-left pb-2">Status</th>
                <th className="text-right pb-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {quests.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-4 text-center text-muted-foreground">
                    No quests found. Create one or seed sample quests.
                  </td>
                </tr>
              ) : (
                quests.map(quest => (
                  <tr key={quest.id} className="border-b">
                    <td className="py-3">
                      <div>
                        <p className="font-medium">{quest.title}</p>
                        <p className="text-sm text-muted-foreground truncate max-w-[200px]">
                          {quest.description}
                        </p>
                      </div>
                    </td>
                    <td className="py-3">
                      {formatQuestType(quest.type)}
                    </td>
                    <td className="py-3">
                      {quest.requirement}
                    </td>
                    <td className="py-3">
                      {quest.scoreReward} points
                    </td>
                    <td className="py-3">
                      {quest._count.userQuests || 0}
                    </td>
                    <td className="py-3">
                      <span className={`px-2 py-1 rounded-full text-xs ${quest.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                        {quest.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="py-3 text-right">
                      <div className="flex justify-end space-x-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => toggleQuestStatus(quest.id, quest.isActive)}
                          disabled={isUpdating === quest.id}
                        >
                          {isUpdating === quest.id ? (
                            <RefreshCw className="h-4 w-4 animate-spin" />
                          ) : (
                            quest.isActive ? 'Disable' : 'Enable'
                          )}
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="text-destructive hover:bg-destructive hover:text-destructive-foreground"
                          onClick={() => handleDeleteQuest(quest.id)}
                          disabled={isUpdating === quest.id}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
} 