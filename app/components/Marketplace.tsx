'use client';

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/lib/use-toast-hook";
import { Button } from "@/components/ui/button";
import {
  Card,
 
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

import { Loader2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MarketplaceItem } from "./MarketplaceItem";

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
  userOwns: boolean;
  quantity: number;
  lastUsed: string | null;
  canAfford: boolean;
  isActive: boolean;
}

interface User {
  id: string;
  name: string;
}

export default function Marketplace() {
  const [items, setItems] = useState<Item[]>([]);
  const [userScore, setUserScore] = useState(0);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [actionDialogOpen, setActionDialogOpen] = useState(false);
  const [dialogAction, setDialogAction] = useState<"purchase" | "use">("purchase");
  const [actionLoading, setActionLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("shop");
  const [isAdmin, setIsAdmin] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedTargetId, setSelectedTargetId] = useState<string>("");
  const [needsTarget, setNeedsTarget] = useState(false);
  
  const router = useRouter();
  const { toast } = useToast();

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/items");
      if (!response.ok) {
        throw new Error("Failed to fetch items");
      }
      const data = await response.json();
      setItems(data.items);
      setUserScore(data.userScore);
      setIsAdmin(data.isAdmin || false);
    } catch (error) {
      console.error("Error fetching items:", error);
      toast({
        title: "Error",
        description: "Failed to load marketplace items",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const fetchUsers = useCallback(async () => {
    try {
      const response = await fetch("/api/users");
      
      if (!response.ok) {
        throw new Error("Failed to fetch users");
      }
      
      const data = await response.json();
      setUsers(data.users);
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  }, []);

  useEffect(() => {
    fetchItems();
    fetchUsers();
  }, [fetchItems, fetchUsers]);

  const handleItemAction = (item: Item, action: "purchase" | "use") => {
    setSelectedItem(item);
    setDialogAction(action);
    
    setNeedsTarget(action === "use" && item.effect === "STREAK_DECREASE");
    setSelectedTargetId("");
    
    setActionDialogOpen(true);
  };

  const confirmAction = async () => {
    if (!selectedItem) return;
    
    if (needsTarget && !selectedTargetId) {
      toast({
        title: "Target Required",
        description: "You must select a target user for this item",
        variant: "destructive",
      });
      return;
    }
    
    setActionLoading(true);
    try {
      if (dialogAction === "purchase") {
        await purchaseItem(selectedItem.id);
      } else {
        await handleUseItem(selectedItem.id, needsTarget ? selectedTargetId : undefined);
      }
    } finally {
      setActionLoading(false);
      setActionDialogOpen(false);
    }
  };

  const purchaseItem = async (itemId: string) => {
    try {
      const response = await fetch("/api/items/purchase", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ itemId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to purchase item");
      }

      toast({
        title: "Success! 🎉",
        description: data.message,
      });

      // Update local state
      setUserScore(data.newScore);
      
      // Refresh items
      fetchItems();
    } catch (error) {
      console.error("Error purchasing item:", error);
      toast({
        title: "Purchase Failed",
        description: error instanceof Error ? error.message : "An unexpected error occurred during purchase",
        variant: "destructive",
      });
      
      // Refresh items to ensure UI is consistent
      fetchItems();
    }
  };

  const handleUseItem = async (itemId: string, targetUserId?: string) => {
    try {
      const response = await fetch("/api/items/use", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          itemId,
          targetUserId: targetUserId || null 
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to use item");
      }

      toast({
        title: "Item Used! ✨",
        description: data.effect || data.message || "Item effect applied",
      });

      // Refresh items
      fetchItems();
    } catch (error) {
      console.error("Error using item:", error);
      toast({
        title: "Action Failed",
        description: error instanceof Error ? error.message : "Failed to use item",
        variant: "destructive",
      });
      
      // Refresh items to ensure UI is consistent
      fetchItems();
    }
  };

  const formatItemType = (type: string) => {
    return type.split("_").map(word => 
      word.charAt(0) + word.slice(1).toLowerCase()
    ).join(" ");
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[300px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Marketplace 🛍️</h1>
        <div className="flex items-center space-x-2">
          <span className="text-md font-medium">Your Score:</span>
          <Badge variant="outline" className="text-xl py-1 px-3">
            {userScore} 🏆
          </Badge>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="shop">Shop</TabsTrigger>
          <TabsTrigger value="inventory">My Items</TabsTrigger>
        </TabsList>
        
        <TabsContent value="shop" className="mt-6">
          {items.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-gray-500">No items available right now. Check back later!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {items.map((item) => (
                <Card key={item.id} className={`overflow-hidden ${!item.isActive ? 'border-orange-500 border-2' : ''} ${!item.canAfford && !item.userOwns && !isAdmin ? 'opacity-70' : ''}`}>
                  <MarketplaceItem
                    id={item.id}
                    name={item.name}
                    description={item.description}
                    imageUrl={item.imageUrl || "/placeholder.png"}
                    price={item.price}
                    type={item.type}
                    effect={item.effect}
                    duration={item.duration}
                    cooldown={item.cooldown}
                    userOwns={item.userOwns}
                    quantity={item.quantity}
                    lastUsed={item.lastUsed}
                    canAfford={item.canAfford}
                    isAdmin={isAdmin}
                    onPurchase={async () => await handleItemAction(item, "purchase")}
                    onUse={async () => await handleItemAction(item, "use")}
                  />
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="inventory" className="mt-6">
          {items.filter(item => item.userOwns && item.quantity > 0).length === 0 ? (
            <div className="text-center py-10">
              <p className="text-gray-500">You don&apos;t own any items yet. Purchase some from the shop!</p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => setActiveTab("shop")}
              >
                Go to Shop
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {items
                .filter(item => item.userOwns && item.quantity > 0)
                .map((item) => (
                  <Card key={item.id} className="overflow-hidden">
                    <MarketplaceItem
                      id={item.id}
                      name={item.name}
                      description={item.description}
                      imageUrl={item.imageUrl || "/placeholder.png"}
                      price={item.price}
                      type={item.type}
                      effect={item.effect}
                      duration={item.duration}
                      cooldown={item.cooldown}
                      userOwns={item.userOwns}
                      quantity={item.quantity}
                      lastUsed={item.lastUsed}
                      canAfford={item.canAfford}
                      isAdmin={isAdmin}
                      onPurchase={async () => await handleItemAction(item, "purchase")}
                      onUse={async () => await handleItemAction(item, "use")}
                    />
                  </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Action dialog (purchase or use) */}
      <Dialog open={actionDialogOpen} onOpenChange={setActionDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {dialogAction === "purchase" 
                ? `Purchase ${selectedItem?.name}` 
                : `Use ${selectedItem?.name}`}
            </DialogTitle>
            <DialogDescription>
              {dialogAction === "purchase" && isAdmin 
                ? "As an admin, you can purchase items without spending points."
                : dialogAction === "purchase" 
                  ? `Are you sure you want to spend ${selectedItem?.price} score points to purchase this item?`
                  : `Are you sure you want to use this item? This will consume 1 from your inventory.`}
            </DialogDescription>
            {dialogAction === "use" && selectedItem?.effect && (
              <div className="mt-2 p-2 bg-primary/10 rounded-md text-sm">
                <span className="font-semibold">Effect:</span> {selectedItem.effect}
              </div>
            )}
          </DialogHeader>
          {selectedItem && (
            <div className="py-4">
              {selectedItem.description && (
                <p className="text-sm text-gray-500 mb-2">{selectedItem.description}</p>
              )}
              {dialogAction === "purchase" && (
                <div className="flex justify-between text-sm">
                  <span>Your Score:</span>
                  <span>{userScore} 🏆 {isAdmin && "(Admin: Free purchase)"}</span>
                </div>
              )}
              {dialogAction === "use" && (
                <div className="flex justify-between text-sm">
                  <span>Your Quantity:</span>
                  <span>{selectedItem.quantity}</span>
                </div>
              )}
              {dialogAction === "use" && selectedItem.cooldown && selectedItem.cooldown > 0 && (
                <div className="mt-2 flex justify-between text-sm">
                  <span>Cooldown After Use:</span>
                  <span>{selectedItem.cooldown} hour{selectedItem.cooldown !== 1 ? 's' : ''}</span>
                </div>
              )}
              
              {/* Target user selection for attack items */}
              {needsTarget && (
                <div className="mt-4">
                  <p className="text-sm font-medium mb-2">Select Target User:</p>
                  <Select value={selectedTargetId} onValueChange={setSelectedTargetId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a user to target" />
                    </SelectTrigger>
                    <SelectContent>
                      {users.map(user => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground mt-2">
                    The selected user will have their streak decreased by 1 if they don&apos;t have active protection.
                  </p>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setActionDialogOpen(false)}
              disabled={actionLoading}
            >
              Cancel
            </Button>
            <Button
              onClick={confirmAction}
              disabled={actionLoading || (needsTarget && !selectedTargetId)}
              variant={dialogAction === "use" ? "default" : "default"}
            >
              {actionLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                dialogAction === "purchase" ? `Confirm ${isAdmin ? "Admin " : ""}Purchase` : "Use Item"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 