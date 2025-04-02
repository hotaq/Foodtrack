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
  Coins
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
    const details = await fetchUserDetails(user.id);
    if (details) {
      setUserDetails(details);
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
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>User Details</DialogTitle>
            <DialogDescription>
              Detailed information about the user.
            </DialogDescription>
          </DialogHeader>
          
          {isLoading && (
            <div className="py-8 text-center">
              Loading user details...
            </div>
          )}
          
          {!isLoading && userDetails && (
            <div className="space-y-4 py-4">
              <div className="flex items-center space-x-4">
                <img 
                  src={userDetails.image || "https://github.com/shadcn.png"} 
                  alt={userDetails.name}
                  className="h-20 w-20 rounded-full" 
                />
                <div>
                  <h3 className="text-lg font-semibold">{userDetails.name}</h3>
                  <p className="text-sm text-muted-foreground">{userDetails.email}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h4 className="font-medium">Account</h4>
                  <p className="text-sm">Role: {userDetails.role}</p>
                  <p className="text-sm">Status: {userDetails.status}</p>
                  <p className="text-sm">Joined: {format(new Date(userDetails.createdAt), "PPP")}</p>
                  <p className="text-sm flex items-center gap-1">
                    <Coins className="h-4 w-4 text-amber-500" />
                    Score: {userDetails.score || 0}
                  </p>
                </div>
                
                <div className="space-y-2">
                  <h4 className="font-medium">Stats</h4>
                  <p className="text-sm">Current Streak: {userDetails.currentStreak}</p>
                  <p className="text-sm">Best Streak: {userDetails.bestStreak}</p>
                  <p className="text-sm">Total Meals: {userDetails.mealCount}</p>
                  <p className="text-sm">Completed Quests: {userDetails.completedQuests}</p>
                </div>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewDialogOpen(false)}>Close</Button>
            <Button onClick={() => {
              setViewDialogOpen(false);
              if (selectedUser) handleEditUser(selectedUser);
            }}>Edit User</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
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