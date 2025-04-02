"use client";

import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  ArrowUpDown, 
  MoreHorizontal, 
  Search,
  Shield,
  Flame,
  UtensilsCrossed,
  Trophy,
  Calendar,
  User as UserIcon,
  Key,
  Coins,
  Clock,
  Zap,
  XCircle,
  Sword,
  Package,
  Trash2,
  TimerReset
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

interface User {
  id: string;
  name: string;
  email: string;
  image: string | null;
  role: string;
  currentStreak: number;
  bestStreak: number;
  mealCount: number;
  completedQuests: number;
  status: string;
  createdAt: Date;
}

interface UserDetails extends User {
  score: number;
  isBanned?: boolean;
}

interface ActiveEffect {
  id: string;
  userId: string;
  itemId: string;
  type: string;
  multiplier?: number;
  timeExtension?: number;
  expiresAt: Date;
  createdAt: Date;
  isActive: boolean;
  item?: {
    name: string;
    imageUrl: string | null;
    type: string;
  };
}

interface UserItem {
  id: string;
  userId: string;
  itemId: string;
  quantity: number;
  lastUsed: Date | null;
  createdAt: Date;
  updatedAt: Date;
  item: {
    id: string;
    name: string;
    description: string;
    imageUrl: string | null;
    price: number;
    type: string;
    effect: string;
    duration: number | null;
    cooldown: number | null;
  };
  cooldownStatus?: {
    isOnCooldown: boolean;
    endsAt: Date;
    timeRemaining: number;
  } | null;
}

interface AdminUsersPageProps {
  users: User[];
}

