"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ShoppingBag, Package, AlertTriangle, Search, Plus, ShoppingCart, Shield, Zap } from "lucide-react";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import Image from "next/image";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { cn } from "@/lib/utils";

// Simple toast implementation
function showToast({ title, description }: { title: string; description: string }) {
  // Create toast container if it doesn't exist
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    container.className = 'fixed bottom-4 right-4 z-50 flex flex-col gap-2';
    document.body.appendChild(container);
  }
  
  // Create toast element
  const toast = document.createElement('div');
  toast.className = 'bg-white dark:bg-gray-800 rounded-md border p-4 shadow-md flex items-start gap-3 min-w-[300px] animate-in fade-in slide-in-from-right-5';
  
  // Create toast content
  const content = document.createElement('div');
  content.className = 'flex-1';
  
  const titleElement = document.createElement('h4');
  titleElement.className = 'font-medium text-foreground';
  titleElement.textContent = title;
  
  const descriptionElement = document.createElement('p');
  descriptionElement.className = 'text-sm text-muted-foreground mt-1';
  descriptionElement.textContent = description;
  
  content.appendChild(titleElement);
  content.appendChild(descriptionElement);
  
  // Create close button
  const closeButton = document.createElement('button');
  closeButton.className = 'text-muted-foreground hover:text-foreground';
  closeButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>';
  closeButton.onclick = () => {
    toast.classList.replace('fade-in', 'fade-out');
    setTimeout(() => toast.remove(), 300);
  };
  
  // Add elements to toast
  toast.appendChild(content);
  toast.appendChild(closeButton);
  
  // Add toast to container
  container.appendChild(toast);
  
  // Auto-remove after 5 seconds
  setTimeout(() => {
    if (toast.parentNode) {
      toast.classList.replace('fade-in', 'fade-out');
      setTimeout(() => toast.remove(), 300);
    }
  }, 5000);
}

// Use this function instead of the imported toast
const toast = showToast;

// Define custom components locally instead of importing missing ones
const StatsCard = ({ title, value, icon, description, trend }: { 
  title: string; 
  value: string | number; 
  icon: React.ReactNode;
  description?: string;
  trend?: { 
    value: number;
    label?: string; 
  };
}) => (
  <Card className="p-4">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm text-muted-foreground">{title}</p>
        <h3 className="text-2xl font-bold">{value}</h3>
        {description && <p className="text-xs text-muted-foreground mt-1">{description}</p>}
        {trend && (
          <div className="text-xs mt-1">
            <span className="px-1 py-0.5 rounded-sm bg-green-100 text-green-800">
              {trend.value}% {trend.label}
            </span>
          </div>
        )}
      </div>
      <div className="text-muted-foreground">{icon}</div>
    </div>
  </Card>
);

// Define simple ItemCard component
const ItemCard = ({ 
  id,
  name,
  description,
  price,
  imageUrl,
  type,
  effect,
  isActive,
  onEdit,
  onDelete,
  onToggleStatus
}: { 
  id: string;
  name: string;
  description: string;
  imageUrl?: string;
  price: number;
  type?: string;
  effect?: string | null;
  isActive: boolean;
  onEdit: (id: string) => void;
  onDelete: (id: string, name: string) => void;
  onToggleStatus: (id: string, isActive: boolean, name: string) => void;
}) => (
  <Card className={`p-4 ${!isActive ? 'opacity-70' : ''}`}>
    <div className="flex justify-between">
      <div className="flex gap-3">
        {imageUrl && (
          <div className="h-16 w-16 relative rounded overflow-hidden flex-shrink-0">
            <Image 
              src={imageUrl} 
              alt={name}
              width={64}
              height={64}
              className="object-cover"
              style={{ width: '100%', height: '100%' }}
            />
          </div>
        )}
        <div>
          <h3 className="font-medium">{name}</h3>
          <p className="text-sm text-muted-foreground">{description}</p>
          <p className="mt-2 font-medium">{price} points</p>
          <div className="mt-1 flex flex-wrap gap-1">
            <Badge variant={isActive ? "default" : "outline"}>
              {isActive ? "Active" : "Inactive"}
            </Badge>
            {type && (
              <Badge variant="secondary">
                {type}
              </Badge>
            )}
            {effect && effect !== "" && (
              <Badge variant="outline" className="bg-amber-100 text-amber-800 border-amber-200">
                {effect.replace(/_/g, ' ')}
              </Badge>
            )}
          </div>
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <Button variant="outline" size="sm" onClick={() => onEdit(id)}>Edit</Button>
        <Button variant="outline" size="sm" onClick={() => onToggleStatus(id, isActive, name)}>
          {isActive ? "Disable" : "Enable"}
        </Button>
        <Button variant="destructive" size="sm" onClick={() => onDelete(id, name)}>Delete</Button>
      </div>
    </div>
  </Card>
);

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
  | "";

