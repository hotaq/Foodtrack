'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { signOut } from 'next-auth/react';
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
  BarChart
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
  const [showStreakModal, setShowStreakModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [banReason, setBanReason] = useState('');
  const [currentStreak, setCurrentStreak] = useState(0);
  const [longestStreak, setLongestStreak] = useState(0);
  const [users, setUsers] = useState<User[]>(initialUsers);

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
      
      // Update the user in the local state
      setUsers(users.map(user => {
        if (user.id === selectedUser.id) {
          return {
            ...user,
            streak: {
              currentStreak,
              longestStreak,
            }
          };
        }
        return user;
      }));

      setShowStreakModal(false);
      toast.success("Streak updated successfully");
    } catch (error) {
      console.error("Error updating streak:", error);
      toast.error("Failed to update streak");
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
        
        {/* Composed Chart with Axis Labels */}
        <div className="bg-card p-6 rounded-lg vintage-border mb-8">
          <h2 className="text-xl font-bold mb-4 vintage-text">Meal Trends Analysis</h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart
                data={mealChartData}
                margin={{
                  top: 20,
                  right: 20,
                  bottom: 20,
                  left: 20,
                }}
              >
                <CartesianGrid stroke="#f5f5f5" />
                <XAxis dataKey="name" scale="band" />
                <YAxis />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1e1e1e', 
                    border: '1px solid #333',
                    color: '#fff'
                  }}
                />
                <Legend />
                <Area 
                  type="monotone" 
                  dataKey="count" 
                  fill="#8884d8" 
                  stroke="#8884d8" 
                  name="Meal Count" 
                  fillOpacity={0.3}
                />
                <Bar 
                  dataKey="count" 
                  barSize={20} 
                  fill="#413ea0" 
                  name="Meal Count"
                >
                  <LabelList dataKey="count" position="top" />
                </Bar>
                <Line 
                  type="monotone" 
                  dataKey="count" 
                  stroke="#ff7300" 
                  name="Trend" 
                  strokeWidth={2}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
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
                  <>
                    <tr 
                      key={user.id} 
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
                  </>
                ))}
                {sortedUsers.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-4 text-center text-gray-300">
                      No users found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
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
    </div>
  );
} 