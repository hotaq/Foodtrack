"use client";

import React, { useState, useRef } from "react";
import { 
  Award, 
  Check, 
  ChevronDown, 
  Copy, 
  Edit, 
  Filter, 
  Flame, 
  Plus, 
  RefreshCw, 
  Search, 
  Star, 
  Trophy, 
  Users,
  Loader2,
  AlertCircle
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BentoCard } from "@/components/ui/bento-card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/lib/use-toast-hook";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// Define types
interface QuestType {
  id: string;
  title: string;
  description: string;
  scoreReward: number;
  imageUrl: string | null;
  type: string;
  requirement: number;
  isActive: boolean;
  startDate: string | null;
  endDate: string | null;
  frequency: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  _count: {
    userQuests: number;
  };
}

interface AdminQuestPageProps {
  quests: QuestType[];
  activeQuestsCount: number;
  totalUserQuestsCount: number;
  completedQuestsCount: number;
}

export default function AdminQuestPage({ 
  quests, 
  activeQuestsCount, 
  totalUserQuestsCount, 
  completedQuestsCount,
}: AdminQuestPageProps) {
  // State management
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredQuests, setFilteredQuests] = useState<QuestType[]>(quests);
  const [showOnlyActive, setShowOnlyActive] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentQuest, setCurrentQuest] = useState<QuestType | null>(null);
  const [activeTab, setActiveTab] = useState("all");
  const [saving, setSaving] = useState(false);
  const [isQuestActive, setIsQuestActive] = useState(true);
  const [startDateTime, setStartDateTime] = useState<string>(
    currentQuest?.startDate ? new Date(currentQuest.startDate).toISOString().slice(0, 16) : ""
  );
  const [endDateTime, setEndDateTime] = useState<string>(
    currentQuest?.endDate ? new Date(currentQuest.endDate).toISOString().slice(0, 16) : ""
  );
  const [frequency, setFrequency] = useState<string>(currentQuest?.frequency || "UNLIMITED");

  // Add a ref to store the selected frequency value
  const frequencyRef = useRef<string>(currentQuest?.frequency || "UNLIMITED");

  // Filter quests based on search term and active status
  React.useEffect(() => {
    let result = quests;
    
    if (searchTerm) {
      result = result.filter(quest => 
        quest.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        quest.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (showOnlyActive) {
      result = result.filter(quest => quest.isActive);
    }
    
    if (activeTab === "active") {
      result = result.filter(quest => quest.isActive);
    } else if (activeTab === "inactive") {
      result = result.filter(quest => !quest.isActive);
    }
    
    setFilteredQuests(result);
  }, [quests, searchTerm, showOnlyActive, activeTab]);

  // Update state when current quest changes
  React.useEffect(() => {
    if (currentQuest) {
      setStartDateTime(currentQuest.startDate ? new Date(currentQuest.startDate).toISOString().slice(0, 16) : "");
      setEndDateTime(currentQuest.endDate ? new Date(currentQuest.endDate).toISOString().slice(0, 16) : "");
      setIsQuestActive(currentQuest.isActive);
      if (isDialogOpen) {
        const newFrequency = currentQuest.frequency || "UNLIMITED";
        setFrequency(newFrequency);
        frequencyRef.current = newFrequency;
      }
    } else {
      setStartDateTime("");
      setEndDateTime("");
      setIsQuestActive(true);
      if (isDialogOpen) {
        setFrequency("UNLIMITED");
        frequencyRef.current = "UNLIMITED";
      }
    }
  }, [currentQuest, isDialogOpen]);

  // Handle new/edit quest
  const handleQuestAction = (quest?: QuestType) => {
    if (quest) {
      setCurrentQuest(quest);
      setIsEditMode(true);
      setIsQuestActive(quest.isActive);
    } else {
      setCurrentQuest(null);
      setIsEditMode(false);
      setIsQuestActive(true);
    }
    setIsDialogOpen(true);
  };

  // Calculate completion rate
  const completionRate = totalUserQuestsCount > 0 
    ? Math.round((completedQuestsCount / totalUserQuestsCount) * 100) 
    : 0;

  // Create/Edit Dialog
  const handleQuestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    
    const form = e.target as HTMLFormElement;
    const titleInput = form.querySelector('#title') as HTMLInputElement;
    const descriptionInput = form.querySelector('#description') as HTMLInputElement;
    const rewardInput = form.querySelector('#reward') as HTMLInputElement;
    const requirementInput = form.querySelector('#requirement') as HTMLInputElement;
    const typeSelect = form.querySelector('#type') as HTMLSelectElement;
    
    console.log("Current frequency state before submission:", frequency);
    
    const questData = {
      title: titleInput.value,
      description: descriptionInput.value,
      scoreReward: parseInt(rewardInput.value),
      requirement: parseInt(requirementInput.value),
      type: typeSelect.value,
      isActive: isQuestActive,
      startDate: startDateTime ? new Date(startDateTime).toISOString() : null,
      endDate: endDateTime ? new Date(endDateTime).toISOString() : null,
      frequency: frequency || frequencyRef.current,
    };
    
    console.log("Submitting quest data:", questData);
    
    try {
      if (!isEditMode && !currentQuest) {
        // Create new quest
        const response = await fetch('/api/admin/quests', {
          method: 'POST',
        headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(questData),
          credentials: 'include'
        });
        
        const responseData = await response.text();
        console.log(`Create Response: ${response.status}`, responseData);
      
      if (!response.ok) {
          throw new Error(responseData || `Failed to create quest`);
        }
        
        let newQuest;
        try {
          newQuest = JSON.parse(responseData).quest;
          console.log("Successfully created quest:", newQuest);
        } catch (e) {
          console.error("Failed to parse response:", e);
        }
        
        // Immediately update the local quest list with the new quest if we got data back
        if (newQuest) {
          setFilteredQuests(prev => [...prev, newQuest]);
          // Update quests directly without reloading
          const updatedQuests = [...quests, newQuest];
          quests.splice(0, quests.length, ...updatedQuests);
        }
        
      } else if (isEditMode && currentQuest?.id) {
        // Update existing quest
        console.log(`Updating quest with ID: ${currentQuest.id}`, questData);
        
        const response = await fetch(`/api/admin/quests/${currentQuest.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(questData),
          credentials: 'include'
        });
        
        const responseData = await response.text();
        console.log(`Update Response: ${response.status}`, responseData);
      
      if (!response.ok) {
          throw new Error(responseData || `Failed to update quest`);
        }
        
        // Parse the response to get the updated quest
        let updatedQuest;
        try {
          updatedQuest = JSON.parse(responseData).quest;
          console.log("Successfully updated quest:", updatedQuest);
        } catch (e) {
          console.error("Failed to parse response:", e);
        }
        
        // Immediately update the quest list with the updated quest
        if (updatedQuest) {
          setFilteredQuests(prev => prev.map(q => 
            q.id === updatedQuest.id ? updatedQuest : q
          ));
          // Update quests directly without reloading
          const questIndex = quests.findIndex(q => q.id === updatedQuest.id);
          if (questIndex !== -1) {
            quests[questIndex] = updatedQuest;
          }
        }
      } else {
        throw new Error("Invalid quest state for edit/create operation");
      }
      
      // Close dialog 
      setIsDialogOpen(false);
      
      toast({
        title: isEditMode ? 'Quest updated' : 'Quest created',
        description: isEditMode
          ? 'Your quest has been successfully updated.'
          : 'Your new quest has been created successfully.',
      });
    } catch (error) {
      console.error('Error saving quest:', error);
      toast({
        title: 'Error',
        description: `Failed to ${isEditMode ? 'update' : 'create'} quest. Please try again.`,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Quest Management</h1>
        <p className="text-muted-foreground">
          Create and manage quests for users to complete
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <BentoCard
          title="Active Quests"
          value={activeQuestsCount}
          subtitle={`${quests.length} total quests`}
          colors={["#3B82F6", "#60A5FA", "#93C5FD"]}
          delay={0.1}
          icon={<Trophy className="h-6 w-6 text-blue-500" />}
        />
        
        <BentoCard
          title="Assigned Quests"
          value={totalUserQuestsCount}
          subtitle="Total quests assigned to users"
          colors={["#F59E0B", "#FBBF24", "#FDE68A"]}
          delay={0.2}
          icon={<Users className="h-6 w-6 text-amber-500" />}
        />
        
        <BentoCard
          title="Completion Rate"
          value={`${completionRate}%`}
          subtitle={`${completedQuestsCount} completed quests`}
          colors={["#10B981", "#34D399", "#6EE7B7"]}
          delay={0.3}
          icon={<Check className="h-6 w-6 text-emerald-500" />}
        />
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="relative w-full sm:w-auto max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-9 pr-4 w-full"
            placeholder="Search quests..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            suppressHydrationWarning
          />
        </div>
        
        <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
          <div className="flex items-center gap-2">
            <Switch
              id="active-filter"
              checked={showOnlyActive}
              onCheckedChange={setShowOnlyActive}
              suppressHydrationWarning
            />
            <Label htmlFor="active-filter" className="cursor-pointer">
              Active Only
            </Label>
          </div>
          
          <Button 
            onClick={() => handleQuestAction()}
            className="gap-1.5"
            suppressHydrationWarning
          >
            <Plus className="h-4 w-4" />
            New Quest
          </Button>
        </div>
      </div>

      {/* Tabs and Quest List */}
      <Card className="overflow-hidden">
        <Tabs
          defaultValue="all"
          className="w-full"
          onValueChange={(value) => setActiveTab(value)}
        >
          <div className="flex justify-between items-center p-4 border-b">
            <TabsList>
              <TabsTrigger value="all" className="relative" suppressHydrationWarning>
                All Quests
                <Badge variant="secondary" className="ml-2">{quests.length}</Badge>
              </TabsTrigger>
              <TabsTrigger value="active" suppressHydrationWarning>
                Active
                <Badge variant="secondary" className="ml-2">{activeQuestsCount}</Badge>
              </TabsTrigger>
              <TabsTrigger value="inactive" suppressHydrationWarning>
                Inactive
                <Badge variant="secondary" className="ml-2">{quests.length - activeQuestsCount}</Badge>
              </TabsTrigger>
            </TabsList>
            
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="gap-1.5" suppressHydrationWarning>
                <Filter className="h-3.5 w-3.5" />
                Filter
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="gap-1.5" 
                onClick={() => window.location.reload()} 
                suppressHydrationWarning
              >
                <RefreshCw className="h-3.5 w-3.5" />
                Refresh
              </Button>
            </div>
          </div>
          
          <TabsContent value="all" className="m-0">
            <QuestTable 
              quests={filteredQuests} 
              handleQuestAction={handleQuestAction} 
              searchTerm={searchTerm}
            />
          </TabsContent>
          
          <TabsContent value="active" className="m-0">
            <QuestTable 
              quests={filteredQuests} 
              handleQuestAction={handleQuestAction} 
              searchTerm={searchTerm}
            />
          </TabsContent>
          
          <TabsContent value="inactive" className="m-0">
            <QuestTable 
              quests={filteredQuests} 
              handleQuestAction={handleQuestAction} 
              searchTerm={searchTerm}
            />
          </TabsContent>
        </Tabs>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-[700px]">
              <DialogHeader>
            <DialogTitle>{currentQuest ? "Edit Quest" : "Create New Quest"}</DialogTitle>
                <DialogDescription>
              {currentQuest ? "Update quest details" : "Add a new quest for users to complete."}
                </DialogDescription>
            <Alert className="mt-2">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Automatic Activation</AlertTitle>
              <AlertDescription>
                Quests with future start dates will be automatically activated when that date/time arrives.
                You can set quests as inactive and schedule their activation for a future date.
              </AlertDescription>
            </Alert>
              </DialogHeader>
              
          <form onSubmit={handleQuestSubmit}>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="title">Quest Title</Label>
                  <Input 
                    id="title" 
                  placeholder="Enter quest title..." 
                  defaultValue={currentQuest?.title || ""} 
                  required
                  suppressHydrationWarning
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  placeholder="Enter quest description..."
                  defaultValue={currentQuest?.description || ""}
                  required
                  suppressHydrationWarning
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="reward">Score Reward</Label>
                  <Input
                    id="reward"
                    type="number"
                    min={1}
                    placeholder="100"
                    defaultValue={currentQuest?.scoreReward || 100}
                    required
                    suppressHydrationWarning
                  />
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="requirement">Requirement</Label>
                  <Input
                    id="requirement"
                    type="number"
                    min={1}
                    placeholder="1"
                    defaultValue={currentQuest?.requirement || 1}
                    required
                    suppressHydrationWarning
                  />
                </div>
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="type">Quest Type</Label>
                <div className="relative">
                  <select 
                    id="type" 
                    className="w-full h-10 px-3 py-2 bg-background border border-input rounded-md"
                    defaultValue={currentQuest?.type || "MEAL_UPLOAD"}
                    suppressHydrationWarning
                  >
                    <option value="MEAL_UPLOAD">Meal Submission</option>
                    <option value="STREAK_ACHIEVEMENT">Streak Achievement</option>
                    <option value="ITEM_USE">Item Usage</option>
                    <option value="ITEM_PURCHASE">Item Purchase</option>
                    <option value="SPECIAL_EVENT">Special Event</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="startDateTime">Start Date & Time (Optional)</Label>
                  <Input
                    id="startDateTime"
                    type="datetime-local"
                    value={startDateTime}
                    onChange={(e) => setStartDateTime(e.target.value)}
                    suppressHydrationWarning
                  />
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="endDateTime">End Date & Time (Optional)</Label>
                  <Input
                    id="endDateTime"
                    type="datetime-local"
                    value={endDateTime}
                    onChange={(e) => setEndDateTime(e.target.value)}
                    suppressHydrationWarning
                  />
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="active" className="cursor-pointer">Active Status</Label>
                <Switch
                  id="active"
                  checked={isQuestActive}
                  onCheckedChange={setIsQuestActive}
                  suppressHydrationWarning
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="frequency">Completion Frequency</Label>
                <div id="frequency">
                  <Select 
                    value={frequency}
                    onValueChange={(value) => {
                      console.log("Frequency changed to:", value);
                      setFrequency(value);
                      frequencyRef.current = value; // Store in ref as backup
                    }}
                    onOpenChange={(open) => {
                      // When dropdown closes, ensure state matches ref
                      if (!open && frequencyRef.current !== frequency) {
                        console.log("Syncing frequency from ref:", frequencyRef.current);
                        setFrequency(frequencyRef.current);
                      }
                    }}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="How often can users complete this quest?" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ONCE">Once Only (Never resets)</SelectItem>
                      <SelectItem value="DAILY">Daily (Resets every day)</SelectItem>
                      <SelectItem value="UNLIMITED">Unlimited (Complete multiple times)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  Controls how often the same user can complete this quest
                </div>
                </div>
              </div>
              
              <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} suppressHydrationWarning>
                Cancel
              </Button>
              <Button type="submit" disabled={saving} suppressHydrationWarning>
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {isEditMode ? "Saving..." : "Creating..."}
                  </>
                ) : (
                  isEditMode ? "Save Changes" : "Create Quest"
                )}
                </Button>
              </DialogFooter>
          </form>
            </DialogContent>
          </Dialog>
        </div>
  );
}

// Quest Table Component
interface QuestTableProps {
  quests: QuestType[];
  handleQuestAction: (quest?: QuestType) => void;
  searchTerm: string;
}

function QuestTable({ quests, handleQuestAction, searchTerm }: QuestTableProps) {
  // Add validation for quests data
  const validQuests = quests.filter(quest => quest && typeof quest === 'object');
  
  if (validQuests.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
        {searchTerm ? (
          <>
            <Search className="h-12 w-12 text-muted-foreground mb-4 opacity-50" />
            <h3 className="text-lg font-medium mb-2">No quests found</h3>
            <p className="text-muted-foreground max-w-md">
              We couldn&apos;t find any quests matching your search term. Try using different keywords or clear your search.
            </p>
          </>
        ) : (
          <>
            <Trophy className="h-12 w-12 text-muted-foreground mb-4 opacity-50" />
            <h3 className="text-lg font-medium mb-2">No quests available</h3>
            <p className="text-muted-foreground max-w-md">
              You haven&apos;t created any quests yet. Get started by creating your first quest for users to complete.
            </p>
            <Button className="mt-6" onClick={() => handleQuestAction()}>
              <Plus className="h-4 w-4 mr-2" /> Create Your First Quest
            </Button>
          </>
        )}
      </div>
    );
  }
      
  return (
        <div className="overflow-x-auto">
      <table className="w-full" suppressHydrationWarning>
            <thead>
              <tr className="border-b">
            <th className="text-left p-4 font-medium">Quest</th>
            <th className="text-left p-4 font-medium">Type</th>
            <th className="text-center p-4 font-medium">Reward</th>
            <th className="text-center p-4 font-medium">Assigned</th>
            <th className="text-center p-4 font-medium">Status</th>
            <th className="text-center p-4 font-medium">Time Limit</th>
            <th className="text-center p-4 font-medium">Frequency</th>
            <th className="text-right p-4 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
          {validQuests.map((quest) => (
            <tr key={quest.id} className="border-b hover:bg-muted/50 transition-colors">
              <td className="p-4">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 h-10 w-10 rounded-md bg-primary/10 flex items-center justify-center">
                    {quest.type === "MEAL_UPLOAD" ? (
                      <Award className="h-5 w-5 text-primary" />
                    ) : quest.type === "STREAK_ACHIEVEMENT" ? (
                      <Flame className="h-5 w-5 text-orange-500" />
                    ) : quest.type === "ITEM_USE" ? (
                      <Star className="h-5 w-5 text-amber-500" />
                    ) : quest.type === "ITEM_PURCHASE" ? (
                      <Star className="h-5 w-5 text-purple-500" />
                    ) : (
                      <Users className="h-5 w-5 text-blue-500" />
                    )}
                  </div>
                      <div>
                    <div className="font-medium">{quest.title}</div>
                    <div className="text-sm text-muted-foreground line-clamp-1">
                          {quest.description}
                    </div>
                  </div>
                      </div>
                    </td>
              <td className="p-4">
                <Badge variant="outline">
                  {quest.type.replace('_', ' ')}
                </Badge>
              </td>
              <td className="p-4 text-center">
                <span className="font-medium">{quest.scoreReward}</span>
                <span className="text-muted-foreground"> pts</span>
                    </td>
              <td className="p-4 text-center">
                {quest._count && quest._count.userQuests !== undefined ? quest._count.userQuests : 0}
                    </td>
              <td className="p-4 text-center">
                {quest.isActive ? (
                  <Badge className="bg-green-500/10 text-green-500 hover:bg-green-500/20 border-green-500/20">
                    Active
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-muted-foreground">
                    Inactive
                  </Badge>
                )}
                    </td>
              <td className="p-4 text-center">
                {quest.startDate || quest.endDate ? (
                  <div className="text-xs">
                    {quest.startDate && (
                      <div>Starts: {new Date(quest.startDate).toLocaleString()}</div>
                    )}
                    {quest.endDate && (
                      <div>Ends: {new Date(quest.endDate).toLocaleString()}</div>
                    )}
                  </div>
                ) : (
                  <span className="text-xs text-muted-foreground">No time limit</span>
                )}
                    </td>
              <td className="p-4 text-center">
                {quest.frequency === "ONCE" && (
                  <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-300">
                    One Time
                  </Badge>
                )}
                {quest.frequency === "DAILY" && (
                  <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300">
                    Daily Reset
                  </Badge>
                )}
                {quest.frequency === "UNLIMITED" && (
                  <Badge variant="outline" className="bg-purple-100 text-purple-800 border-purple-300">
                    Unlimited
                  </Badge>
                )}
                    </td>
              <td className="p-4 text-right">
                <div className="flex items-center justify-end gap-2">
                        <Button 
                    variant="ghost"
                    size="icon"
                    onClick={() => handleQuestAction(quest)}
                    suppressHydrationWarning
                  >
                    <Edit className="h-4 w-4" />
                    <span className="sr-only">Edit</span>
                        </Button>
                        <Button 
                    variant="ghost"
                    size="icon"
                    suppressHydrationWarning
                  >
                    <Copy className="h-4 w-4" />
                    <span className="sr-only">Duplicate</span>
                        </Button>
                      </div>
                    </td>
                  </tr>
          ))}
            </tbody>
          </table>
    </div>
  );
} 