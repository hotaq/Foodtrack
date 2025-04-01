"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/lib/use-toast-hook";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";

// Define types for item management
type ItemType = "CONSUMABLE" | "EQUIPMENT" | "SPECIAL";
type EffectType = 
  | "HEALTH_BOOST" 
  | "DEFENSE_BOOST" 
  | "ATTACK_BOOST" 
  | "SCORE_MULTIPLIER" 
  | "TIME_EXTENSION" 
  | "STREAK_DECREASE"
  | "STREAK_PROTECT"
  | "NONE"
  | null;

interface Item {
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
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

interface AdminItemsPageProps {
  items: Item[];
  itemCount: number;
  userItemsCount: number;
}

export function AdminItemsPage({ items, itemCount, userItemsCount }: AdminItemsPageProps) {
  const router = useRouter();
  const { toast } = useToast();

  const [isSeeding, setIsSeeding] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    imageUrl: "",
    price: 100,
    type: "CONSUMABLE" as ItemType,
    effect: "NONE" as EffectType,
    duration: 3600,
    cooldown: 1800,
    isActive: true,
  });

  // Reset form data
  const resetFormData = () => {
    setFormData({
      name: "",
      description: "",
      imageUrl: "",
      price: 100,
      type: "CONSUMABLE" as ItemType,
      effect: "NONE" as EffectType,
      duration: 3600,
      cooldown: 1800,
      isActive: true,
    });
    setEditingItemId(null);
  };

  // Open form for creating a new item
  const openCreateForm = () => {
    resetFormData();
    setFormOpen(true);
  };

  // Open form for editing an existing item
  const openEditForm = (item: Item) => {
    setFormData({
      name: item.name,
      description: item.description,
      imageUrl: item.imageUrl,
      price: item.price,
      type: item.type as ItemType,
      effect: item.effect as EffectType || "NONE",
      duration: item.duration || 0,
      cooldown: item.cooldown || 0,
      isActive: item.isActive,
    });
    setEditingItemId(item.id);
    setFormOpen(true);
  };

  // Handle input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: name === "price" || name === "duration" || name === "cooldown" 
        ? parseInt(value, 10) 
        : value
    });
  };

  // Handle select changes
  const handleSelectChange = (name: string, value: string) => {
    setFormData({
      ...formData,
      [name]: value
    });
  };

  // Handle switch changes
  const handleSwitchChange = (name: string, checked: boolean) => {
    setFormData({
      ...formData,
      [name]: checked
    });
  };

  // Seed predefined items
  const handleSeedItems = async () => {
    try {
      setIsSeeding(true);
      const response = await fetch("/api/seed-items", {
        method: "POST",
      });

      const data = await response.json();
      
      if (response.ok) {
        toast({
          title: "Success",
          description: data.message,
        });
        router.refresh();
      } else {
        toast({
          title: "Error",
          description: data.message || "Failed to seed items",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsSeeding(false);
    }
  };

  // Create a new item
  const handleCreateItem = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Convert "NONE" effect to null before sending to API
      const submissionData = {
        ...formData,
        effect: formData.effect === "NONE" ? null : formData.effect
      };

      const response = await fetch("/api/items/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(submissionData),
      });

      const data = await response.json();
      
      if (response.ok) {
        toast({
          title: "Success",
          description: "Item created successfully",
        });
        setFormOpen(false);
        resetFormData();
        router.refresh();
      } else {
        toast({
          title: "Error",
          description: data.message || "Failed to create item",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Update an existing item
  const handleUpdateItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItemId) return;
    
    setLoading(true);

    try {
      // Convert "NONE" effect to null before sending to API
      const submissionData = {
        ...formData,
        effect: formData.effect === "NONE" ? null : formData.effect
      };

      const response = await fetch(`/api/items/${editingItemId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(submissionData),
      });

      const data = await response.json();
      
      if (response.ok) {
        toast({
          title: "Success",
          description: "Item updated successfully",
        });
        setFormOpen(false);
        resetFormData();
        router.refresh();
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to update item",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Toggle item active status
  const toggleItemStatus = async (itemId: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/items/${itemId}?operation=toggle-status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ isActive: !currentStatus }),
      });

      const data = await response.json();
      
      if (response.ok) {
        toast({
          title: "Success",
          description: `Item is now ${!currentStatus ? "active" : "inactive"}`,
        });
        router.refresh();
      } else {
        toast({
          title: "Error",
          description: data.message || "Failed to update item status",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    }
  };

  // Handle form submission based on mode (create or edit)
  const handleFormSubmit = (e: React.FormEvent) => {
    if (editingItemId) {
      handleUpdateItem(e);
    } else {
      handleCreateItem(e);
    }
  };

  // Helper function to format item type for display
  const formatItemType = (type: string) => {
    return type.charAt(0) + type.slice(1).toLowerCase().replace(/_/g, ' ');
  };

  // Helper function to format effect for display
  const formatEffect = (effect: string | null) => {
    if (!effect || effect === "NONE") return "None";
    return effect.split('_').map(word => 
      word.charAt(0) + word.slice(1).toLowerCase()
    ).join(' ');
  };

  // Handle dialog close
  const handleDialogClose = (open: boolean) => {
    if (!open) {
      resetFormData();
    }
    setFormOpen(open);
  };

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Marketplace Items</h1>
          <p className="text-muted-foreground">Manage items available in the marketplace</p>
        </div>
        <div className="flex space-x-4">
          <Button onClick={openCreateForm}>
            Create New Item
          </Button>
          <Button 
            variant="outline" 
            onClick={handleSeedItems}
            disabled={isSeeding}
          >
            {isSeeding ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Seeding...
              </>
            ) : (
              "Seed Sample Items"
            )}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Total Items</CardTitle>
            <CardDescription>All items in the marketplace</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold">{itemCount}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Active Items</CardTitle>
            <CardDescription>Items available for purchase</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold">
              {items.filter(item => item.isActive).length}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>User Items</CardTitle>
            <CardDescription>Total items owned by users</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold">{userItemsCount}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Items</CardTitle>
          <CardDescription>
            All available marketplace items. Toggle visibility in the marketplace.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Effect</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Cooldown</TableHead>
                  <TableHead>Active</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center">
                      No items found. Create new items or seed sample items.
                    </TableCell>
                  </TableRow>
                ) : (
                  items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center space-x-2">
                          {item.imageUrl && (
                            <div className="h-8 w-8 rounded-full overflow-hidden">
                              <img 
                                src={item.imageUrl} 
                                alt={item.name}
                                className="h-full w-full object-cover"
                              />
                            </div>
                          )}
                          <span>{item.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>{formatItemType(item.type)}</TableCell>
                      <TableCell>{formatEffect(item.effect)}</TableCell>
                      <TableCell>{item.price}</TableCell>
                      <TableCell>
                        {item.duration 
                          ? `${Math.floor(item.duration / 60)} min` 
                          : "—"}
                      </TableCell>
                      <TableCell>
                        {item.cooldown 
                          ? `${Math.floor(item.cooldown / 60)} min` 
                          : "—"}
                      </TableCell>
                      <TableCell>
                        <Switch
                          checked={item.isActive}
                          onCheckedChange={() => toggleItemStatus(item.id, item.isActive)}
                        />
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditForm(item)}
                        >
                          Edit
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={formOpen} onOpenChange={handleDialogClose}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingItemId ? "Edit Item" : "Create New Item"}
            </DialogTitle>
            <DialogDescription>
              {editingItemId ? "Edit the details of the item" : "Add a new item to the marketplace"}
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleFormSubmit}>
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  name="name"
                  placeholder="Item Name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  name="description"
                  placeholder="Item Description"
                  value={formData.description}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="imageUrl">Image URL</Label>
                <Input
                  id="imageUrl"
                  name="imageUrl"
                  placeholder="/images/items/potion.png"
                  value={formData.imageUrl}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="price">Price</Label>
                <Input
                  id="price"
                  name="price"
                  type="number"
                  min="1"
                  value={formData.price}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="type">Type</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value) => handleSelectChange("type", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CONSUMABLE">Consumable</SelectItem>
                    <SelectItem value="EQUIPMENT">Equipment</SelectItem>
                    <SelectItem value="SPECIAL">Special</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="effect">Effect</Label>
                <Select
                  value={formData.effect || ""}
                  onValueChange={(value) => handleSelectChange("effect", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Effect" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="HEALTH_BOOST">Health Boost</SelectItem>
                    <SelectItem value="DEFENSE_BOOST">Defense Boost</SelectItem>
                    <SelectItem value="ATTACK_BOOST">Attack Boost</SelectItem>
                    <SelectItem value="SCORE_MULTIPLIER">Score Multiplier</SelectItem>
                    <SelectItem value="TIME_EXTENSION">Time Extension</SelectItem>
                    <SelectItem value="STREAK_DECREASE">Streak Decrease</SelectItem>
                    <SelectItem value="STREAK_PROTECT">Streak Protect</SelectItem>
                    <SelectItem value="NONE">None</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="duration">Duration (seconds)</Label>
                  <Input
                    id="duration"
                    name="duration"
                    type="number"
                    min="0"
                    value={formData.duration || 0}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="cooldown">Cooldown (seconds)</Label>
                  <Input
                    id="cooldown"
                    name="cooldown"
                    type="number"
                    min="0"
                    value={formData.cooldown || 0}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="isActive"
                  checked={formData.isActive}
                  onCheckedChange={(checked) => handleSwitchChange("isActive", checked)}
                />
                <Label htmlFor="isActive">Active in Marketplace</Label>
              </div>
            </div>

            <DialogFooter className="mt-6">
              <Button type="button" variant="outline" onClick={() => handleDialogClose(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {editingItemId ? "Updating..." : "Creating..."}
                  </>
                ) : (
                  editingItemId ? "Update Item" : "Create Item"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
} 