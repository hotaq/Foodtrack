'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { signOut } from 'next-auth/react';
import AreaChartConnectNulls from '@/components/AreaChartConnectNulls';
import { 
  Users, 
  Utensils, 
  Award, 
  Coffee, 
  UtensilsCrossed, 
  Wine, 
  Search,
  ChevronDown,
  ChevronUp,
  Ban,
  Key,
  BarChart,
  Trash2,
  CheckCircle,
  TrendingUp,
  Activity,
  Clock
} from 'lucide-react';
import { 
  BarChart as RechartsBarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ComposedChart,
  Line,
  Area,
  LabelList
} from 'recharts';
import { toast } from 'react-hot-toast';
import React from 'react';

interface User {
  id: string;
  name: string | null;
  email: string;
  role: string;
  createdAt: Date;
  streak: {
    currentStreak: number;
    longestStreak: number;
  } | null;
  meals: any[];
  status?: 'ACTIVE' | 'BANNED';
  isBanned?: boolean;
}

interface Streak {
  id: string;
  currentStreak: number;
  longestStreak: number;
  userId: string;
  user: {
    id: string;
    name: string | null;
    email: string;
  };
}

interface MealTypeCount {
  type: string;
  _count: {
    id: number;
  };
}

interface AdminDashboardProps {
  users: User[];
  mealCount: number;
  topStreaks: Streak[];
  mealsByType: MealTypeCount[];
}

