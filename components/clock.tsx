'use client';

import { useState, useEffect, useCallback } from 'react';

export type MealTimeStatus = {
  breakfast: boolean;
  lunch: boolean;
  dinner: boolean;
};

interface ClockProps {
  onStatusChange?: (status: MealTimeStatus) => void;
}

export default function Clock({ onStatusChange }: ClockProps = {}) {
  const [currentTime, setCurrentTime] = useState<Date | null>(null);
  const [mealTimeStatus, setMealTimeStatus] = useState<MealTimeStatus>({
    breakfast: true,
    lunch: true,
    dinner: true,
  });

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
    const thaiTime = getThaiTime();
    setCurrentTime(thaiTime);
    
    // Check if meal times have passed (using Thai time)
    // Breakfast: 5:00 AM - 10:00 AM
    // Lunch: 11:00 AM - 3:00 PM
    // Dinner: 5:00 PM - 10:00 PM
    const hours = thaiTime.getHours();
    
    const newStatus = {
      breakfast: hours >= 5 && hours < 10,
      lunch: hours >= 11 && hours < 15,
      dinner: hours >= 17 && hours < 22,
    };
    
    setMealTimeStatus(newStatus);
    
    // Notify parent component if callback is provided
    if (onStatusChange) {
      onStatusChange(newStatus);
    }
  }, [onStatusChange]);

  useEffect(() => {
    // Update immediately
    updateStatus();
    
    // Then update every second
    const timer = setInterval(updateStatus, 1000);

    return () => clearInterval(timer);
  }, [updateStatus]);

  // Format time to show hours, minutes, seconds and AM/PM
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });
  };

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
          <div className="flex justify-between items-center mb-1">
            <span>Lunch:</span>
            <span className={mealTimeStatus.lunch ? "text-primary" : "text-gray-500"}>
              {mealTimeStatus.lunch ? "Available" : "Unavailable"}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span>Dinner:</span>
            <span className={mealTimeStatus.dinner ? "text-primary" : "text-gray-500"}>
              {mealTimeStatus.dinner ? "Available" : "Unavailable"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
} 