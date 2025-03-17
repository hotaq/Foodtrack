"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { signOut } from "next-auth/react";
import { useEdgeStore } from "@/lib/edgestore";
import Clock, { MealTimeStatus } from "@/components/clock";
import { 
  MotionDiv, 
  MotionButton, 
  fadeIn, 
  slideUp, 
  staggerContainer, 
  scaleIn 
} from "@/components/ui/motion";
import { motion, AnimatePresence } from "framer-motion";
import { 
  RadarChart, 
  PolarGrid, 
  PolarAngleAxis, 
  PolarRadiusAxis, 
  Radar, 
  ResponsiveContainer,
  Tooltip
} from 'recharts';

// Define types based on Prisma schema
type MealType = "BREAKFAST" | "LUNCH" | "DINNER";

interface Meal {
  id: string;
  type: MealType;
  imageUrl: string;
  imageKey: string;
  date: Date;
  createdAt: Date;
  updatedAt: Date;
  userId: string;
  foodName?: string;
}

interface Streak {
  id: string;
  currentStreak: number;
  longestStreak: number;
  lastMealDate: Date | null;
  userId: string;
}

interface User {
  id: string;
  name: string | null;
  email: string;
  emailVerified: Date | null;
  password: string | null;
  image: string | null;
  role: "USER" | "ADMIN";
  createdAt: Date;
  updatedAt: Date;
}

interface DashboardClientProps {
  user: User & { streak: Streak | null };
  streak: Streak | null;
  todaysMeals: {
    BREAKFAST: Meal | undefined;
    LUNCH: Meal | undefined;
    DINNER: Meal | undefined;
  };
}

