'use client';

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-hot-toast';

export type MealTimeStatus = {
  breakfast: boolean;
  lunch: boolean;
  dinner: boolean;
};

interface ClockProps {
  onStatusChange?: (status: MealTimeStatus) => void;
  isAdmin?: boolean;
  onMealTimeUpdate?: (timeAgo: string) => void;
}

interface MealTimeSettings {
  id: string;
  breakfastStart: number;
  breakfastEnd: number;
  lunchStart: number;
  lunchEnd: number;
  dinnerStart: number;
  dinnerEnd: number;
  updatedAt: Date;
  updatedBy: string | null;
}

export default function Clock({ onStatusChange, isAdmin = false, onMealTimeUpdate }: ClockProps = {}) {
  const [currentTime, setCurrentTime] = useState<Date | null>(null);
  const [mealTimeStatus, setMealTimeStatus] = useState<MealTimeStatus>({
    breakfast: true,
    lunch: true,
    dinner: true,
  });
  const [settings, setSettings] = useState<MealTimeSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasCheckedChanges, setHasCheckedChanges] = useState(false);

  // Fetch meal time settings
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        // Only fetch settings if this is running on the client
        if (typeof window !== 'undefined') {
          // Use the admin endpoint for admins, and the public endpoint for regular users
          const endpoint = isAdmin ? '/api/admin/meal-time-settings' : '/api/meal-time-settings';
          const response = await fetch(endpoint);
          
          if (response.ok) {
            const data = await response.json();
            setSettings(data);
            
            // Check for recent changes (in the last 24 hours)
            if (!isAdmin && !hasCheckedChanges) {
              checkForRecentChanges(data);
              setHasCheckedChanges(true);
            }
          } else {
            console.error('Failed to fetch meal time settings:', response.status);
            // Use default values if fetching fails
            setSettings({
              id: 'default',
              breakfastStart: 6,
              breakfastEnd: 9,
              lunchStart: 12,
              lunchEnd: 15,
              dinnerStart: 16,
              dinnerEnd: 20,
              updatedAt: new Date(),
              updatedBy: null
            });
          }
        }
        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching meal time settings:', error);
        // Use default values if fetching fails
        setSettings({
          id: 'default',
          breakfastStart: 6,
          breakfastEnd: 9,
          lunchStart: 12,
          lunchEnd: 15,
          dinnerStart: 16,
          dinnerEnd: 20,
          updatedAt: new Date(),
          updatedBy: null
        });
        setIsLoading(false);
      }
    };

    fetchSettings();
  }, [isAdmin, hasCheckedChanges]);

  // Check if meal time settings were recently updated
  const checkForRecentChanges = (data: MealTimeSettings) => {
    try {
      // Get stored timestamp from local storage
      const storedTimestamp = localStorage.getItem('mealSettingsLastSeen');
      const lastSeenTime = storedTimestamp ? new Date(storedTimestamp) : null;
      
      // Convert updatedAt to Date if it's a string
      const lastUpdated = new Date(data.updatedAt);
      
      // Check if this is the first time seeing settings or if settings changed since last seen
      if (!lastSeenTime || lastUpdated > lastSeenTime) {
        // Show notification only if this isn't the first time using the app
        if (lastSeenTime) {
          // Calculate how long ago the change was made
          const timeAgo = getTimeAgo(lastUpdated);
          
          // Show toast notification
          toast.success(
            <div>
              <p className="font-bold">Meal time settings updated! ⏰</p>
              <p className="text-sm">Admin updated meal times {timeAgo}.</p>
              <p className="text-sm">Check the clock for new availability windows.</p>
            </div>,
            { duration: 6000, position: 'top-center' }
          );
          
          // Call the callback if provided
          if (onMealTimeUpdate) {
            onMealTimeUpdate(timeAgo);
          }
        }
        
        // Update the last seen timestamp in local storage
        localStorage.setItem('mealSettingsLastSeen', new Date().toISOString());
      }
    } catch (error) {
      console.error('Error checking for meal time changes:', error);
    }
  };

  // Format how long ago the settings were updated
  const getTimeAgo = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    
    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins === 1 ? '' : 's'} ago`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
    
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
  };

  // Get current time in Thailand (UTC+7)
  const getThaiTime = () => {
    const now = new Date();
    
    // Get the UTC time in milliseconds
    const utcTime = now.getTime() + (now.getTimezoneOffset() * 60000);
    
    // Add 7 hours for Thailand timezone (UTC+7)
    const thaiTime = new Date(utcTime + (7 * 60 * 60 * 1000));
    
    return thaiTime;
  };

  // Memoize the status update function to prevent infinite loops
  const updateStatus = useCallback(() => {
    if (!settings) return;

    const thaiTime = getThaiTime();
    setCurrentTime(thaiTime);
    
    // Check if meal times have passed (using Thai time)
    const hours = thaiTime.getHours();
    const minutes = thaiTime.getMinutes();
    
    const newStatus = {
      breakfast: (hours >= settings.breakfastStart && hours < settings.breakfastEnd),
      lunch: (hours >= settings.lunchStart && hours < settings.lunchEnd),
      dinner: (hours >= settings.dinnerStart && hours < settings.dinnerEnd),
    };
    
    setMealTimeStatus(newStatus);
    
    // Notify parent component if callback is provided
    if (onStatusChange) {
      onStatusChange(newStatus);
    }
  }, [onStatusChange, settings]);

  useEffect(() => {
    if (!settings) return;

    // Update immediately
    updateStatus();
    
    // Then update every second
    const timer = setInterval(updateStatus, 1000);

    return () => clearInterval(timer);
  }, [updateStatus, settings]);

  // Format time to show hours, minutes, seconds and AM/PM
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });
  };

  // Format hour in 12-hour format with AM/PM
  const formatHour = (hour: number) => {
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:00 ${ampm}`;
  };

  if (isLoading) {
    return (
      <div className="bg-card p-4 rounded-lg vintage-border">
        <div className="text-center">
          <h2 className="text-xl font-bold mb-2 vintage-text">Thai Time</h2>
          <div className="text-2xl font-mono">Loading...</div>
        </div>
      </div>
    );
  }

  if (!settings) {
    return null;
  }

  return (
    <div className="bg-card p-4 rounded-lg vintage-border">
      <div className="text-center">
        <h2 className="text-xl font-bold mb-2 vintage-text">Thai Time</h2>
        {currentTime ? (
          <>
            <div className="text-2xl font-mono">
              {formatTime(currentTime)}
            </div>
            <div className="text-xs text-gray-400 mb-2">
              (UTC+7 Bangkok, Thailand)
            </div>
          </>
        ) : (
          <div className="text-2xl font-mono">Loading...</div>
        )}
        <div className="mt-2 text-sm">
          <div className="flex justify-between items-center mb-1">
            <span>Breakfast:</span>
            <span className={mealTimeStatus.breakfast ? "text-primary" : "text-gray-500"}>
              {mealTimeStatus.breakfast ? "Available" : "Unavailable"}
            </span>
          </div>
          <div className="text-xs text-gray-400 mb-1">
            {`${formatHour(settings.breakfastStart)} - ${formatHour(settings.breakfastEnd)}`}
          </div>
          
          <div className="flex justify-between items-center mb-1">
            <span>Lunch:</span>
            <span className={mealTimeStatus.lunch ? "text-primary" : "text-gray-500"}>
              {mealTimeStatus.lunch ? "Available" : "Unavailable"}
            </span>
          </div>
          <div className="text-xs text-gray-400 mb-1">
            {`${formatHour(settings.lunchStart)} - ${formatHour(settings.lunchEnd)}`}
          </div>
          
          <div className="flex justify-between items-center">
            <span>Dinner:</span>
            <span className={mealTimeStatus.dinner ? "text-primary" : "text-gray-500"}>
              {mealTimeStatus.dinner ? "Available" : "Unavailable"}
            </span>
          </div>
          <div className="text-xs text-gray-400">
            {`${formatHour(settings.dinnerStart)} - ${formatHour(settings.dinnerEnd)}`}
          </div>
        </div>
      </div>
    </div>
  );
} 