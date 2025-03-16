"use client";

import { useState } from "react";
import Link from "next/link";
import { signOut } from "next-auth/react";

// Define types
type MealTypeStats = {
  BREAKFAST: number;
  LUNCH: number;
  DINNER: number;
};

type User = {
  id: string;
  name: string | null;
  email: string;
  role: "USER" | "ADMIN";
  streak: {
    currentStreak: number;
    longestStreak: number;
  } | null;
};

interface AdminDashboardClientProps {
  users: User[];
  totalMeals: number;
  todaysMeals: number;
  mealTypeStats: MealTypeStats;
}

export default function AdminDashboardClient({ 
  users, 
  totalMeals, 
  todaysMeals, 
  mealTypeStats 
}: AdminDashboardClientProps) {
  const [searchTerm, setSearchTerm] = useState("");
  
  // Filter users based on search term
  const filteredUsers = users.filter(user => 
    user.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-primary py-4">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold vintage-text text-primary">Meal Tracker Admin</h1>
            <div className="flex items-center space-x-4">
              <Link href="/dashboard" className="text-sm text-gray-300 hover:text-primary">
                User Dashboard
              </Link>
              <button
                onClick={() => signOut({ callbackUrl: "/" })}
                className="vintage-button bg-secondary text-sm py-2 px-4"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
          <div className="bg-card p-6 rounded-lg vintage-border">
            <h2 className="text-xl font-bold mb-2 vintage-text">Total Users</h2>
            <div className="text-4xl font-bold text-primary">{users.length}</div>
          </div>
          
          <div className="bg-card p-6 rounded-lg vintage-border">
            <h2 className="text-xl font-bold mb-2 vintage-text">Total Meals</h2>
            <div className="text-4xl font-bold text-primary">{totalMeals}</div>
          </div>
          
          <div className="bg-card p-6 rounded-lg vintage-border">
            <h2 className="text-xl font-bold mb-2 vintage-text">Today's Meals</h2>
            <div className="text-4xl font-bold text-primary">{todaysMeals}</div>
          </div>
          
          <div className="bg-card p-6 rounded-lg vintage-border">
            <h2 className="text-xl font-bold mb-2 vintage-text">Meal Types</h2>
            <div className="flex justify-between mt-2">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">{mealTypeStats.BREAKFAST}</div>
                <div className="text-xs text-gray-300">Breakfast</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">{mealTypeStats.LUNCH}</div>
                <div className="text-xs text-gray-300">Lunch</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">{mealTypeStats.DINNER}</div>
                <div className="text-xs text-gray-300">Dinner</div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="bg-card p-6 rounded-lg vintage-border mb-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold vintage-text">User Leaderboard</h2>
            <div className="relative">
              <input
                type="text"
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="px-4 py-2 bg-background border border-input rounded-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-primary">
                  <th className="text-left py-3 px-4 vintage-text">Rank</th>
                  <th className="text-left py-3 px-4 vintage-text">Name</th>
                  <th className="text-left py-3 px-4 vintage-text">Email</th>
                  <th className="text-left py-3 px-4 vintage-text">Current Streak</th>
                  <th className="text-left py-3 px-4 vintage-text">Longest Streak</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user, index) => (
                  <tr key={user.id} className="border-b border-muted hover:bg-muted/50">
                    <td className="py-3 px-4">{index + 1}</td>
                    <td className="py-3 px-4">{user.name || "N/A"}</td>
                    <td className="py-3 px-4">{user.email}</td>
                    <td className="py-3 px-4">{user.streak?.currentStreak || 0}</td>
                    <td className="py-3 px-4">{user.streak?.longestStreak || 0}</td>
                  </tr>
                ))}
                {filteredUsers.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-4 text-center text-gray-300">
                      No users found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
} 