export default function DashboardClient({ user, streak, todaysMeals }: DashboardClientProps) {
  const [isUploading, setIsUploading] = useState<MealType | null>(null);
  const [successMessage, setSuccessMessage] = useState("");
  const [mealTimeStatus, setMealTimeStatus] = useState<MealTimeStatus>({
    breakfast: true,
    lunch: true,
    dinner: true,
  });
  const [showFoodVerificationModal, setShowFoodVerificationModal] = useState(false);
  const [pendingUpload, setPendingUpload] = useState<{
    mealType: MealType;
    imageUrl: string;
    imageKey: string;
    foodName: string;
  } | null>(null);
  const [edgeStoreError, setEdgeStoreError] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // Use optional chaining to handle potential undefined edgestore
  const edgeStoreClient = useEdgeStore();

  // Update meal time status from the Clock component
  const handleMealTimeStatusChange = useCallback((status: MealTimeStatus) => {
    setMealTimeStatus(status);
  }, []);

  // Check if meal time is available
  const isMealTimeAvailable = (mealType: MealType): boolean => {
    // Admin can upload anytime
    if (user.role === "ADMIN") {
      return true;
    }
    
    const mealTypeKey = mealType.toLowerCase() as keyof MealTimeStatus;
    return mealTimeStatus[mealTypeKey];
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>, mealType: MealType) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check if meal time is available (skip for admins)
    const mealTypeKey = mealType.toLowerCase() as keyof MealTimeStatus;
    if (!mealTimeStatus[mealTypeKey] && user.role !== "ADMIN") {
      alert(`Sorry, ${mealType.toLowerCase()} time has passed. You can't upload an image for this meal now.`);
      return;
    }

    try {
      setIsUploading(mealType);
      
      // Check if edgestore client is available
      if (!edgeStoreClient || !edgeStoreClient.edgestore) {
        throw new Error("EdgeStore client is not available. Please try again later.");
      }
      
      // Upload to EdgeStore
      const res = await edgeStoreClient.edgestore.mealImages.upload({
        file,
      });

      // Generate a unique key for the image
      const imageKey = `meal-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

      // Check if the image contains food
      const verificationResult = await verifyFoodImage(res.url);
      
      if (!verificationResult.isFood) {
        setPendingUpload({
          mealType,
          imageUrl: res.url,
          imageKey: imageKey,
          foodName: "",
        });
        setShowFoodVerificationModal(true);
        setIsUploading(null);
        return;
      }
      
      // If it's food, upload directly
      await handleMealUpload(
        mealType, 
        res.url, 
        imageKey, 
        true,
        ""  // Empty food name by default
      );
    } catch (error) {
      console.error("Error uploading file:", error);
      setEdgeStoreError(error instanceof Error ? error.message : "Failed to upload file");
      setIsUploading(null);
    }
  };

  const verifyFoodImage = async (imageUrl: string) => {
    try {
      const response = await fetch("/api/food-verification", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ imageUrl }),
      });

      if (!response.ok) {
        console.error("Food verification failed");
        return { isFood: true }; // Default to true if verification fails
      }

      return await response.json();
    } catch (error) {
      console.error("Error verifying food image:", error);
      return { isFood: true }; // Default to true if verification fails
    }
  };

  const handleMealUpload = async (
    mealType: MealType, 
    imageUrl: string, 
    imageKey: string,
    isFood: boolean = true,
    foodName: string = ""
  ) => {
    try {
      const response = await fetch("/api/meals", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type: mealType,
          imageUrl,
          imageKey,
          isFood,
          foodName,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save meal");
      }

      setSuccessMessage(`${mealType.charAt(0) + mealType.slice(1).toLowerCase()} uploaded successfully!`);
      
      // Refresh the page after 2 seconds to show the new meal
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (error) {
      console.error("Error saving meal:", error);
      setIsUploading(null);
    }
  };

  const handleConfirmUpload = async () => {
    if (!pendingUpload) return;
    
    try {
      await handleMealUpload(
        pendingUpload.mealType,
        pendingUpload.imageUrl,
        pendingUpload.imageKey,
        false,
        pendingUpload.foodName
      );
    } catch (error) {
      console.error("Error confirming upload:", error);
      setIsUploading(null);
    } finally {
      setShowFoodVerificationModal(false);
      setPendingUpload(null);
    }
  };

  const handleCancelUpload = () => {
    setShowFoodVerificationModal(false);
    setPendingUpload(null);
    setIsUploading(null);
  };

  // Update the food name in the pending upload
  const handleFoodNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (pendingUpload) {
      setPendingUpload({
        ...pendingUpload,
        foodName: e.target.value
      });
    }
  };

  const renderErrorMessage = () => {
    if (!edgeStoreError) return null;
    
    return (
      <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/70">
        <div className="bg-card p-6 rounded-lg max-w-md w-full">
          <h3 className="text-xl font-bold mb-4 text-red-500">Upload Error</h3>
          <p className="mb-6">{edgeStoreError}</p>
          <div className="flex justify-end">
            <button
              onClick={() => setEdgeStoreError(null)}
              className="px-4 py-2 bg-primary text-white rounded-md"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-primary/20 py-6 backdrop-blur-sm bg-background/80 sticky top-0 z-10">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center">
            <MotionDiv
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
            >
              <h1 className="text-2xl font-bold glow-text text-primary">Meal Tracker</h1>
            </MotionDiv>
            
            <button 
              className="md:hidden text-white p-2"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? (
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="3" y1="12" x2="21" y2="12"></line>
                  <line x1="3" y1="6" x2="21" y2="6"></line>
                  <line x1="3" y1="18" x2="21" y2="18"></line>
                </svg>
              )}
            </button>
            
            <MotionDiv
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              className="hidden md:flex items-center space-x-4"
            >
              <span className="text-sm text-muted-foreground">
                Welcome, <span className="text-foreground">{user.name}</span>
                {user.role === "ADMIN" && (
                  <span className="ml-2 px-2 py-0.5 text-xs bg-primary/20 text-primary rounded-full">
                    Admin Mode
                  </span>
                )}
              </span>
              {user.role === "ADMIN" && (
                <Link href="/admin">
                  <MotionButton 
                    className="vintage-button bg-primary text-sm py-2 px-4"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Admin Dashboard
                  </MotionButton>
                </Link>
              )}
              <Link href="/leaderboard">
                <MotionButton 
                  className="vintage-button bg-primary text-sm py-2 px-4"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Leaderboard
                </MotionButton>
              </Link>
              <Link href="/gallery">
                <MotionButton 
                  className="vintage-button bg-primary text-sm py-2 px-4"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  View Gallery
                </MotionButton>
              </Link>
              <Link href="/analytics">
                <MotionButton 
                  className="vintage-button bg-primary text-sm py-2 px-4"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Analytics
                </MotionButton>
              </Link>
              <Link href="/favorites">
                <MotionButton 
                  className="vintage-button bg-primary text-sm py-2 px-4"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Favorites
                </MotionButton>
              </Link>
              <Link href="/settings">
                <MotionButton 
                  className="vintage-button bg-primary text-sm py-2 px-4"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Settings
                </MotionButton>
              </Link>
              <MotionButton
                onClick={() => {
                  signOut({ redirect: true, callbackUrl: '/' });
                }}
                className="vintage-button bg-secondary text-sm py-2 px-4"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Sign Out
              </MotionButton>
            </MotionDiv>
          </div>
          
          <AnimatePresence>
            {mobileMenuOpen && (
              <MotionDiv
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                className="md:hidden mt-4 flex flex-col space-y-3 pb-3"
              >
                <span className="text-sm text-muted-foreground">
                  Welcome, <span className="text-foreground">{user.name}</span>
                  {user.role === "ADMIN" && (
                    <span className="ml-2 px-2 py-0.5 text-xs bg-primary/20 text-primary rounded-full">
                      Admin Mode
                    </span>
                  )}
                </span>
                {user.role === "ADMIN" && (
                  <Link href="/admin" className="w-full">
                    <MotionButton 
                      className="vintage-button bg-primary text-sm py-2 px-4 w-full"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      Admin Dashboard
                    </MotionButton>
                  </Link>
                )}
                <Link href="/leaderboard" className="w-full">
                  <MotionButton 
                    className="vintage-button bg-primary text-sm py-2 px-4 w-full"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Leaderboard
                  </MotionButton>
                </Link>
                <Link href="/gallery" className="w-full">
                  <MotionButton 
                    className="vintage-button bg-primary text-sm py-2 px-4 w-full"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    View Gallery
                  </MotionButton>
                </Link>
                <Link href="/analytics" className="w-full">
                  <MotionButton 
                    className="vintage-button bg-primary text-sm py-2 px-4 w-full"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Analytics
                  </MotionButton>
                </Link>
                <Link href="/favorites" className="w-full">
                  <MotionButton 
                    className="vintage-button bg-primary text-sm py-2 px-4 w-full"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Favorites
                  </MotionButton>
                </Link>
                <Link href="/settings" className="w-full">
                  <MotionButton 
                    className="vintage-button bg-primary text-sm py-2 px-4 w-full"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Settings
                  </MotionButton>
                </Link>
                <MotionButton
                  onClick={() => {
                    signOut({ redirect: true, callbackUrl: '/' });
                  }}
                  className="vintage-button bg-secondary text-sm py-2 px-4 w-full"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Sign Out
                </MotionButton>
              </MotionDiv>
            )}
          </AnimatePresence>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {successMessage && (
          <MotionDiv
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-4 left-1/2 transform -translate-x-1/2 bg-secondary/20 text-secondary px-6 py-3 rounded-full backdrop-blur-md shadow-lg z-50"
          >
            {successMessage}
          </MotionDiv>
        )}

        <MotionDiv
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="glass-card p-4 rounded-lg mb-8 flex items-start gap-3"
        >
          <div className="text-amber-500 mt-0.5 flex-shrink-0">⚠️</div>
          <div>
            <h3 className="font-medium text-amber-500">Privacy Notice</h3>
            <p className="text-sm text-muted-foreground">
              Your meal images are stored in a shared storage system. For maximum privacy, avoid uploading sensitive content.
            </p>
          </div>
        </MotionDiv>

        <MotionDiv
          initial="hidden"
          animate="visible"
          variants={staggerContainer}
          className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12"
        >
          <MotionDiv variants={scaleIn} className="tech-card rounded-lg neon-border">
            <h2 className="text-xl font-bold mb-4 vintage-text">Current Streak</h2>
            <div className="flex items-center justify-center">
              <div className="text-5xl font-bold text-primary">{streak?.currentStreak || 0}</div>
              <div className="text-xl ml-2 text-muted-foreground">days</div>
            </div>
          </MotionDiv>
          
          <MotionDiv variants={scaleIn} className="tech-card rounded-lg neon-border">
            <h2 className="text-xl font-bold mb-4 vintage-text">Longest Streak</h2>
            <div className="flex items-center justify-center">
              <div className="text-5xl font-bold text-primary">{streak?.longestStreak || 0}</div>
              <div className="text-xl ml-2 text-muted-foreground">days</div>
            </div>
          </MotionDiv>
          
          <MotionDiv variants={scaleIn} className="tech-card rounded-lg neon-border md:col-span-2">
            <h2 className="text-xl font-bold mb-4 vintage-text">Meal Balance</h2>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart 
                  outerRadius="80%" 
                  data={[
                    { name: 'Breakfast', value: todaysMeals.BREAKFAST ? 1 : 0, fullMark: 1 },
                    { name: 'Lunch', value: todaysMeals.LUNCH ? 1 : 0, fullMark: 1 },
                    { name: 'Dinner', value: todaysMeals.DINNER ? 1 : 0, fullMark: 1 },
                  ]}
                >
                  <PolarGrid />
                  <PolarAngleAxis dataKey="name" />
                  <PolarRadiusAxis domain={[0, 1]} tick={false} axisLine={false} />
                  <Tooltip 
                    formatter={(value) => [value ? 'Completed' : 'Not Completed', 'Status']}
                    contentStyle={{ 
                      backgroundColor: '#1e1e1e', 
                      border: '1px solid #333',
                      color: '#fff'
                    }}
                  />
                  <Radar 
                    name="Meals" 
                    dataKey="value" 
                    stroke="#8884d8" 
                    fill="#8884d8" 
                    fillOpacity={0.6} 
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </MotionDiv>
          
          <MotionDiv variants={scaleIn}>
            <Clock onStatusChange={handleMealTimeStatusChange} />
          </MotionDiv>
        </MotionDiv>

        <MotionDiv
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <h2 className="text-2xl font-bold mb-8 vintage-text text-center">Today's Meals</h2>
        </MotionDiv>
        
        <MotionDiv
          initial="hidden"
          animate="visible"
          variants={staggerContainer}
          className="grid grid-cols-1 md:grid-cols-3 gap-8"
        >
          {/* Breakfast */}
          <MotionDiv variants={scaleIn} className="gradient-border overflow-hidden">
            <h3 className="text-xl font-bold p-4 vintage-text bg-card">Breakfast</h3>
            {todaysMeals.BREAKFAST ? (
              <div className="relative h-64 w-full overflow-hidden">
                <Image
                  src={todaysMeals.BREAKFAST.imageUrl}
                  alt="Breakfast"
                  fill
                  className="object-cover"
                />
                {todaysMeals.BREAKFAST.foodName && (
                  <div className="absolute bottom-0 left-0 right-0 bg-black/60 backdrop-blur-sm p-2 text-center">
                    <p className="text-secondary text-sm">{todaysMeals.BREAKFAST.foodName}</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="h-64 flex flex-col items-center justify-center bg-muted p-4">
                {isUploading === "BREAKFAST" ? (
                  <div className="text-center">
                    <div className="mb-4 text-muted-foreground">Uploading...</div>
                    <div className="w-8 h-8 border-t-2 border-primary rounded-full animate-spin mx-auto"></div>
                  </div>
                ) : (
                  <>
                    <p className="text-center mb-4 text-muted-foreground">No breakfast photo uploaded yet</p>
                    {isMealTimeAvailable("BREAKFAST") ? (
                      <label className="vintage-button bg-primary cursor-pointer px-4 py-2">
                        Upload Breakfast
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => handleFileChange(e, "BREAKFAST")}
                        />
                      </label>
                    ) : (
                      <p className="text-destructive text-sm">Breakfast time has passed</p>
                    )}
                    {user.role === "ADMIN" && !mealTimeStatus.breakfast && (
                      <p className="text-primary text-xs mt-2">Admin can upload anytime</p>
                    )}
                  </>
                )}
              </div>
            )}
          </MotionDiv>
          
          {/* Lunch */}
          <MotionDiv variants={scaleIn} className="gradient-border overflow-hidden">
            <h3 className="text-xl font-bold p-4 vintage-text bg-card">Lunch</h3>
            {todaysMeals.LUNCH ? (
              <div className="relative h-64 w-full overflow-hidden">
                <Image
                  src={todaysMeals.LUNCH.imageUrl}
                  alt="Lunch"
                  fill
                  className="object-cover"
                />
                {todaysMeals.LUNCH.foodName && (
                  <div className="absolute bottom-0 left-0 right-0 bg-black/60 backdrop-blur-sm p-2 text-center">
                    <p className="text-secondary text-sm">{todaysMeals.LUNCH.foodName}</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="h-64 flex flex-col items-center justify-center bg-muted p-4">
                {isUploading === "LUNCH" ? (
                  <div className="text-center">
                    <div className="mb-4 text-muted-foreground">Uploading...</div>
                    <div className="w-8 h-8 border-t-2 border-primary rounded-full animate-spin mx-auto"></div>
                  </div>
                ) : (
                  <>
                    <p className="text-center mb-4 text-muted-foreground">No lunch photo uploaded yet</p>
                    {isMealTimeAvailable("LUNCH") ? (
                      <label className="vintage-button bg-primary cursor-pointer px-4 py-2">
                        Upload Lunch
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => handleFileChange(e, "LUNCH")}
                        />
                      </label>
                    ) : (
                      <p className="text-destructive text-sm">Lunch time has passed</p>
                    )}
                    {user.role === "ADMIN" && !mealTimeStatus.lunch && (
                      <p className="text-primary text-xs mt-2">Admin can upload anytime</p>
                    )}
                  </>
                )}
              </div>
            )}
          </MotionDiv>
          
          {/* Dinner */}
          <MotionDiv variants={scaleIn} className="gradient-border overflow-hidden">
            <h3 className="text-xl font-bold p-4 vintage-text bg-card">Dinner</h3>
            {todaysMeals.DINNER ? (
              <div className="relative h-64 w-full overflow-hidden">
                <Image
                  src={todaysMeals.DINNER.imageUrl}
                  alt="Dinner"
                  fill
                  className="object-cover"
                />
                {todaysMeals.DINNER.foodName && (
                  <div className="absolute bottom-0 left-0 right-0 bg-black/60 backdrop-blur-sm p-2 text-center">
                    <p className="text-secondary text-sm">{todaysMeals.DINNER.foodName}</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="h-64 flex flex-col items-center justify-center bg-muted p-4">
                {isUploading === "DINNER" ? (
                  <div className="text-center">
                    <div className="mb-4 text-muted-foreground">Uploading...</div>
                    <div className="w-8 h-8 border-t-2 border-primary rounded-full animate-spin mx-auto"></div>
                  </div>
                ) : (
                  <>
                    <p className="text-center mb-4 text-muted-foreground">No dinner photo uploaded yet</p>
                    {isMealTimeAvailable("DINNER") ? (
                      <label className="vintage-button bg-primary cursor-pointer px-4 py-2">
                        Upload Dinner
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => handleFileChange(e, "DINNER")}
                        />
                      </label>
                    ) : (
                      <p className="text-destructive text-sm">Dinner time has passed</p>
                    )}
                    {user.role === "ADMIN" && !mealTimeStatus.dinner && (
                      <p className="text-primary text-xs mt-2">Admin can upload anytime</p>
                    )}
                  </>
                )}
              </div>
            )}
          </MotionDiv>
        </MotionDiv>

        {/* Food Verification Modal */}
        <AnimatePresence>
          {showFoodVerificationModal && pendingUpload && (
            <motion.div 
              className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <motion.div 
                className="relative max-w-md w-full mx-auto"
                initial={{ y: 50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 50, opacity: 0 }}
                transition={{ duration: 0.4, delay: 0.1 }}
              >
                <div className="tech-card neon-border p-6 m-4">
                  <div className="flex items-center mb-4">
                    <motion.div 
                      className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center mr-3"
                      animate={{ scale: [1, 1.1, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-amber-500">
                        <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"></path>
                        <path d="M12 9v4"></path>
                        <path d="M12 17h.01"></path>
                      </svg>
                    </motion.div>
                    <h3 className="text-xl font-bold vintage-text">Food Verification</h3>
                  </div>
                  
                  <div className="flex flex-col md:flex-row md:space-x-4 mb-6">
                    <div className="relative w-full md:w-32 h-32 rounded-lg overflow-hidden mb-4 md:mb-0 shadow-lg">
                      {pendingUpload.imageUrl && (
                        <Image
                          src={pendingUpload.imageUrl}
                          alt="Uploaded image"
                          fill
                          className="object-cover"
                        />
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                      <div className="absolute bottom-2 right-2 bg-red-500/90 text-white text-xs px-2 py-1 rounded-full">
                        Not Food
                      </div>
                    </div>
                    
                    <div className="flex-1">
                      <h4 className="text-lg font-semibold text-primary mb-2">Verification Failed</h4>
                      <p className="text-muted-foreground mb-3">
                        Our AI couldn't detect food in this image. Do you still want to upload it?
                      </p>
                      
                      <div className="mb-3">
                        <label className="block text-sm font-medium mb-1">Food Name (optional)</label>
                        <input
                          type="text"
                          value={pendingUpload.foodName}
                          onChange={handleFoodNameChange}
                          placeholder="Enter food name"
                          className="w-full p-2 bg-background border border-input rounded-sm focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                      </div>
                      
                      <div className="bg-amber-500/10 border border-amber-500/20 rounded-md p-3 mb-3">
                        <p className="text-sm text-amber-400">
                          <span className="font-semibold">Note:</span> Uploading non-food images may affect your streak calculation and could be flagged by moderators.
                        </p>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Meal Type: <span className="text-foreground">{pendingUpload.mealType.charAt(0) + pendingUpload.mealType.slice(1).toLowerCase()}</span>
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex justify-end space-x-3">
                    <motion.button 
                      onClick={handleCancelUpload}
                      className="px-4 py-2 rounded-md bg-muted hover:bg-muted/80 transition-colors"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      Cancel
                    </motion.button>
                    <motion.button 
                      onClick={handleConfirmUpload}
                      className="vintage-button bg-primary px-4 py-2"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      Upload Anyway
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
      {renderErrorMessage()}
    </div>
  );
} 