export default function AdminUsersPage({ users }: AdminUsersPageProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortField, setSortField] = useState<keyof User>("createdAt");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [mounted, setMounted] = useState(false);
  const [processedUsers, setProcessedUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [userDetails, setUserDetails] = useState<UserDetails | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [editForm, setEditForm] = useState({
    name: "",
    email: "",
    currentStreak: 0,
    bestStreak: 0,
    password: "",
    score: 0,
    status: "",
    role: ""
  });
  const [userActiveEffects, setUserActiveEffects] = useState<ActiveEffect[]>([]);
  const [userItems, setUserItems] = useState<UserItem[]>([]);
  const [isLoadingEffects, setIsLoadingEffects] = useState(false);
  const [isLoadingItems, setIsLoadingItems] = useState(false);
  const [activeTab, setActiveTab] = useState<"profile" | "effects" | "items">("profile");

  // Handle hydration by waiting for client-side rendering
  useEffect(() => {
    setMounted(true);
    
    // Process dates for users
    setProcessedUsers(users.map(user => ({
      ...user,
      createdAt: new Date(user.createdAt),
    })));
  }, [users]);

  // Wait for client-side rendering to avoid hydration mismatch
  if (!mounted) {
    return <div className="py-10 text-center">Loading user data...</div>;
  }

  // Fetch user details
  const fetchUserDetails = async (userId: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/admin/users/${userId}`);
      if (response.ok) {
        const data = await response.json();
        setUserDetails(data);
        return data;
      } else {
        const errorText = await response.text();
        console.error("Failed to fetch user details:", errorText);
        toast.error("Failed to fetch user details");
        return null;
      }
    } catch (error) {
      console.error("Error fetching user details:", error);
      toast.error("Error fetching user details");
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  // Filter and sort users
  const filteredUsers = processedUsers
    .filter((user) => {
      const searchLower = searchQuery.toLowerCase();
      return (
        user.name.toLowerCase().includes(searchLower) ||
        user.email.toLowerCase().includes(searchLower) ||
        user.role.toLowerCase().includes(searchLower)
      );
    })
    .sort((a, b) => {
      const aValue = a[sortField];
      const bValue = b[sortField];
      const modifier = sortDirection === "asc" ? 1 : -1;

      if (aValue === null || bValue === null) return 0;

      if (aValue instanceof Date && bValue instanceof Date) {
        return (aValue.getTime() - bValue.getTime()) * modifier;
      }

      if (typeof aValue === "string" && typeof bValue === "string") {
        return aValue.localeCompare(bValue) * modifier;
      }

      if (typeof aValue === "number" && typeof bValue === "number") {
        return (aValue - bValue) * modifier;
      }

      return 0;
    });

  const handleSort = (field: keyof User) => {
    if (field === sortField) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const handleViewUser = async (user: User) => {
    setSelectedUser(user);
    setViewDialogOpen(true);
    setIsLoadingEffects(true);
    setIsLoadingItems(true);
    setActiveTab("profile");
    
    try {
      // Fetch user details
      const details = await fetchUserDetails(user.id);
      if (details) {
        setUserDetails(details);
      }
      
      // Fetch active effects
      const effectsResponse = await fetch(`/api/admin/users/${user.id}/active-effects`);
      if (effectsResponse.ok) {
        const effectsData = await effectsResponse.json();
        setUserActiveEffects(effectsData);
      } else {
        toast.error("Failed to fetch user's active effects");
      }
      
      // Fetch user items
      const itemsResponse = await fetch(`/api/admin/users/${user.id}/items`);
      if (itemsResponse.ok) {
        const itemsData = await itemsResponse.json();
        setUserItems(itemsData);
      } else {
        toast.error("Failed to fetch user's items");
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
    } finally {
      setIsLoadingEffects(false);
      setIsLoadingItems(false);
    }
  };

  const handleEditUser = async (user: User) => {
    setSelectedUser(user);
    setIsLoading(true);
    
    // Fetch latest user details
    const details = await fetchUserDetails(user.id);
    
    if (details) {
      setEditForm({
        name: details.name,
        email: details.email,
        currentStreak: details.currentStreak,
        bestStreak: details.bestStreak,
        password: "", // Empty by default
        score: details.score,
        status: details.status,
        role: details.role
      });
    } else {
      // Fallback to basic user info if details fetch fails
      setEditForm({
        name: user.name,
        email: user.email,
        currentStreak: user.currentStreak,
        bestStreak: user.bestStreak,
        password: "", // Empty by default
        score: 0,
        status: user.status,
        role: user.role
      });
    }
    
    setIsLoading(false);
    setEditDialogOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!selectedUser) return;
    
    setIsLoading(true);
    try {
      // Call the API endpoint to update user
      const response = await fetch(`/api/admin/users/${selectedUser.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: editForm.name,
          email: editForm.email,
          password: editForm.password || undefined, // Only send if not empty
          currentStreak: Number(editForm.currentStreak),
          bestStreak: Number(editForm.bestStreak),
          score: Number(editForm.score),
          status: editForm.status,
          role: editForm.role
        }),
      });

      if (response.ok) {
        // Update local state to reflect changes
        setProcessedUsers(prevUsers => 
          prevUsers.map(u => 
            u.id === selectedUser.id 
              ? {
                  ...u,
                  name: editForm.name,
                  email: editForm.email,
                  currentStreak: Number(editForm.currentStreak),
                  bestStreak: Number(editForm.bestStreak),
                  status: editForm.status,
                  role: editForm.role
                }
              : u
          )
        );
        
        // If we have user details, update them too
        if (userDetails && userDetails.id === selectedUser.id) {
          setUserDetails({
            ...userDetails,
            name: editForm.name,
            email: editForm.email,
            currentStreak: Number(editForm.currentStreak),
            bestStreak: Number(editForm.bestStreak),
            score: Number(editForm.score),
            status: editForm.status,
            role: editForm.role
          });
        }
        
        setEditDialogOpen(false);
        toast.success("User updated successfully");
      } else {
        // Safely parse JSON response
        let errorMessage = "Failed to update user";
        try {
          const text = await response.text();
          if (text) {
            try {
              const error = JSON.parse(text);
              errorMessage = error.error || errorMessage;
            } catch {
              // If JSON parsing fails, use the text as the error message
              errorMessage = text;
            }
          }
        } catch (parseError) {
          console.error('Error parsing response:', parseError);
        }
        toast.error(errorMessage);
      }
    } catch (error) {
      console.error('Error updating user:', error);
      toast.error("Failed to update user");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteEffect = async (effectId: string) => {
    if (!selectedUser) return;
    
    if (!window.confirm("Are you sure you want to delete this effect? This action cannot be undone.")) {
      return;
    }
    
    try {
      const response = await fetch(`/api/admin/users/${selectedUser.id}/active-effects?effectId=${effectId}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        // Remove the deleted effect from state
        setUserActiveEffects(prevEffects => 
          prevEffects.filter(effect => effect.id !== effectId)
        );
        toast.success("Active effect deleted successfully");
      } else {
        const errorData = await response.json();
        toast.error(`Failed to delete effect: ${errorData.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error("Error deleting active effect:", error);
      toast.error("Error deleting active effect");
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    if (!selectedUser) return;
    
    if (!window.confirm("Are you sure you want to delete this item from the user's inventory? This action cannot be undone.")) {
      return;
    }
    
    try {
      const response = await fetch(`/api/admin/users/${selectedUser.id}/items?itemId=${itemId}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        // Remove the deleted item from state
        setUserItems(prevItems => 
          prevItems.filter(item => item.id !== itemId)
        );
        toast.success("Item deleted successfully");
      } else {
        const errorData = await response.json();
        toast.error(`Failed to delete item: ${errorData.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error("Error deleting item:", error);
      toast.error("Error deleting item");
    }
  };
  
  const handleClearCooldown = async (itemId: string) => {
    if (!selectedUser) return;
    
    try {
      const response = await fetch(`/api/admin/users/${selectedUser.id}/items/clear-cooldown?itemId=${itemId}`, {
        method: 'POST',
      });
      
      if (response.ok) {
        // Update the item in state to clear cooldown
        setUserItems(prevItems => 
          prevItems.map(item => 
            item.id === itemId 
              ? { ...item, lastUsed: null, cooldownStatus: null }
              : item
          )
        );
        toast.success("Item cooldown cleared successfully");
      } else {
        const errorData = await response.json();
        toast.error(`Failed to clear cooldown: ${errorData.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error("Error clearing cooldown:", error);
      toast.error("Error clearing cooldown");
    }
  };

  // View User Dialog
  const ViewUserDialog = () => {
    if (!viewDialogOpen || !selectedUser) return null;

    return (
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
          <DialogHeader>
            <DialogTitle className="text-xl">User Profile</DialogTitle>
            <DialogDescription>
              Viewing detailed information for user {selectedUser.name}
            </DialogDescription>
          </DialogHeader>
          
          {isLoading && <div className="flex justify-center my-8"><div className="animate-spin h-8 w-8 border-t-2 border-b-2 border-gray-900 rounded-full"></div></div>}
          
          {!isLoading && userDetails && (
            <div className="grid gap-4">
              <div className="flex items-center gap-4">
                {userDetails.image ? (
                  <img 
                    src={userDetails.image} 
                    alt={userDetails.name} 
                    className="w-16 h-16 rounded-full" 
                  />
                ) : (
                  <div className="flex items-center justify-center w-16 h-16 bg-gray-200 rounded-full">
                    <UserIcon className="h-8 w-8 text-gray-500" />
                  </div>
                )}
                
                <div className="flex-1">
                  <h3 className="text-lg font-medium">{userDetails.name}</h3>
                  <p className="text-sm text-gray-500">{userDetails.email}</p>
                  <div className="flex gap-2 mt-1">
                    <Badge variant={userDetails.role === "ADMIN" ? "destructive" : "outline"}>
                      {userDetails.role}
                    </Badge>
                    <Badge variant={userDetails.status === "ACTIVE" ? "default" : "destructive"}>
                      {userDetails.status}
                    </Badge>
                    {userDetails.isBanned && (
                      <Badge variant="destructive">BANNED</Badge>
                    )}
                  </div>
                </div>
                
                <Button 
                  onClick={() => {
                    setViewDialogOpen(false);
                    handleEditUser(selectedUser);
                  }}
                  variant="outline"
                >
                  Edit User
                </Button>
              </div>
              
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 my-2">
                <div className="flex flex-col items-center justify-center p-3 border rounded-lg">
                  <Flame className="h-5 w-5 text-orange-500 mb-1" />
                  <span className="text-sm text-gray-500">Current Streak</span>
                  <span className="text-xl font-semibold">{userDetails.currentStreak}</span>
                </div>
                
                <div className="flex flex-col items-center justify-center p-3 border rounded-lg">
                  <Flame className="h-5 w-5 text-red-500 mb-1" />
                  <span className="text-sm text-gray-500">Best Streak</span>
                  <span className="text-xl font-semibold">{userDetails.bestStreak}</span>
                </div>
                
                <div className="flex flex-col items-center justify-center p-3 border rounded-lg">
                  <UtensilsCrossed className="h-5 w-5 text-purple-500 mb-1" />
                  <span className="text-sm text-gray-500">Meals</span>
                  <span className="text-xl font-semibold">{userDetails.mealCount}</span>
                </div>
                
                <div className="flex flex-col items-center justify-center p-3 border rounded-lg">
                  <Trophy className="h-5 w-5 text-yellow-500 mb-1" />
                  <span className="text-sm text-gray-500">Quests</span>
                  <span className="text-xl font-semibold">{userDetails.completedQuests}</span>
                </div>
                
                <div className="flex flex-col items-center justify-center p-3 border rounded-lg">
                  <Coins className="h-5 w-5 text-amber-500 mb-1" />
                  <span className="text-sm text-gray-500">Score</span>
                  <span className="text-xl font-semibold">{userDetails.score}</span>
                </div>
                
                <div className="flex flex-col items-center justify-center p-3 border rounded-lg">
                  <Calendar className="h-5 w-5 text-blue-500 mb-1" />
                  <span className="text-sm text-gray-500">Joined</span>
                  <span className="text-xs font-medium">
                    {format(new Date(userDetails.createdAt), 'MMM d, yyyy')}
                  </span>
                </div>
              </div>
              
              {/* Tabs for sections */}
              <div className="flex border-b space-x-1">
                <button
                  onClick={() => setActiveTab("profile")}
                  className={`px-4 py-2 font-medium ${
                    activeTab === "profile"
                      ? "border-b-2 border-blue-500 text-blue-600"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  Profile
                </button>
                <button
                  onClick={() => setActiveTab("effects")}
                  className={`px-4 py-2 font-medium flex items-center ${
                    activeTab === "effects"
                      ? "border-b-2 border-blue-500 text-blue-600"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  <Zap className="h-4 w-4 mr-1" />
                  Active Effects
                  {userActiveEffects.length > 0 && (
                    <Badge variant="secondary" className="ml-2">{userActiveEffects.length}</Badge>
                  )}
                </button>
                <button
                  onClick={() => setActiveTab("items")}
                  className={`px-4 py-2 font-medium flex items-center ${
                    activeTab === "items"
                      ? "border-b-2 border-blue-500 text-blue-600"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  <Package className="h-4 w-4 mr-1" />
                  Items
                  {userItems.length > 0 && (
                    <Badge variant="secondary" className="ml-2">{userItems.length}</Badge>
                  )}
                </button>
              </div>
              
              {/* Profile content */}
              {activeTab === "profile" && (
                <div className="mt-4">
                  <h3 className="text-lg font-medium mb-2">Account Details</h3>
                  <div className="space-y-2">
                    <p>This is the main profile view with additional details if needed.</p>
                    <p className="text-sm text-gray-500">ID: {userDetails.id}</p>
                  </div>
                </div>
              )}
              
              {/* Active Effects Section */}
              {activeTab === "effects" && (
                <div className="mt-4">
                  <h3 className="text-lg font-medium mb-2 flex items-center">
                    <Zap className="h-5 w-5 text-amber-500 mr-2" />
                    Active Effects
                  </h3>
                  
                  {isLoadingEffects ? (
                    <div className="flex justify-center my-4">
                      <div className="animate-spin h-5 w-5 border-t-2 border-b-2 border-gray-900 rounded-full"></div>
                    </div>
                  ) : userActiveEffects.length === 0 ? (
                    <p className="text-sm text-gray-500 italic">User has no active effects</p>
                  ) : (
                    <div className="border rounded-md overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Effect</TableHead>
                            <TableHead>Item</TableHead>
                            <TableHead>Expires</TableHead>
                            <TableHead className="text-right">Action</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {userActiveEffects.map((effect) => (
                            <TableRow key={effect.id} className={!effect.isActive ? "bg-gray-50" : ""}>
                              <TableCell>
                                <div className="flex items-center">
                                  {effect.type === "SCORE_MULTIPLIER" && (
                                    <Coins className="h-4 w-4 text-yellow-500 mr-2" />
                                  )}
                                  {effect.type === "STREAK_PROTECT" && (
                                    <Shield className="h-4 w-4 text-blue-500 mr-2" />
                                  )}
                                  {effect.type === "ATTACK_BOOST" && (
                                    <Sword className="h-4 w-4 text-red-500 mr-2" />
                                  )}
                                  {effect.type === "TIME_EXTENSION" && (
                                    <Clock className="h-4 w-4 text-green-500 mr-2" />
                                  )}
                                  <span className={!effect.isActive ? "text-gray-400" : ""}>
                                    {effect.type.replace(/_/g, " ")}
                                    {effect.multiplier && ` (${effect.multiplier}x)`}
                                    {effect.timeExtension && ` (${effect.timeExtension} min)`}
                                  </span>
                                </div>
                              </TableCell>
                              <TableCell>
                                {effect.item?.name || "Unknown Item"}
                              </TableCell>
                              <TableCell>
                                <span className={effect.isActive ? "text-green-600 font-medium" : "text-red-500"}>
                                  {effect.isActive 
                                    ? `Expires: ${format(new Date(effect.expiresAt), 'MMM d, h:mm a')}`
                                    : `Expired: ${format(new Date(effect.expiresAt), 'MMM d, h:mm a')}`}
                                </span>
                              </TableCell>
                              <TableCell className="text-right">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDeleteEffect(effect.id)}
                                  title="Delete Effect"
                                >
                                  <XCircle className="h-4 w-4 text-red-500" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </div>
              )}
              
              {/* Items Section */}
              {activeTab === "items" && (
                <div className="mt-4">
                  <h3 className="text-lg font-medium mb-2 flex items-center">
                    <Package className="h-5 w-5 text-emerald-500 mr-2" />
                    User Items
                  </h3>
                  
                  {isLoadingItems ? (
                    <div className="flex justify-center my-4">
                      <div className="animate-spin h-5 w-5 border-t-2 border-b-2 border-gray-900 rounded-full"></div>
                    </div>
                  ) : userItems.length === 0 ? (
                    <p className="text-sm text-gray-500 italic">User has no items</p>
                  ) : (
                    <div className="border rounded-md overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Item</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Quantity</TableHead>
                            <TableHead>Cooldown Status</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {userItems.map((userItem) => (
                            <TableRow key={userItem.id}>
                              <TableCell>
                                <div className="flex items-center">
                                  {userItem.item.imageUrl && (
                                    <img 
                                      src={userItem.item.imageUrl} 
                                      alt={userItem.item.name} 
                                      className="h-8 w-8 rounded-md mr-2 object-cover" 
                                    />
                                  )}
                                  <div>
                                    <div className="font-medium">{userItem.item.name}</div>
                                    <div className="text-xs text-gray-500 truncate max-w-[200px]">
                                      {userItem.item.description}
                                    </div>
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline">
                                  {userItem.item.type.replace(/_/g, " ")}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                {userItem.quantity}
                              </TableCell>
                              <TableCell>
                                {userItem.cooldownStatus ? (
                                  <div className="flex items-center">
                                    <Clock className="h-4 w-4 text-orange-500 mr-1" />
                                    <span className="text-sm text-orange-600">
                                      {`${Math.floor(userItem.cooldownStatus.timeRemaining / 60)}m ${userItem.cooldownStatus.timeRemaining % 60}s`}
                                    </span>
                                  </div>
                                ) : userItem.lastUsed ? (
                                  <span className="text-sm text-green-600">Ready to use</span>
                                ) : (
                                  <span className="text-sm text-gray-500">Never used</span>
                                )}
                              </TableCell>
                              <TableCell className="text-right space-x-1">
                                {userItem.cooldownStatus && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleClearCooldown(userItem.id)}
                                    title="Clear Cooldown"
                                  >
                                    <TimerReset className="h-4 w-4 text-blue-500" />
                                  </Button>
                                )}
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDeleteItem(userItem.id)}
                                  title="Delete Item"
                                >
                                  <Trash2 className="h-4 w-4 text-red-500" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </div>
              )}
              
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search users..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-[300px]"
          />
        </div>
        <Button>Add User</Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[250px]">
                <Button
                  variant="ghost"
                  onClick={() => handleSort("name")}
                  className="flex items-center gap-1"
                >
                  User
                  <ArrowUpDown className="h-4 w-4" />
                </Button>
              </TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  onClick={() => handleSort("role")}
                  className="flex items-center gap-1"
                >
                  Role
                  <ArrowUpDown className="h-4 w-4" />
                </Button>
              </TableHead>
              <TableHead>Stats</TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  onClick={() => handleSort("status")}
                  className="flex items-center gap-1"
                >
                  Status
                  <ArrowUpDown className="h-4 w-4" />
                </Button>
              </TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  onClick={() => handleSort("createdAt")}
                  className="flex items-center gap-1"
                >
                  Joined
                  <ArrowUpDown className="h-4 w-4" />
                </Button>
              </TableHead>
              <TableHead className="w-[70px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUsers.map((user) => (
              <TableRow key={user.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <img
                      src={user.image || "https://github.com/shadcn.png"}
                      alt={user.name}
                      className="h-10 w-10 rounded-full"
                    />
                    <div>
                      <div className="font-medium">{user.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {user.email}
                      </div>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-muted-foreground" />
                    {user.role}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2 text-sm">
                      <Flame className="h-4 w-4 text-orange-500" />
                      <span>Current Streak: {user.currentStreak}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <UtensilsCrossed className="h-4 w-4 text-blue-500" />
                      <span>Meals: {user.mealCount}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Trophy className="h-4 w-4 text-yellow-500" />
                      <span>Quests: {user.completedQuests}</span>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge
                    variant={user.status === "ACTIVE" ? "default" : "secondary"}
                  >
                    {user.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    {format(user.createdAt, "MMM d, yyyy")}
                  </div>
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuItem onClick={() => handleViewUser(user)}>
                        <UserIcon className="mr-2 h-4 w-4" />
                        View details
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleEditUser(user)}>
                        <Key className="mr-2 h-4 w-4" />
                        Edit user
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="text-red-600">
                        Delete user
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      
      {/* View User Details Dialog */}
      <ViewUserDialog />
      
      {/* Edit User Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>
              Update user information and settings.
            </DialogDescription>
          </DialogHeader>
          
          {isLoading ? (
            <div className="py-8 text-center">
              Loading...
            </div>
          ) : (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">
                  Name
                </Label>
                <Input
                  id="name"
                  value={editForm.name}
                  onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                  className="col-span-3"
                />
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="email" className="text-right">
                  Email
                </Label>
                <Input
                  id="email"
                  value={editForm.email}
                  onChange={(e) => setEditForm({...editForm, email: e.target.value})}
                  className="col-span-3"
                />
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="password" className="text-right">
                  Password
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter new password"
                  value={editForm.password}
                  onChange={(e) => setEditForm({...editForm, password: e.target.value})}
                  className="col-span-3"
                />
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="currentStreak" className="text-right">
                  Current Streak
                </Label>
                <Input
                  id="currentStreak"
                  type="number"
                  value={editForm.currentStreak}
                  onChange={(e) => setEditForm({...editForm, currentStreak: parseInt(e.target.value) || 0})}
                  className="col-span-3"
                />
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="bestStreak" className="text-right">
                  Best Streak
                </Label>
                <Input
                  id="bestStreak"
                  type="number"
                  value={editForm.bestStreak}
                  onChange={(e) => setEditForm({...editForm, bestStreak: parseInt(e.target.value) || 0})}
                  className="col-span-3"
                />
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="score" className="text-right">
                  Score
                </Label>
                <Input
                  id="score"
                  type="number"
                  value={editForm.score}
                  onChange={(e) => setEditForm({...editForm, score: parseInt(e.target.value) || 0})}
                  className="col-span-3"
                />
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="status" className="text-right">
                  Status
                </Label>
                <select
                  id="status"
                  value={editForm.status}
                  onChange={(e) => setEditForm({...editForm, status: e.target.value})}
                  className="col-span-3 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                >
                  <option value="ACTIVE">Active</option>
                  <option value="BANNED">Banned</option>
                </select>
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="role" className="text-right">
                  Role
                </Label>
                <select
                  id="role"
                  value={editForm.role}
                  onChange={(e) => setEditForm({...editForm, role: e.target.value})}
                  className="col-span-3 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                >
                  <option value="USER">User</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)} disabled={isLoading}>
              Cancel
            </Button>
            <Button onClick={handleSaveEdit} disabled={isLoading}>
              {isLoading ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 