export default function AdminDashboard({ 
  users: initialUsers, 
  mealCount, 
  topStreaks, 
  mealsByType 
}: AdminDashboardProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<string>('createdAt');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [expandedUser, setExpandedUser] = useState<string | null>(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showBanModal, setShowBanModal] = useState(false);
  const [showUnbanModal, setShowUnbanModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showStreakModal, setShowStreakModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [banReason, setBanReason] = useState('');
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const [currentStreak, setCurrentStreak] = useState(0);
  const [longestStreak, setLongestStreak] = useState(0);
  const [users, setUsers] = useState<User[]>(initialUsers);
  const [userGrowthData, setUserGrowthData] = useState<{name: string, value: number}[]>([]);
  const [mealActivityData, setMealActivityData] = useState<{name: string, value: number | null}[]>([]);
  const [isLoadingGrowthData, setIsLoadingGrowthData] = useState(true);
  const [isLoadingActivityData, setIsLoadingActivityData] = useState(true);

  // Meal Time Settings Management
  const [showMealTimeSettingsModal, setShowMealTimeSettingsModal] = useState(false);
  const [mealTimeSettings, setMealTimeSettings] = useState({
    breakfastStart: 6,
    breakfastEnd: 9,
    lunchStart: 12,
    lunchEnd: 15,
    dinnerStart: 16,
    dinnerEnd: 20
  });
  const [isLoadingSettings, setIsLoadingSettings] = useState(false);

  // Filter users based on search term
  const filteredUsers = users.filter(user => 
    user.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Sort users based on sort field and direction
  const sortedUsers = [...filteredUsers].sort((a, b) => {
    if (sortField === 'createdAt') {
      return sortDirection === 'asc' 
        ? new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        : new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    } else if (sortField === 'streak') {
      const aStreak = a.streak?.currentStreak || 0;
      const bStreak = b.streak?.currentStreak || 0;
      return sortDirection === 'asc' ? aStreak - bStreak : bStreak - aStreak;
    } else if (sortField === 'name') {
      const aName = a.name || '';
      const bName = b.name || '';
      return sortDirection === 'asc' 
        ? aName.localeCompare(bName)
        : bName.localeCompare(aName);
    }
    return 0;
  });

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const toggleUserExpand = (userId: string) => {
    if (expandedUser === userId) {
      setExpandedUser(null);
    } else {
      setExpandedUser(userId);
    }
  };

  // Get meal type counts
  const breakfastCount = mealsByType.find(m => m.type === "BREAKFAST")?._count.id || 0;
  const lunchCount = mealsByType.find(m => m.type === "LUNCH")?._count.id || 0;
  const dinnerCount = mealsByType.find(m => m.type === "DINNER")?._count.id || 0;

  // Prepare data for the chart
  const mealChartData = [
    { name: 'Breakfast', count: breakfastCount },
    { name: 'Lunch', count: lunchCount },
    { name: 'Dinner', count: dinnerCount },
  ];

  // Function to handle password change
  const handlePasswordChange = async () => {
    if (!selectedUser || !newPassword) return;
    
    try {
      const response = await fetch(`/api/admin/users/${selectedUser.id}/password`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password: newPassword }),
      });
      
      if (response.ok) {
        alert('Password changed successfully');
        setShowPasswordModal(false);
        setNewPassword('');
      } else {
        alert('Failed to change password');
      }
    } catch (error) {
      console.error('Error changing password:', error);
      alert('An error occurred while changing the password');
    }
  };

  // Function to handle user ban
  const handleBanUser = async () => {
    if (!selectedUser) return;
    
    try {
      const response = await fetch(`/api/admin/users/${selectedUser.id}/ban`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reason: banReason }),
      });
      
      if (response.ok) {
        alert('User banned successfully');
        setShowBanModal(false);
        setBanReason('');
        
        // Update the user's status in the UI
        setUsers(prevUsers => 
          prevUsers.map(user => 
            user.id === selectedUser.id 
              ? { ...user, status: 'BANNED', isBanned: true } 
              : user
          )
        );
      } else {
        alert('Failed to ban user');
      }
    } catch (error) {
      console.error('Error banning user:', error);
      alert('An error occurred while banning the user');
    }
  };

  const handleUpdateStreak = async () => {
    if (!selectedUser) return;

    try {
      const response = await fetch(`/api/admin/users/${selectedUser.id}/streak`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          currentStreak,
          longestStreak,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update streak");
      }

      const data = await response.json();
      toast.success("User streak updated successfully");

      // Update the user in the UI
      setUsers((prevUsers) =>
        prevUsers.map((user) =>
          user.id === selectedUser.id
            ? {
                ...user,
                streak: {
                  ...user.streak,
                  currentStreak,
                  longestStreak,
                },
              }
            : user
        )
      );

      setShowStreakModal(false);
    } catch (error) {
      console.error("Error updating streak:", error);
      toast.error("Failed to update streak");
    }
  };

  // Fetch user growth data
  useEffect(() => {
    const fetchUserGrowthData = async () => {
      setIsLoadingGrowthData(true);
      try {
        const response = await fetch('/api/admin/user-growth');
        if (!response.ok) {
          throw new Error('Failed to fetch user growth data');
        }
        const data = await response.json();
        setUserGrowthData(data);
      } catch (error) {
        console.error('Error fetching user growth data:', error);
        // Fallback to sample data if API fails
        setUserGrowthData(generateSampleGrowthData());
      } finally {
        setIsLoadingGrowthData(false);
      }
    };

    fetchUserGrowthData();
  }, []);

  // Fetch meal activity data
  useEffect(() => {
    const fetchMealActivityData = async () => {
      setIsLoadingActivityData(true);
      try {
        const response = await fetch('/api/admin/meal-activity');
        if (!response.ok) {
          throw new Error('Failed to fetch meal activity data');
        }
        const data = await response.json();
        setMealActivityData(data);
      } catch (error) {
        console.error('Error fetching meal activity data:', error);
        // Fallback to sample data if API fails
        setMealActivityData(generateSampleActivityData());
      } finally {
        setIsLoadingActivityData(false);
      }
    };

    fetchMealActivityData();
  }, []);

  // Generate sample data as fallback for user growth
  const generateSampleGrowthData = () => {
    const data = [];
    const today = new Date();
    let cumulativeValue = 10; // Start with some base users
    
    for (let i = 29; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      
      // Add 0-3 new users each day
      const newUsers = Math.floor(Math.random() * 4);
      cumulativeValue += newUsers;
      
      data.push({
        name: `${date.getMonth() + 1}/${date.getDate()}`,
        value: cumulativeValue
      });
    }
    
    return data;
  };

  // Generate sample data as fallback for meal activity
  const generateSampleActivityData = () => {
    const data = [];
    const today = new Date();
    
    for (let i = 29; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      
      // Create some null values to demonstrate connect nulls feature
      let value = null;
      
      // Set some days to null to demonstrate the connect nulls feature
      if (i % 4 !== 3) {
        // Random value between 0-15 for demonstration
        value = Math.floor(Math.random() * 16);
      }
      
      data.push({
        name: `${date.getMonth() + 1}/${date.getDate()}`,
        value: value
      });
    }
    
    return data;
  };

  // Fetch current meal time settings when modal is opened
  useEffect(() => {
    if (showMealTimeSettingsModal) {
      fetchMealTimeSettings();
    }
  }, [showMealTimeSettingsModal]);

  const fetchMealTimeSettings = async () => {
    setIsLoadingSettings(true);
    try {
      const response = await fetch('/api/admin/meal-time-settings');
      if (response.ok) {
        const data = await response.json();
        setMealTimeSettings({
          breakfastStart: data.breakfastStart,
          breakfastEnd: data.breakfastEnd,
          lunchStart: data.lunchStart,
          lunchEnd: data.lunchEnd,
          dinnerStart: data.dinnerStart,
          dinnerEnd: data.dinnerEnd
        });
      }
    } catch (error) {
      console.error('Error fetching meal time settings:', error);
      toast.error('Failed to load meal time settings');
    } finally {
      setIsLoadingSettings(false);
    }
  };

  const handleMealTimeSettingsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setMealTimeSettings(prev => ({
      ...prev,
      [name]: parseInt(value, 10)
    }));
  };

  const handleMealTimeSettingsSubmit = async () => {
    try {
      const response = await fetch('/api/admin/meal-time-settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(mealTimeSettings)
      });

      if (!response.ok) {
        throw new Error('Failed to update meal time settings');
      }

      toast.success(
        <div>
          <p className="font-bold">Meal time settings updated! ⏰</p>
          <p className="text-sm">Users will be notified of these changes.</p>
          <p className="text-sm">New settings:</p>
          <ul className="text-xs list-disc pl-4 mt-1">
            <li>Breakfast: {mealTimeSettings.breakfastStart}:00 - {mealTimeSettings.breakfastEnd}:00</li>
            <li>Lunch: {mealTimeSettings.lunchStart}:00 - {mealTimeSettings.lunchEnd}:00</li>
            <li>Dinner: {mealTimeSettings.dinnerStart}:00 - {mealTimeSettings.dinnerEnd}:00</li>
          </ul>
        </div>,
        { duration: 5000 }
      );
      
      setShowMealTimeSettingsModal(false);
    } catch (error) {
      console.error('Error updating meal time settings:', error);
      toast.error('Failed to update meal time settings');
    }
  };

  const handleResetExpiredStreaks = async () => {
    try {
      const response = await fetch('/api/updateStreaks');
      
      if (!response.ok) {
        throw new Error('Failed to update streaks');
      }
      
      const data = await response.json();
      toast.success(
        <div>
          <p className="font-bold">Streaks updated! 🔄</p>
          <p className="text-sm">{data.resetsPerformed} streak(s) were reset to 0.</p>
          <p className="text-sm">Users who haven't uploaded meals in over 24 hours had their streaks reset.</p>
        </div>,
        { duration: 5000 }
      );
      
      // Reload the page to show updated data
      setTimeout(() => {
        window.location.reload();
      }, 2000);
      
    } catch (error) {
      console.error('Error resetting streaks:', error);
      toast.error('Failed to reset expired streaks');
    }
  };

  // Function to handle user unban
  const handleUnbanUser = async () => {
    if (!selectedUser) return;
    
    try {
      const response = await fetch(`/api/admin/users/${selectedUser.id}/unban`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      if (response.ok) {
        toast.success('User unbanned successfully');
        setShowUnbanModal(false);
        
        // Update the user's status in the UI
        setUsers(prevUsers => 
          prevUsers.map(user => 
            user.id === selectedUser.id 
              ? { ...user, status: 'ACTIVE', isBanned: false } 
              : user
          )
        );
      } else {
        toast.error('Failed to unban user');
      }
    } catch (error) {
      console.error('Error unbanning user:', error);
      toast.error('An error occurred while unbanning the user');
    }
  };

  // Function to handle account deletion
  const handleDeleteAccount = async () => {
    if (!selectedUser) return;
    
    if (deleteConfirmation !== selectedUser.email) {
      toast.error("Email confirmation doesn't match");
      return;
    }
    
    try {
      const response = await fetch(`/api/admin/users/${selectedUser.id}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        toast.success('Account deleted successfully');
        setShowDeleteModal(false);
        setDeleteConfirmation('');
        
        // Remove the user from the UI
        setUsers(prevUsers => prevUsers.filter(user => user.id !== selectedUser.id));
      } else {
        toast.error('Failed to delete account');
      }
    } catch (error) {
      console.error('Error deleting account:', error);
      toast.error('An error occurred while deleting the account');
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-primary py-4">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold vintage-text text-primary">Admin Dashboard</h1>
            <div className="flex items-center space-x-4">
              <Link href="/dashboard" className="vintage-button bg-primary text-sm py-2 px-4">
                My Dashboard
              </Link>
              <button
                onClick={() => {
                  signOut({ redirect: true, callbackUrl: '/' });
                }}
                className="vintage-button bg-secondary text-sm py-2 px-4"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-card p-6 rounded-lg vintage-border">
            <div className="flex items-center">
              <div className="bg-primary/20 p-3 rounded-full mr-4">
                <Users className="text-primary" size={24} />
              </div>
              <div>
                <h3 className="text-sm text-gray-300">Total Users</h3>
                <p className="text-2xl font-bold">{users.length}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-card p-6 rounded-lg vintage-border">
            <div className="flex items-center">
              <div className="bg-primary/20 p-3 rounded-full mr-4">
                <Utensils className="text-primary" size={24} />
              </div>
              <div>
                <h3 className="text-sm text-gray-300">Total Meals</h3>
                <p className="text-2xl font-bold">{mealCount}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-card p-6 rounded-lg vintage-border">
            <div className="flex items-center">
              <div className="bg-primary/20 p-3 rounded-full mr-4">
                <Award className="text-primary" size={24} />
              </div>
              <div>
                <h3 className="text-sm text-gray-300">Highest Streak</h3>
                <p className="text-2xl font-bold">
                  {topStreaks.length > 0 ? topStreaks[0].currentStreak : 0}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-card p-6 rounded-lg vintage-border">
            <h3 className="text-sm text-gray-300 mb-2">Meals by Type</h3>
            <div className="flex justify-between items-center">
              <div className="flex items-center">
                <Coffee className="text-primary mr-2" size={16} />
                <span className="text-xs">Breakfast</span>
              </div>
              <span className="font-bold">{breakfastCount}</span>
            </div>
            <div className="flex justify-between items-center my-2">
              <div className="flex items-center">
                <UtensilsCrossed className="text-primary mr-2" size={16} />
                <span className="text-xs">Lunch</span>
              </div>
              <span className="font-bold">{lunchCount}</span>
            </div>
            <div className="flex justify-between items-center">
              <div className="flex items-center">
                <Wine className="text-primary mr-2" size={16} />
                <span className="text-xs">Dinner</span>
              </div>
              <span className="font-bold">{dinnerCount}</span>
            </div>
          </div>
        </div>
        
        <div className="bg-card p-6 rounded-lg vintage-border">
          <h2 className="text-xl font-bold mb-2 vintage-text">Manage Streaks</h2>
          <button
            onClick={handleResetExpiredStreaks}
            className="w-full mt-2 vintage-button bg-secondary text-sm py-2 px-4 flex items-center justify-center"
          >
            <Activity className="w-4 h-4 mr-2" />
            Reset Expired Streaks
          </button>
          <p className="text-xs text-gray-400 mt-2">Resets streaks for inactive users</p>
        </div>
        
        <div className="bg-card p-6 rounded-lg vintage-border mb-8">
          <h2 className="text-xl font-bold mb-4 vintage-text">Meal Distribution</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsBarChart
                  data={mealChartData}
                  margin={{
                    top: 20,
                    right: 30,
                    left: 20,
                    bottom: 5,
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1e1e1e', 
                      border: '1px solid #333',
                      color: '#fff'
                    }} 
                  />
                  <Legend />
                  <Bar dataKey="count" name="Number of Meals" fill="#8884d8" />
                </RechartsBarChart>
              </ResponsiveContainer>
            </div>
            
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart outerRadius="80%" data={mealChartData}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="name" />
                  <PolarRadiusAxis />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1e1e1e', 
                      border: '1px solid #333',
                      color: '#fff'
                    }} 
                  />
                  <Radar
                    name="Meals"
                    dataKey="count"
                    stroke="#8884d8"
                    fill="#8884d8"
                    fillOpacity={0.6}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
        
        {/* User Growth Area Chart */}
        <div className="mb-8">
          {isLoadingGrowthData ? (
            <div className="bg-card p-6 rounded-lg vintage-border h-96 flex items-center justify-center">
              <div className="text-center">
                <div className="w-10 h-10 border-t-2 border-primary rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-muted-foreground">Loading user growth data...</p>
              </div>
            </div>
          ) : (
            <div className="bg-card p-6 rounded-lg vintage-border">
              <div className="flex items-center mb-4">
                <TrendingUp className="text-primary mr-2" size={20} />
                <h2 className="text-xl font-bold vintage-text">User Growth Trend (30 Days)</h2>
              </div>
              <AreaChartConnectNulls 
                data={userGrowthData} 
                title="Cumulative User Count" 
                color="#8884d8"
                gradientStart="#8884d8"
                gradientEnd="rgba(136, 132, 216, 0.1)"
                connectNulls={true}
                showAverage={false}
              />
              <p className="text-xs text-center text-gray-400 mt-2">
                Chart shows the cumulative number of users over the last 30 days
              </p>
            </div>
          )}
        </div>
        
        {/* Meal Activity Area Chart */}
        <div className="mb-8">
          {isLoadingActivityData ? (
            <div className="bg-card p-6 rounded-lg vintage-border h-96 flex items-center justify-center">
              <div className="text-center">
                <div className="w-10 h-10 border-t-2 border-primary rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-muted-foreground">Loading meal activity data...</p>
              </div>
            </div>
          ) : (
            <div className="bg-card p-6 rounded-lg vintage-border">
              <div className="flex items-center mb-4">
                <Activity className="text-primary mr-2" size={20} />
                <h2 className="text-xl font-bold vintage-text">Daily Meal Activity (30 Days)</h2>
              </div>
              <AreaChartConnectNulls 
                data={mealActivityData} 
                title="Daily Meal Uploads" 
                color="#82ca9d"
                gradientStart="#82ca9d"
                gradientEnd="rgba(130, 202, 157, 0.1)"
                connectNulls={false}
                showAverage={true}
              />
              <p className="text-xs text-center text-gray-400 mt-2">
                Chart shows the number of meals uploaded each day over the last 30 days (gaps indicate days with no data)
              </p>
            </div>
          )}
        </div>
        
        <div className="bg-card p-6 rounded-lg vintage-border mb-8">
          <h2 className="text-xl font-bold mb-4 vintage-text">Top Streaks</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-primary/20">
                  <th className="text-left py-2 px-4">User</th>
                  <th className="text-left py-2 px-4">Email</th>
                  <th className="text-right py-2 px-4">Current Streak</th>
                  <th className="text-right py-2 px-4">Longest Streak</th>
                </tr>
              </thead>
              <tbody>
                {topStreaks.map((streak) => (
                  <tr key={streak.id} className="border-b border-primary/10 hover:bg-primary/5">
                    <td className="py-2 px-4">{streak.user.name || 'Anonymous'}</td>
                    <td className="py-2 px-4">{streak.user.email}</td>
                    <td className="py-2 px-4 text-right">{streak.currentStreak}</td>
                    <td className="py-2 px-4 text-right">{streak.longestStreak}</td>
                  </tr>
                ))}
                {topStreaks.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-4 text-center text-gray-300">
                      No streak data available
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
        
        <div className="bg-card p-6 rounded-lg vintage-border">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold vintage-text">All Users</h2>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="text"
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 bg-background border border-input rounded-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-primary/20">
                  <th 
                    className="text-left py-2 px-4 cursor-pointer"
                    onClick={() => handleSort('name')}
                  >
                    <div className="flex items-center">
                      <span>Name</span>
                      {sortField === 'name' && (
                        sortDirection === 'asc' ? 
                          <ChevronUp size={16} className="ml-1" /> : 
                          <ChevronDown size={16} className="ml-1" />
                      )}
                    </div>
                  </th>
                  <th className="text-left py-2 px-4">Email</th>
                  <th className="text-left py-2 px-4">Role</th>
                  <th 
                    className="text-right py-2 px-4 cursor-pointer"
                    onClick={() => handleSort('createdAt')}
                  >
                    <div className="flex items-center justify-end">
                      <span>Joined</span>
                      {sortField === 'createdAt' && (
                        sortDirection === 'asc' ? 
                          <ChevronUp size={16} className="ml-1" /> : 
                          <ChevronDown size={16} className="ml-1" />
                      )}
                    </div>
                  </th>
                  <th 
                    className="text-right py-2 px-4 cursor-pointer"
                    onClick={() => handleSort('streak')}
                  >
                    <div className="flex items-center justify-end">
                      <span>Streak</span>
                      {sortField === 'streak' && (
                        sortDirection === 'asc' ? 
                          <ChevronUp size={16} className="ml-1" /> : 
                          <ChevronDown size={16} className="ml-1" />
                      )}
                    </div>
                  </th>
                  <th className="text-right py-2 px-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {sortedUsers.map((user) => (
                  <React.Fragment key={user.id}>
                    <tr 
                      className="border-b border-primary/10 hover:bg-primary/5"
                    >
                      <td className="py-2 px-4 cursor-pointer" onClick={() => toggleUserExpand(user.id)}>
                        {user.name || 'Anonymous'}
                      </td>
                      <td className="py-2 px-4">{user.email}</td>
                      <td className="py-2 px-4">
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          user.role === 'ADMIN' ? 'bg-primary/20 text-primary' : 'bg-gray-200/10 text-gray-300'
                        }`}>
                          {user.role}
                        </span>
                        {(user.status === 'BANNED' || user.isBanned) && (
                          <span className="ml-2 px-2 py-1 rounded-full text-xs bg-red-500/20 text-red-500">
                            BANNED
                          </span>
                        )}
                      </td>
                      <td className="py-2 px-4 text-right">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-2 px-4 text-right">
                        {user.streak?.currentStreak || 0}
                      </td>
                      <td className="py-2 px-4 text-right">
                        <div className="flex justify-end space-x-2">
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedUser(user);
                              setShowPasswordModal(true);
                            }}
                            className="p-1 hover:bg-primary/10 rounded"
                            title="Change Password"
                          >
                            <Key size={16} className="text-primary" />
                          </button>
                          
                          {(user.status === 'BANNED' || user.isBanned) ? (
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedUser(user);
                                setShowUnbanModal(true);
                              }}
                              className="p-1 hover:bg-green-500/10 rounded"
                              title="Unban User"
                              disabled={user.role === 'ADMIN'}
                            >
                              <CheckCircle size={16} className={user.role === 'ADMIN' ? 'text-gray-500' : 'text-green-500'} />
                            </button>
                          ) : (
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedUser(user);
                                setShowBanModal(true);
                              }}
                              className="p-1 hover:bg-red-500/10 rounded"
                              title="Ban User"
                              disabled={user.role === 'ADMIN'}
                            >
                              <Ban size={16} className={user.role === 'ADMIN' ? 'text-gray-500' : 'text-red-500'} />
                            </button>
                          )}
                          
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedUser(user);
                              setCurrentStreak(user.streak?.currentStreak || 0);
                              setLongestStreak(user.streak?.longestStreak || 0);
                              setShowStreakModal(true);
                            }}
                            className="p-1 hover:bg-amber-500/10 rounded"
                            title="Manage Streak"
                          >
                            <Award size={16} className="text-amber-500" />
                          </button>
                          
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedUser(user);
                              setShowDeleteModal(true);
                            }}
                            className="p-1 hover:bg-red-500/10 rounded"
                            title="Delete Account"
                            disabled={user.role === 'ADMIN'}
                          >
                            <Trash2 size={16} className={user.role === 'ADMIN' ? 'text-gray-500' : 'text-red-500'} />
                          </button>
                        </div>
                      </td>
                    </tr>
                    {expandedUser === user.id && (
                      <tr>
                        <td colSpan={6} className="py-4 px-6 bg-background/50">
                          <div className="text-sm">
                            <h4 className="font-bold mb-2">Recent Meals</h4>
                            {user.meals.length > 0 ? (
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {user.meals.slice(0, 3).map((meal) => (
                                  <div key={meal.id} className="bg-card p-2 rounded">
                                    <div className="relative h-24 w-full mb-2">
                                      <Image
                                        src={meal.imageUrl}
                                        alt={meal.type}
                                        fill
                                        className="object-cover rounded"
                                      />
                                    </div>
                                    <div className="flex justify-between text-xs">
                                      <span>{meal.type}</span>
                                      <span>{new Date(meal.date).toLocaleDateString()}</span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-gray-300">No meals submitted yet</p>
                            )}
                            
                            <div className="mt-4 grid grid-cols-2 gap-4">
                              <div>
                                <h4 className="font-bold mb-1">Streak Info</h4>
                                <p className="text-xs">Current: {user.streak?.currentStreak || 0}</p>
                                <p className="text-xs">Longest: {user.streak?.longestStreak || 0}</p>
                              </div>
                              <div>
                                <h4 className="font-bold mb-1">Account Info</h4>
                                <p className="text-xs">ID: {user.id}</p>
                                <p className="text-xs">Created: {new Date(user.createdAt).toLocaleString()}</p>
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
                {sortedUsers.length === 0 && (
                  <tr key="no-users-found">
                    <td colSpan={6} className="py-4 text-center text-gray-300">
                      No users found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Add Meal Time Settings Section */}
        <section className="bg-card p-6 rounded-lg shadow-md mb-6 vintage-border">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold vintage-text">Meal Time Settings</h2>
            <button
              onClick={() => setShowMealTimeSettingsModal(true)}
              className="vintage-button bg-secondary text-sm px-4 py-2 flex items-center"
            >
              <Clock className="w-4 h-4 mr-2" />
              Edit Meal Times
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-card p-4 rounded-lg border border-primary/30">
              <h3 className="text-lg font-semibold mb-2 vintage-text">Breakfast</h3>
              <div className="text-sm">
                <div className="flex justify-between mb-1">
                  <span>Start Time:</span>
                  <span className="text-primary">{mealTimeSettings.breakfastStart}:00</span>
                </div>
                <div className="flex justify-between">
                  <span>End Time:</span>
                  <span className="text-primary">{mealTimeSettings.breakfastEnd}:00</span>
                </div>
              </div>
            </div>

            <div className="bg-card p-4 rounded-lg border border-primary/30">
              <h3 className="text-lg font-semibold mb-2 vintage-text">Lunch</h3>
              <div className="text-sm">
                <div className="flex justify-between mb-1">
                  <span>Start Time:</span>
                  <span className="text-primary">{mealTimeSettings.lunchStart}:00</span>
                </div>
                <div className="flex justify-between">
                  <span>End Time:</span>
                  <span className="text-primary">{mealTimeSettings.lunchEnd}:00</span>
                </div>
              </div>
            </div>

            <div className="bg-card p-4 rounded-lg border border-primary/30">
              <h3 className="text-lg font-semibold mb-2 vintage-text">Dinner</h3>
              <div className="text-sm">
                <div className="flex justify-between mb-1">
                  <span>Start Time:</span>
                  <span className="text-primary">{mealTimeSettings.dinnerStart}:00</span>
                </div>
                <div className="flex justify-between">
                  <span>End Time:</span>
                  <span className="text-primary">{mealTimeSettings.dinnerEnd}:00</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* User Management Section */}
        <section className="bg-card p-6 rounded-lg shadow-md mb-6 vintage-border">
          <div className="mb-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold vintage-text">All Users</h2>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                <input
                  type="text"
                  placeholder="Search users..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 bg-background border border-input rounded-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-primary/20">
                    <th 
                      className="text-left py-2 px-4 cursor-pointer"
                      onClick={() => handleSort('name')}
                    >
                      <div className="flex items-center">
                        <span>Name</span>
                        {sortField === 'name' && (
                          sortDirection === 'asc' ? 
                            <ChevronUp size={16} className="ml-1" /> : 
                            <ChevronDown size={16} className="ml-1" />
                        )}
                      </div>
                    </th>
                    <th className="text-left py-2 px-4">Email</th>
                    <th className="text-left py-2 px-4">Role</th>
                    <th 
                      className="text-right py-2 px-4 cursor-pointer"
                      onClick={() => handleSort('createdAt')}
                    >
                      <div className="flex items-center justify-end">
                        <span>Joined</span>
                        {sortField === 'createdAt' && (
                          sortDirection === 'asc' ? 
                            <ChevronUp size={16} className="ml-1" /> : 
                            <ChevronDown size={16} className="ml-1" />
                        )}
                      </div>
                    </th>
                    <th 
                      className="text-right py-2 px-4 cursor-pointer"
                      onClick={() => handleSort('streak')}
                    >
                      <div className="flex items-center justify-end">
                        <span>Streak</span>
                        {sortField === 'streak' && (
                          sortDirection === 'asc' ? 
                            <ChevronUp size={16} className="ml-1" /> : 
                            <ChevronDown size={16} className="ml-1" />
                        )}
                      </div>
                    </th>
                    <th className="text-right py-2 px-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedUsers.map((user) => (
                    <React.Fragment key={user.id}>
                      <tr 
                        className="border-b border-primary/10 hover:bg-primary/5"
                      >
                        <td className="py-2 px-4 cursor-pointer" onClick={() => toggleUserExpand(user.id)}>
                          {user.name || 'Anonymous'}
                        </td>
                        <td className="py-2 px-4">{user.email}</td>
                        <td className="py-2 px-4">
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            user.role === 'ADMIN' ? 'bg-primary/20 text-primary' : 'bg-gray-200/10 text-gray-300'
                          }`}>
                            {user.role}
                          </span>
                          {(user.status === 'BANNED' || user.isBanned) && (
                            <span className="ml-2 px-2 py-1 rounded-full text-xs bg-red-500/20 text-red-500">
                              BANNED
                            </span>
                          )}
                        </td>
                        <td className="py-2 px-4 text-right">
                          {new Date(user.createdAt).toLocaleDateString()}
                        </td>
                        <td className="py-2 px-4 text-right">
                          {user.streak?.currentStreak || 0}
                        </td>
                        <td className="py-2 px-4 text-right">
                          <div className="flex justify-end space-x-2">
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedUser(user);
                                setShowPasswordModal(true);
                              }}
                              className="p-1 hover:bg-primary/10 rounded"
                              title="Change Password"
                            >
                              <Key size={16} className="text-primary" />
                            </button>
                            
                            {(user.status === 'BANNED' || user.isBanned) ? (
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedUser(user);
                                  setShowUnbanModal(true);
                                }}
                                className="p-1 hover:bg-green-500/10 rounded"
                                title="Unban User"
                                disabled={user.role === 'ADMIN'}
                              >
                                <CheckCircle size={16} className={user.role === 'ADMIN' ? 'text-gray-500' : 'text-green-500'} />
                              </button>
                            ) : (
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedUser(user);
                                  setShowBanModal(true);
                                }}
                                className="p-1 hover:bg-red-500/10 rounded"
                                title="Ban User"
                                disabled={user.role === 'ADMIN'}
                              >
                                <Ban size={16} className={user.role === 'ADMIN' ? 'text-gray-500' : 'text-red-500'} />
                              </button>
                            )}
                            
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedUser(user);
                                setCurrentStreak(user.streak?.currentStreak || 0);
                                setLongestStreak(user.streak?.longestStreak || 0);
                                setShowStreakModal(true);
                              }}
                              className="p-1 hover:bg-amber-500/10 rounded"
                              title="Manage Streak"
                            >
                              <Award size={16} className="text-amber-500" />
                            </button>
                            
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedUser(user);
                                setShowDeleteModal(true);
                              }}
                              className="p-1 hover:bg-red-500/10 rounded"
                              title="Delete Account"
                              disabled={user.role === 'ADMIN'}
                            >
                              <Trash2 size={16} className={user.role === 'ADMIN' ? 'text-gray-500' : 'text-red-500'} />
                            </button>
                          </div>
                        </td>
                      </tr>
                      {expandedUser === user.id && (
                        <tr>
                          <td colSpan={6} className="py-4 px-6 bg-background/50">
                            <div className="text-sm">
                              <h4 className="font-bold mb-2">Recent Meals</h4>
                              {user.meals.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                  {user.meals.slice(0, 3).map((meal) => (
                                    <div key={meal.id} className="bg-card p-2 rounded">
                                      <div className="relative h-24 w-full mb-2">
                                        <Image
                                          src={meal.imageUrl}
                                          alt={meal.type}
                                          fill
                                          className="object-cover rounded"
                                        />
                                      </div>
                                      <div className="flex justify-between text-xs">
                                        <span>{meal.type}</span>
                                        <span>{new Date(meal.date).toLocaleDateString()}</span>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <p className="text-gray-300">No meals submitted yet</p>
                              )}
                              
                              <div className="mt-4 grid grid-cols-2 gap-4">
                                <div>
                                  <h4 className="font-bold mb-1">Streak Info</h4>
                                  <p className="text-xs">Current: {user.streak?.currentStreak || 0}</p>
                                  <p className="text-xs">Longest: {user.streak?.longestStreak || 0}</p>
                                </div>
                                <div>
                                  <h4 className="font-bold mb-1">Account Info</h4>
                                  <p className="text-xs">ID: {user.id}</p>
                                  <p className="text-xs">Created: {new Date(user.createdAt).toLocaleString()}</p>
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                  {sortedUsers.length === 0 && (
                    <tr key="no-users-found">
                      <td colSpan={6} className="py-4 text-center text-gray-300">
                        No users found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </main>

      {/* Password Change Modal */}
      {showPasswordModal && selectedUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card p-6 rounded-lg vintage-border max-w-md w-full">
            <h3 className="text-xl font-bold mb-4">Change Password for {selectedUser.name || selectedUser.email}</h3>
            <div className="mb-4">
              <label className="block text-sm mb-1">New Password</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full p-2 bg-background border border-input rounded-sm"
                placeholder="Enter new password"
              />
            </div>
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => {
                  setShowPasswordModal(false);
                  setNewPassword('');
                }}
                className="vintage-button bg-secondary text-sm py-2 px-4"
              >
                Cancel
              </button>
              <button
                onClick={handlePasswordChange}
                className="vintage-button bg-primary text-sm py-2 px-4"
                disabled={!newPassword}
              >
                Change Password
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Ban User Modal */}
      {showBanModal && selectedUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card p-6 rounded-lg vintage-border max-w-md w-full">
            <h3 className="text-xl font-bold mb-4">Ban User: {selectedUser.name || selectedUser.email}</h3>
            <div className="mb-4">
              <label className="block text-sm mb-1">Reason for Ban</label>
              <textarea
                value={banReason}
                onChange={(e) => setBanReason(e.target.value)}
                className="w-full p-2 bg-background border border-input rounded-sm"
                placeholder="Enter reason for banning this user"
                rows={3}
              />
            </div>
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => {
                  setShowBanModal(false);
                  setBanReason('');
                }}
                className="vintage-button bg-secondary text-sm py-2 px-4"
              >
                Cancel
              </button>
              <button
                onClick={handleBanUser}
                className="vintage-button bg-red-500 text-sm py-2 px-4"
              >
                Ban User
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Streak Management Modal */}
      {showStreakModal && selectedUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card p-6 rounded-lg vintage-border max-w-md w-full">
            <h2 className="text-xl font-bold mb-4 vintage-text">Manage Streak</h2>
            <p className="mb-4">
              Update streak for <span className="font-bold">{selectedUser.name || selectedUser.email}</span>
            </p>
            
            <div className="space-y-4 mb-6">
              <div>
                <label htmlFor="currentStreak" className="block text-sm font-medium mb-1">
                  Current Streak
                </label>
                <input
                  type="number"
                  id="currentStreak"
                  min="0"
                  value={currentStreak}
                  onChange={(e) => setCurrentStreak(parseInt(e.target.value) || 0)}
                  className="w-full p-2 bg-background border border-primary/30 rounded focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
              
              <div>
                <label htmlFor="longestStreak" className="block text-sm font-medium mb-1">
                  Longest Streak
                </label>
                <input
                  type="number"
                  id="longestStreak"
                  min="0"
                  value={longestStreak}
                  onChange={(e) => setLongestStreak(parseInt(e.target.value) || 0)}
                  className="w-full p-2 bg-background border border-primary/30 rounded focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
            </div>
            
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setShowStreakModal(false)}
                className="vintage-button bg-gray-700 py-2 px-4"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateStreak}
                className="vintage-button bg-primary py-2 px-4"
              >
                Update Streak
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Unban User Modal */}
      {showUnbanModal && selectedUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card p-6 rounded-lg vintage-border max-w-md w-full">
            <h3 className="text-xl font-bold mb-4">Unban User: {selectedUser.name || selectedUser.email}</h3>
            <p className="mb-6">Are you sure you want to unban this user? They will regain access to the platform.</p>
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => {
                  setShowUnbanModal(false);
                }}
                className="vintage-button bg-secondary text-sm py-2 px-4"
              >
                Cancel
              </button>
              <button
                onClick={handleUnbanUser}
                className="vintage-button bg-green-500 text-sm py-2 px-4"
              >
                Unban User
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Account Modal */}
      {showDeleteModal && selectedUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card p-6 rounded-lg vintage-border max-w-md w-full">
            <h3 className="text-xl font-bold mb-4">Delete Account: {selectedUser.name || selectedUser.email}</h3>
            <div className="bg-red-500/10 border border-red-500/30 rounded p-3 mb-4">
              <p className="text-red-400 text-sm">
                Warning: This action cannot be undone. All user data, including meals and streak information, will be permanently deleted.
              </p>
            </div>
            <div className="mb-4">
              <label className="block text-sm mb-1">Confirm by typing the user's email address</label>
              <input
                type="text"
                value={deleteConfirmation}
                onChange={(e) => setDeleteConfirmation(e.target.value)}
                className="w-full p-2 bg-background border border-input rounded-sm"
                placeholder={selectedUser.email}
              />
            </div>
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteConfirmation('');
                }}
                className="vintage-button bg-secondary text-sm py-2 px-4"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                className="vintage-button bg-red-500 text-sm py-2 px-4"
                disabled={deleteConfirmation !== selectedUser.email}
              >
                Delete Account
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Meal Time Settings Modal */}
      {showMealTimeSettingsModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/70">
          <div className="bg-card p-6 rounded-lg max-w-lg w-full">
            <h3 className="text-xl font-bold mb-4 vintage-text">Edit Meal Time Settings</h3>
            
            {isLoadingSettings ? (
              <div className="text-center py-4">
                <div className="w-8 h-8 border-t-2 border-primary rounded-full animate-spin mx-auto"></div>
                <p className="mt-2">Loading settings...</p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div>
                    <h4 className="font-semibold mb-3 vintage-text">Breakfast</h4>
                    <div className="space-y-2">
                      <div>
                        <label className="block text-sm mb-1">Start Time (hour)</label>
                        <input
                          type="number"
                          name="breakfastStart"
                          min="0"
                          max="23"
                          value={mealTimeSettings.breakfastStart}
                          onChange={handleMealTimeSettingsChange}
                          className="w-full p-2 bg-background border border-input rounded-sm focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                      </div>
                      <div>
                        <label className="block text-sm mb-1">End Time (hour)</label>
                        <input
                          type="number"
                          name="breakfastEnd"
                          min="0"
                          max="23"
                          value={mealTimeSettings.breakfastEnd}
                          onChange={handleMealTimeSettingsChange}
                          className="w-full p-2 bg-background border border-input rounded-sm focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold mb-3 vintage-text">Lunch</h4>
                    <div className="space-y-2">
                      <div>
                        <label className="block text-sm mb-1">Start Time (hour)</label>
                        <input
                          type="number"
                          name="lunchStart"
                          min="0"
                          max="23"
                          value={mealTimeSettings.lunchStart}
                          onChange={handleMealTimeSettingsChange}
                          className="w-full p-2 bg-background border border-input rounded-sm focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                      </div>
                      <div>
                        <label className="block text-sm mb-1">End Time (hour)</label>
                        <input
                          type="number"
                          name="lunchEnd"
                          min="0"
                          max="23"
                          value={mealTimeSettings.lunchEnd}
                          onChange={handleMealTimeSettingsChange}
                          className="w-full p-2 bg-background border border-input rounded-sm focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div className="md:col-span-2">
                    <h4 className="font-semibold mb-3 vintage-text">Dinner</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm mb-1">Start Time (hour)</label>
                        <input
                          type="number"
                          name="dinnerStart"
                          min="0"
                          max="23"
                          value={mealTimeSettings.dinnerStart}
                          onChange={handleMealTimeSettingsChange}
                          className="w-full p-2 bg-background border border-input rounded-sm focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                      </div>
                      <div>
                        <label className="block text-sm mb-1">End Time (hour)</label>
                        <input
                          type="number"
                          name="dinnerEnd"
                          min="0"
                          max="23"
                          value={mealTimeSettings.dinnerEnd}
                          onChange={handleMealTimeSettingsChange}
                          className="w-full p-2 bg-background border border-input rounded-sm focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="text-sm mb-4 text-yellow-400">
                  <p>⚠️ Note: Times are in 24-hour format (0-23) in Thailand timezone (UTC+7)</p>
                  <p>⚠️ Start time must be less than end time for each meal</p>
                </div>
                
                <div className="flex justify-end">
                  <button
                    onClick={() => setShowMealTimeSettingsModal(false)}
                    className="mr-2 px-4 py-2 rounded-md border border-input text-gray-300"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleMealTimeSettingsSubmit}
                    className="px-4 py-2 bg-primary text-white rounded-md"
                  >
                    Save Changes
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
} 