interface Item {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  price: number;
  type: ItemType;
  effect: EffectType;
  duration: number;
  cooldown: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Default empty item for the form
const defaultItem = {
  id: "",
    name: "",
    description: "",
    imageUrl: "",
  price: 0,
    type: "CONSUMABLE" as ItemType,
  effect: "" as EffectType,
  duration: 0,
  cooldown: 0,
    isActive: true,
  createdAt: "",
  updatedAt: ""
};

export default function AdminItems() {
  // State for items and UI control
  const [items, setItems] = useState<Item[]>([]);
  const [filteredItems, setFilteredItems] = useState<Item[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentTab, setCurrentTab] = useState<ItemType | "ALL">("ALL");
  
  // Dialog state
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<"create" | "edit">("create");
  const [currentItem, setCurrentItem] = useState<Item>(defaultItem);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Stats state
  const [stats, setStats] = useState({
    total: 0,
    consumable: 0,
    equipment: 0,
    special: 0,
    active: 0,
    inactive: 0
  });

  // Fetch items data
  const fetchItems = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/admin/items');
      if (!response.ok) throw new Error('Failed to fetch items');

      const data = await response.json();
      const itemsData = Array.isArray(data) ? data : (data.items || []);
      setItems(itemsData);
      setFilteredItems(itemsData);
      updateStats(itemsData);
    } catch (error) {
      console.error('Error fetching items:', error);
      toast({
        title: "Error",
        description: "Failed to load items. Please try again."
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Initialize
  useEffect(() => {
    fetchItems();
  }, []);

  // Update stats when items change
  const updateStats = (itemsData: Item[]) => {
    setStats({
      total: itemsData.length,
      consumable: itemsData.filter(item => item.type === "CONSUMABLE").length,
      equipment: itemsData.filter(item => item.type === "EQUIPMENT").length,
      special: itemsData.filter(item => item.type === "SPECIAL").length,
      active: itemsData.filter(item => item.isActive).length,
      inactive: itemsData.filter(item => !item.isActive).length
    });
  };
  
  // Handle filtering and searching
  useEffect(() => {
    // Apply filters based on tab and search query
    let filtered = items;
    
    // Filter by type
    if (currentTab !== "ALL") {
      filtered = filtered.filter(item => item.type === currentTab);
    }
    
    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(item => 
        item.name.toLowerCase().includes(query) || 
        item.description.toLowerCase().includes(query)
      );
    }
    
    setFilteredItems(filtered);
  }, [items, currentTab, searchQuery]);

  // Handle form submission
  const handleSubmit = async (formData: Omit<Item, 'id' | 'createdAt' | 'updatedAt'>) => {
    setIsSubmitting(true);
    
    try {
      let url = '/api/admin/items';
      let method = 'POST';
      
      // If editing, add the ID parameter to the URL
      if (dialogMode === 'edit') {
        url = `${url}/${currentItem.id}`;
        method = 'PUT';
      }
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error('Failed to save item');
      }
      
        toast({
        title: dialogMode === 'edit' ? "Item Updated" : "Item Created",
        description: `${formData.name} has been successfully ${dialogMode === 'edit' ? 'updated' : 'created'}.`
      });
      
      fetchItems(); // Refresh the items list
      setIsDialogOpen(false);
    } catch (error) {
      console.error('Error saving item:', error);
      toast({
        title: "Error",
        description: `Failed to ${dialogMode === 'edit' ? 'update' : 'create'} item. Please try again.`
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle delete item
  const handleDeleteItem = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"?`)) return;
    
    try {
      const response = await fetch(`/api/admin/items/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) throw new Error('Failed to delete item');
      
        toast({
        title: "Item Deleted",
        description: `${name} has been successfully deleted.`
      });
      
      fetchItems(); // Refresh the items list
    } catch (error) {
      console.error('Error deleting item:', error);
      toast({
        title: "Error",
        description: "Failed to delete item. Please try again."
      });
    }
  };

  // Handle toggle item status
  const handleToggleStatus = async (id: string, isActive: boolean, name: string) => {
    try {
      const response = await fetch(`/api/admin/items/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isActive: !isActive }),
      });

      if (!response.ok) throw new Error('Failed to update item status');
      
        toast({
        title: "Status Updated",
        description: `${name} has been ${!isActive ? 'activated' : 'deactivated'}.`
      });
      
      fetchItems(); // Refresh the items list
    } catch (error) {
      console.error('Error updating item status:', error);
      toast({
        title: "Error",
        description: "Failed to update item status. Please try again."
      });
    }
  };

  // Open dialog to create a new item
  const openCreateDialog = () => {
    setDialogMode('create');
    setCurrentItem(defaultItem);
    setIsDialogOpen(true);
  };

  // Open dialog to edit an existing item
  const openEditDialog = (itemId: string) => {
    const item = items.find(item => item.id === itemId);
    if (item) {
      setDialogMode('edit');
      setCurrentItem(item);
      setIsDialogOpen(true);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Item Management</h1>
      <div className="h-[1px] bg-border" />
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatsCard 
          title="Total Items" 
          value={stats.total.toString()} 
          icon={<Package className="h-5 w-5" />}
          description="All items in database" 
        />
        <StatsCard 
          title="Active Items" 
          value={stats.active.toString()} 
          icon={<ShoppingBag className="h-5 w-5" />}
          description="Items visible in shop" 
          trend={{ 
            value: stats.total > 0 ? Math.round((stats.active / stats.total) * 100) : 0, 
            label: "of total" 
          }}
        />
        <StatsCard 
          title="Inactive Items" 
          value={stats.inactive.toString()} 
          icon={<AlertTriangle className="h-5 w-5" />}
          description="Hidden from shop" 
        />
      </div>
      
      {/* Tools bar */}
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div className="relative w-full sm:w-1/3">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search items..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Button onClick={openCreateDialog}>
          <Plus className="mr-2 h-4 w-4" /> Add New Item
          </Button>
      </div>

      {/* Tabs and Item Grid */}
      <Tabs defaultValue="ALL" value={currentTab} onValueChange={(value) => setCurrentTab(value as ItemType | "ALL")}>
        <TabsList className="grid grid-cols-4 w-full sm:w-fit mb-4">
          <TabsTrigger value="ALL">All</TabsTrigger>
          <TabsTrigger value="CONSUMABLE" className="flex items-center gap-1">
            <ShoppingCart className="h-4 w-4" />
            <span className="hidden sm:inline">Consumable</span>
          </TabsTrigger>
          <TabsTrigger value="EQUIPMENT" className="flex items-center gap-1">
            <Shield className="h-4 w-4" />
            <span className="hidden sm:inline">Equipment</span>
          </TabsTrigger>
          <TabsTrigger value="SPECIAL" className="flex items-center gap-1">
            <Zap className="h-4 w-4" />
            <span className="hidden sm:inline">Special</span>
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="ALL" className="mt-0">
          {isLoading ? (
            <div className="flex justify-center py-10">
              <div className="animate-spin h-10 w-10 border-4 border-primary border-t-transparent rounded-full"></div>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="text-center py-10 border rounded-lg bg-muted/20">
              <Package className="mx-auto h-12 w-12 text-muted-foreground mb-3" />
              <h3 className="text-lg font-medium">No items found</h3>
              <p className="text-sm text-muted-foreground mb-4">
                {searchQuery ? "Try a different search term" : "Create your first item to get started"}
              </p>
              {!searchQuery && (
                <Button onClick={openCreateDialog} variant="outline">
                  <Plus className="mr-2 h-4 w-4" /> Add New Item
                </Button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredItems.map(item => (
                <ItemCard
                  key={item.id}
                  id={item.id}
                  name={item.name}
                  description={item.description}
                  price={item.price}
                  imageUrl={item.imageUrl}
                  type={item.type}
                  effect={item.effect}
                  isActive={item.isActive}
                  onEdit={openEditDialog}
                  onDelete={handleDeleteItem}
                  onToggleStatus={handleToggleStatus}
                />
              ))}
            </div>
          )}
        </TabsContent>
        
        {/* The remaining tabs just reuse the ALL tab's content with filtering */}
        <TabsContent value="CONSUMABLE" className="mt-0">
          {/* Same structure as ALL tab, but filtered by currentTab */}
          {isLoading ? (
            <div className="flex justify-center py-10">
              <div className="animate-spin h-10 w-10 border-4 border-primary border-t-transparent rounded-full"></div>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="text-center py-10 border rounded-lg bg-muted/20">
              <ShoppingCart className="mx-auto h-12 w-12 text-muted-foreground mb-3" />
              <h3 className="text-lg font-medium">No consumable items found</h3>
              <p className="text-sm text-muted-foreground mb-4">
                {searchQuery ? "Try a different search term" : "Create your first consumable item"}
              </p>
              {!searchQuery && (
                <Button onClick={openCreateDialog} variant="outline">
                  <Plus className="mr-2 h-4 w-4" /> Add Consumable
                </Button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredItems.map(item => (
                <ItemCard
                  key={item.id}
                  id={item.id}
                  name={item.name}
                  description={item.description}
                  price={item.price}
                  imageUrl={item.imageUrl}
                  type={item.type}
                  effect={item.effect}
                  isActive={item.isActive}
                  onEdit={openEditDialog}
                  onDelete={handleDeleteItem}
                  onToggleStatus={handleToggleStatus}
                />
              ))}
      </div>
          )}
        </TabsContent>
        
        <TabsContent value="EQUIPMENT" className="mt-0">
          {/* Equipment tab content - similar structure */}
          {isLoading ? (
            <div className="flex justify-center py-10">
              <div className="animate-spin h-10 w-10 border-4 border-primary border-t-transparent rounded-full"></div>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="text-center py-10 border rounded-lg bg-muted/20">
              <Shield className="mx-auto h-12 w-12 text-muted-foreground mb-3" />
              <h3 className="text-lg font-medium">No equipment items found</h3>
              <p className="text-sm text-muted-foreground mb-4">
                {searchQuery ? "Try a different search term" : "Create your first equipment item"}
              </p>
              {!searchQuery && (
                <Button onClick={openCreateDialog} variant="outline">
                  <Plus className="mr-2 h-4 w-4" /> Add Equipment
                </Button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredItems.map(item => (
                <ItemCard
                  key={item.id}
                  id={item.id}
                  name={item.name}
                  description={item.description}
                  price={item.price}
                  imageUrl={item.imageUrl}
                  type={item.type}
                  effect={item.effect}
                  isActive={item.isActive}
                  onEdit={openEditDialog}
                  onDelete={handleDeleteItem}
                  onToggleStatus={handleToggleStatus}
                />
              ))}
                            </div>
                          )}
        </TabsContent>
        
        <TabsContent value="SPECIAL" className="mt-0">
          {/* Special tab content - similar structure */}
          {isLoading ? (
            <div className="flex justify-center py-10">
              <div className="animate-spin h-10 w-10 border-4 border-primary border-t-transparent rounded-full"></div>
                        </div>
          ) : filteredItems.length === 0 ? (
            <div className="text-center py-10 border rounded-lg bg-muted/20">
              <Zap className="mx-auto h-12 w-12 text-muted-foreground mb-3" />
              <h3 className="text-lg font-medium">No special items found</h3>
              <p className="text-sm text-muted-foreground mb-4">
                {searchQuery ? "Try a different search term" : "Create your first special item"}
              </p>
              {!searchQuery && (
                <Button onClick={openCreateDialog} variant="outline">
                  <Plus className="mr-2 h-4 w-4" /> Add Special Item
                        </Button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredItems.map(item => (
                <ItemCard
                  key={item.id}
                  id={item.id}
                  name={item.name}
                  description={item.description}
                  price={item.price}
                  imageUrl={item.imageUrl}
                  type={item.type}
                  effect={item.effect}
                  isActive={item.isActive}
                  onEdit={openEditDialog}
                  onDelete={handleDeleteItem}
                  onToggleStatus={handleToggleStatus}
                />
              ))}
          </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Dialog for creating/editing items */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {dialogMode === 'create' ? 'Create New Item' : `Edit Item: ${currentItem.name}`}
            </DialogTitle>
          </DialogHeader>
          
          {/* Simple form until we create a proper ItemForm component */}
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label htmlFor="name" className="text-sm font-medium">Name</label>
                <Input
                  id="name"
                placeholder="Item name"
                value={currentItem.name}
                onChange={(e) => setCurrentItem({...currentItem, name: e.target.value})}
                />
              </div>

            <div className="space-y-2">
              <label htmlFor="description" className="text-sm font-medium">Description</label>
              <Input 
                  id="description"
                placeholder="Item description"
                value={currentItem.description}
                onChange={(e) => setCurrentItem({...currentItem, description: e.target.value})}
                />
              </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="price" className="text-sm font-medium">Price (points)</label>
                <Input
                  id="price" 
                  type="number"
                  placeholder="Item price"
                  value={currentItem.price ?? 0}
                  onChange={(e) => setCurrentItem({...currentItem, price: Number(e.target.value) || 0})}
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="imageUrl" className="text-sm font-medium">Image URL</label>
                <Input
                  id="imageUrl" 
                  placeholder="https://example.com/image.jpg"
                  value={currentItem.imageUrl}
                  onChange={(e) => setCurrentItem({...currentItem, imageUrl: e.target.value})}
                />
              </div>
              </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="type" className="text-sm font-medium">Item Type</label>
                <select 
                  id="type"
                  className="w-full h-10 px-3 py-2 rounded-md border border-input bg-background"
                  value={currentItem.type}
                  onChange={(e) => setCurrentItem({...currentItem, type: e.target.value as ItemType})}
                >
                  <option value="CONSUMABLE">Consumable</option>
                  <option value="EQUIPMENT">Equipment</option>
                  <option value="SPECIAL">Special</option>
                </select>
              </div>

              <div className="space-y-2">
                <label htmlFor="effect" className="text-sm font-medium">Effect Type</label>
                <select 
                  id="effect"
                  className="w-full h-10 px-3 py-2 rounded-md border border-input bg-background"
                  value={currentItem.effect || "NONE"}
                  onChange={(e) => {
                    const value = e.target.value === "NONE" ? "" : e.target.value as EffectType;
                    setCurrentItem({...currentItem, effect: value});
                  }}
                >
                  <option value="NONE">None</option>
                  <option value="HEALTH_BOOST">Health Boost</option>
                  <option value="DEFENSE_BOOST">Defense Boost</option>
                  <option value="ATTACK_BOOST">Attack Boost</option>
                  <option value="SCORE_MULTIPLIER">Score Multiplier</option>
                  <option value="TIME_EXTENSION">Time Extension</option>
                  <option value="STREAK_DECREASE">Streak Decrease</option>
                  <option value="STREAK_PROTECT">Streak Protection</option>
                </select>
              </div>
              </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="duration" className="text-sm font-medium">Duration (hours)</label>
                  <Input
                    id="duration"
                    type="number"
                  placeholder="Duration in hours"
                  value={currentItem.duration ?? 0}
                  onChange={(e) => setCurrentItem({...currentItem, duration: Number(e.target.value) || 0})}
                  />
                </div>

              <div className="space-y-2">
                <label htmlFor="cooldown" className="text-sm font-medium">Cooldown (hours)</label>
                  <Input
                    id="cooldown"
                    type="number"
                  placeholder="Cooldown in hours"
                  value={currentItem.cooldown ?? 0}
                  onChange={(e) => setCurrentItem({...currentItem, cooldown: Number(e.target.value) || 0})}
                />
              </div>
            </div>

            <div className="flex justify-end">
              <Button 
                type="button" 
                disabled={isSubmitting}
                onClick={() => handleSubmit(currentItem)}
              >
                {isSubmitting ? 'Saving...' : (dialogMode === 'create' ? 'Create Item' : 'Update Item')}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Predefined Items Button */}
      <div className="fixed bottom-4 right-4">
        <Button
          onClick={() => {
            // Create predefined game items
            const createPredefinedItems = async () => {
              const items = [
                {
                  name: "Shield of Protection",
                  description: "Provides additional defense and protects your streak. When active, other users cannot reduce your streak.",
                  imageUrl: "https://img.icons8.com/fluency/96/shield.png",
                  price: 25,
                  type: "EQUIPMENT" as ItemType,
                  effect: "STREAK_PROTECT" as EffectType,
                  duration: 24, // 1 day
                  cooldown: 0,
                  isActive: true
                },
                {
                  name: "Magic Wand",
                  description: "When used, reduces a random player's streak by 1-5 points.",
                  imageUrl: "https://img.icons8.com/fluency/96/magic-wand.png",
                  price: 15,
                  type: "CONSUMABLE" as ItemType,
                  effect: "STREAK_DECREASE" as EffectType,
                  duration: 0, // Instant use
                  cooldown: 12,
                  isActive: true
                },
                {
                  name: "Power Sword",
                  description: "Increases attack power. When used with Magic Wand, it can pierce through Shield of Protection.",
                  imageUrl: "https://img.icons8.com/fluency/96/sword.png",
                  price: 30,
                  type: "EQUIPMENT" as ItemType,
                  effect: "ATTACK_BOOST" as EffectType,
                  duration: 0.5, // 30 minutes
                  cooldown: 18,
                  isActive: true
                },
                {
                  name: "Bonus Time",
                  description: "Extends meal submission time by 10 minutes for all meals for 1 day.",
                  imageUrl: "https://img.icons8.com/fluency/96/time.png",
                  price: 20,
                  type: "SPECIAL" as ItemType,
                  effect: "TIME_EXTENSION" as EffectType,
                  duration: 24, // 1 day
                  cooldown: 48, // 2 days
                  isActive: true
                }
              ];

              for (const item of items) {
                try {
                  const response = await fetch('/api/admin/items', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(item)
                  });
                  
                  if (!response.ok) {
                    throw new Error(`Failed to create item: ${item.name}`);
                  }
                } catch (error) {
                  console.error(`Error creating item ${item.name}:`, error);
                  toast({
                    title: "Error",
                    description: `Failed to create ${item.name}. Please try again.`
                  });
                }
              }
              
              toast({
                title: "Success",
                description: "Predefined game items have been created!"
              });
              
              fetchItems(); // Refresh the list
            };

            if (confirm("Do you want to add predefined game items?")) {
              createPredefinedItems();
            }
          }}
          variant="outline"
          className="bg-primary text-primary-foreground hover:bg-primary/90"
        >
          Add Game Items 🎮
        </Button>
      </div>
    </div>
  );
} 