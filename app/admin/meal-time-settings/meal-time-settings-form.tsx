"use client";

import { useEffect, useState } from "react";
import { toast } from "@/lib/use-toast-hook";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, SaveIcon, ClockIcon } from "lucide-react";

interface MealTimeSettings {
  id?: string;
  breakfastStart: number;
  breakfastEnd: number;
  lunchStart: number;
  lunchEnd: number;
  dinnerStart: number;
  dinnerEnd: number;
  updatedAt?: Date;
  updatedBy?: string | null;
}

export default function MealTimeSettingsForm() {
  const [settings, setSettings] = useState<MealTimeSettings>({
    breakfastStart: 6,
    breakfastEnd: 9,
    lunchStart: 12,
    lunchEnd: 15,
    dinnerStart: 16,
    dinnerEnd: 20,
  });
  const [originalSettings, setOriginalSettings] = useState<MealTimeSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  // Fetch current meal time settings
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await fetch("/api/meal-time-settings");
        if (response.ok) {
          const data = await response.json();
          setSettings(data);
          setOriginalSettings(data);
          setLastUpdated(new Date(data.updatedAt).toLocaleString());
        } else {
          toast({
            title: "Error",
            description: "Failed to fetch meal time settings",
          });
        }
      } catch (error) {
        console.error("Error fetching meal time settings:", error);
        toast({
          title: "Error",
          description: "Failed to connect to server",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchSettings();
  }, []);

  const handleInputChange = (field: keyof MealTimeSettings, value: string) => {
    // Ensure value is within 0-23 range
    const numValue = parseInt(value);
    if (isNaN(numValue) || numValue < 0 || numValue > 23) return;

    setSettings({
      ...settings,
      [field]: numValue,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    // Validate time ranges
    if (settings.breakfastStart >= settings.breakfastEnd) {
      toast({
        title: "Invalid time range",
        description: "Breakfast end time must be after start time",
      });
      setIsSaving(false);
      return;
    }

    if (settings.lunchStart >= settings.lunchEnd) {
      toast({
        title: "Invalid time range",
        description: "Lunch end time must be after start time",
      });
      setIsSaving(false);
      return;
    }

    if (settings.dinnerStart >= settings.dinnerEnd) {
      toast({
        title: "Invalid time range",
        description: "Dinner end time must be after start time",
      });
      setIsSaving(false);
      return;
    }

    try {
      const response = await fetch("/api/meal-time-settings", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(settings),
      });

      if (response.ok) {
        const data = await response.json();
        setSettings(data);
        setOriginalSettings(data);
        setLastUpdated(new Date(data.updatedAt).toLocaleString());
        toast({
          title: "Success",
          description: "Meal time settings updated successfully",
        });
      } else {
        const error = await response.json();
        toast({
          title: "Error",
          description: error.message || "Failed to update meal time settings",
        });
      }
    } catch (error) {
      console.error("Error updating meal time settings:", error);
      toast({
        title: "Error",
        description: "Failed to connect to server",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const hasChanges = originalSettings && (
    settings.breakfastStart !== originalSettings.breakfastStart ||
    settings.breakfastEnd !== originalSettings.breakfastEnd ||
    settings.lunchStart !== originalSettings.lunchStart ||
    settings.lunchEnd !== originalSettings.lunchEnd ||
    settings.dinnerStart !== originalSettings.dinnerStart ||
    settings.dinnerEnd !== originalSettings.dinnerEnd
  );

  const formatTime = (hour: number) => {
    const period = hour < 12 ? "AM" : "PM";
    const displayHour = hour % 12 || 12;
    return `${displayHour}:00 ${period}`;
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2 text-lg">Loading settings...</span>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-xl font-semibold">⏰ Meal Time Windows</h2>
        <p className="text-sm text-muted-foreground">
          Configure the time windows during which users can upload their meal photos.
          These settings affect streak calculations and meal submission availability.
        </p>
        {lastUpdated && (
          <p className="text-xs text-muted-foreground">
            Last updated: {lastUpdated}
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Breakfast Settings */}
        <Card className="p-4 border border-primary/10 bg-primary/5">
          <div className="text-lg font-semibold mb-3 flex items-center text-amber-500">
            <ClockIcon className="mr-2 h-5 w-5" />
            Breakfast
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="breakfastStart">Start Time</Label>
              <div className="relative">
                <Input
                  id="breakfastStart"
                  type="number"
                  min="0"
                  max="23"
                  value={settings.breakfastStart}
                  onChange={(e) => handleInputChange("breakfastStart", e.target.value)}
                  className="pr-16"
                />
                <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none text-muted-foreground">
                  {formatTime(settings.breakfastStart)}
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="breakfastEnd">End Time</Label>
              <div className="relative">
                <Input
                  id="breakfastEnd"
                  type="number"
                  min="0"
                  max="23"
                  value={settings.breakfastEnd}
                  onChange={(e) => handleInputChange("breakfastEnd", e.target.value)}
                  className="pr-16"
                />
                <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none text-muted-foreground">
                  {formatTime(settings.breakfastEnd)}
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Lunch Settings */}
        <Card className="p-4 border border-primary/10 bg-primary/5">
          <div className="text-lg font-semibold mb-3 flex items-center text-orange-500">
            <ClockIcon className="mr-2 h-5 w-5" />
            Lunch
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="lunchStart">Start Time</Label>
              <div className="relative">
                <Input
                  id="lunchStart"
                  type="number"
                  min="0"
                  max="23"
                  value={settings.lunchStart}
                  onChange={(e) => handleInputChange("lunchStart", e.target.value)}
                  className="pr-16"
                />
                <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none text-muted-foreground">
                  {formatTime(settings.lunchStart)}
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="lunchEnd">End Time</Label>
              <div className="relative">
                <Input
                  id="lunchEnd"
                  type="number"
                  min="0"
                  max="23"
                  value={settings.lunchEnd}
                  onChange={(e) => handleInputChange("lunchEnd", e.target.value)}
                  className="pr-16"
                />
                <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none text-muted-foreground">
                  {formatTime(settings.lunchEnd)}
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Dinner Settings */}
        <Card className="p-4 border border-primary/10 bg-primary/5">
          <div className="text-lg font-semibold mb-3 flex items-center text-blue-500">
            <ClockIcon className="mr-2 h-5 w-5" />
            Dinner
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="dinnerStart">Start Time</Label>
              <div className="relative">
                <Input
                  id="dinnerStart"
                  type="number"
                  min="0"
                  max="23"
                  value={settings.dinnerStart}
                  onChange={(e) => handleInputChange("dinnerStart", e.target.value)}
                  className="pr-16"
                />
                <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none text-muted-foreground">
                  {formatTime(settings.dinnerStart)}
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="dinnerEnd">End Time</Label>
              <div className="relative">
                <Input
                  id="dinnerEnd"
                  type="number"
                  min="0"
                  max="23"
                  value={settings.dinnerEnd}
                  onChange={(e) => handleInputChange("dinnerEnd", e.target.value)}
                  className="pr-16"
                />
                <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none text-muted-foreground">
                  {formatTime(settings.dinnerEnd)}
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>

      <div className="border-t border-border pt-4 mt-4">
        <div className="flex justify-between items-center">
          <div className="text-sm text-muted-foreground">
            {hasChanges && "You have unsaved changes"}
          </div>
          <Button
            type="submit"
            className="vintage-button bg-primary"
            disabled={isSaving || !hasChanges}
          >
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <SaveIcon className="mr-2 h-4 w-4" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </div>
    </form>
  );
} 