"use client";

import React, { useState, useEffect } from "react";
import { 
  Bar, 
  BarChart, 
  CartesianGrid, 
  XAxis, 
  YAxis, 
  Legend, 
  ResponsiveContainer,
  Tooltip,
  Line,
  LineChart,
  PieChart,
  Pie,
  Cell
} from "recharts";
import { MoveUpRight, MoveDownLeft, Users, Award, Calendar, Utensils } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

// Define types for our data
type UserActivityData = {
  month: string;
  active: number;
  new: number;
};

type QuestCompletionData = {
  date: string;
  completed: number;
  assigned: number;
};

type MealTypeData = {
  name: string;
  value: number;
};

type QuestTypeData = {
  type: string;
  count: number;
};

type SummaryStats = {
  totalUsers: number;
  newUsers: number;
  activeUsers: number;
  totalCompletedQuests: number;
  totalAssignedQuests: number;
  completionRate: number;
  userGrowthPercent: number;
  questCompletionGrowthPercent: number;
};

export default function AnalyticsPage() {
  const [dateRange, setDateRange] = useState("year");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pieChartRadius, setPieChartRadius] = useState(100);
  
  // State for analytics data
  const [userActivityData, setUserActivityData] = useState<UserActivityData[]>([]);
  const [questCompletionData, setQuestCompletionData] = useState<QuestCompletionData[]>([]);
  const [mealTypeData, setMealTypeData] = useState<MealTypeData[]>([]);
  const [questTypeData, setQuestTypeData] = useState<QuestTypeData[]>([]);
  const [summaryStats, setSummaryStats] = useState<SummaryStats>({
    totalUsers: 0,
    newUsers: 0,
    activeUsers: 0,
    totalCompletedQuests: 0,
    totalAssignedQuests: 0,
    completionRate: 0,
    userGrowthPercent: 0,
    questCompletionGrowthPercent: 0
  });
  
  // Update pie chart radius based on window size
  useEffect(() => {
    const handleResize = () => {
      if (typeof window !== 'undefined') {
        if (window.innerWidth < 640) {
          setPieChartRadius(80);
        } else if (window.innerWidth < 1024) {
          setPieChartRadius(100);
        } else {
          setPieChartRadius(120);
        }
      }
    };
    
    // Set initial size
    handleResize();
    
    // Add event listener
    window.addEventListener('resize', handleResize);
    
    // Clean up
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  // Fetch analytics data when date range changes
  useEffect(() => {
    const fetchAnalyticsData = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const response = await fetch(`/api/admin/analytics?range=${dateRange}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch analytics data');
        }
        
        const data = await response.json();
        
        // Update state with fetched data
        setUserActivityData(data.userActivityData || []);
        setQuestCompletionData(data.questCompletionData || []);
        setMealTypeData(data.mealTypeData || []);
        setQuestTypeData(data.questTypeData || []);
        setSummaryStats(data.summary || {
          totalUsers: 0,
          newUsers: 0,
          activeUsers: 0,
          totalCompletedQuests: 0,
          totalAssignedQuests: 0,
          completionRate: 0,
          userGrowthPercent: 0,
          questCompletionGrowthPercent: 0
        });
      } catch (err) {
        console.error("Error fetching analytics data:", err);
        setError('Failed to load analytics data. Please try again later.');
        
        // Set default empty data
        setUserActivityData([]);
        setQuestCompletionData([]);
        setMealTypeData([]);
        setQuestTypeData([]);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchAnalyticsData();
  }, [dateRange]);
  
  // Extract summary stats values
  const {
    activeUsers,
    newUsers,
    totalCompletedQuests,
    completionRate,
    userGrowthPercent,
    questCompletionGrowthPercent
  } = summaryStats;
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[300px] sm:min-h-[400px] md:min-h-[500px]">
        <div className="flex flex-col items-center gap-2">
          <div className="h-6 w-6 sm:h-8 sm:w-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div>
          <p className="text-sm sm:text-base text-muted-foreground">Loading analytics data...</p>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[300px] sm:min-h-[400px] md:min-h-[500px]">
        <div className="flex flex-col items-center gap-2 text-center max-w-xs sm:max-w-sm md:max-w-md p-4">
          <p className="text-destructive text-lg sm:text-xl">⚠️</p>
          <h3 className="text-lg sm:text-xl font-semibold">Data Unavailable</h3>
          <p className="text-sm sm:text-base text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="space-y-4 sm:space-y-6 p-2 sm:p-4 md:p-6">
      {/* Header Section */}
      <div className="flex flex-col gap-1 sm:gap-2">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Analytics Dashboard</h1>
        <p className="text-sm sm:text-base text-muted-foreground">
          Track user activity, quest completions, and platform metrics
        </p>
      </div>
      
      {/* Date Range Controls - Mobile: top, Desktop: right */}
      <div className="flex justify-center sm:justify-end mb-4 sm:mb-0">
        <Tabs defaultValue="year" value={dateRange} onValueChange={setDateRange} className="w-full sm:w-auto">
          <TabsList className="w-full sm:w-auto grid grid-cols-4 sm:flex">
            <TabsTrigger value="week" className="text-xs sm:text-sm">Week</TabsTrigger>
            <TabsTrigger value="month" className="text-xs sm:text-sm">Month</TabsTrigger>
            <TabsTrigger value="quarter" className="text-xs sm:text-sm">Quarter</TabsTrigger>
            <TabsTrigger value="year" className="text-xs sm:text-sm">Year</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
      
      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 md:gap-4">
        <Card className="overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 p-3 sm:p-4 pb-1 sm:pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">
              Total Active Users
            </CardTitle>
            <Users className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="p-3 sm:p-4 pt-1 sm:pt-2">
            <div className="text-lg sm:text-xl md:text-2xl font-bold">{activeUsers.toLocaleString()}</div>
            <p className="text-[10px] sm:text-xs text-muted-foreground flex items-center gap-1 mt-1">
              <MoveUpRight className="h-2 w-2 sm:h-3 sm:w-3 text-emerald-500" />
              <span className="text-emerald-500">+{userGrowthPercent}%</span> from last month
            </p>
          </CardContent>
        </Card>
        
        <Card className="overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 p-3 sm:p-4 pb-1 sm:pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">
              New Users
            </CardTitle>
            <Award className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="p-3 sm:p-4 pt-1 sm:pt-2">
            <div className="text-lg sm:text-xl md:text-2xl font-bold">{newUsers.toLocaleString()}</div>
            <p className="text-[10px] sm:text-xs text-muted-foreground flex items-center gap-1 mt-1">
              <MoveUpRight className="h-2 w-2 sm:h-3 sm:w-3 text-emerald-500" />
              <span className="text-emerald-500">+{userGrowthPercent}%</span> from last month
            </p>
          </CardContent>
        </Card>
        
        <Card className="overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 p-3 sm:p-4 pb-1 sm:pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">
              Completed Quests
            </CardTitle>
            <Calendar className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="p-3 sm:p-4 pt-1 sm:pt-2">
            <div className="text-lg sm:text-xl md:text-2xl font-bold">{totalCompletedQuests.toLocaleString()}</div>
            <p className="text-[10px] sm:text-xs text-muted-foreground flex items-center gap-1 mt-1">
              {questCompletionGrowthPercent >= 0 ? (
                <>
                  <MoveUpRight className="h-2 w-2 sm:h-3 sm:w-3 text-emerald-500" />
                  <span className="text-emerald-500">+{questCompletionGrowthPercent}%</span>
                </>
              ) : (
                <>
                  <MoveDownLeft className="h-2 w-2 sm:h-3 sm:w-3 text-red-500" />
                  <span className="text-red-500">{questCompletionGrowthPercent}%</span>
                </>
              )}
              {' '}from last month
            </p>
          </CardContent>
        </Card>
        
        <Card className="overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 p-3 sm:p-4 pb-1 sm:pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">
              Quest Completion Rate
            </CardTitle>
            <Utensils className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="p-3 sm:p-4 pt-1 sm:pt-2">
            <div className="text-lg sm:text-xl md:text-2xl font-bold">{completionRate}%</div>
            <p className="text-[10px] sm:text-xs text-muted-foreground flex items-center gap-1 mt-1">
              {questCompletionGrowthPercent >= 0 ? (
                <>
                  <MoveUpRight className="h-2 w-2 sm:h-3 sm:w-3 text-emerald-500" />
                  <span className="text-emerald-500">+{questCompletionGrowthPercent}%</span>
                </>
              ) : (
                <>
                  <MoveDownLeft className="h-2 w-2 sm:h-3 sm:w-3 text-red-500" />
                  <span className="text-red-500">{questCompletionGrowthPercent}%</span>
                </>
              )}
              {' '}from last month
            </p>
          </CardContent>
        </Card>
      </div>
      
      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        <Card>
          <CardHeader className="p-3 sm:p-4 pb-1 sm:pb-2">
            <CardTitle className="text-sm sm:text-base md:text-lg">User Activity</CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              Monthly active and new users
            </CardDescription>
          </CardHeader>
          <CardContent className="p-2 sm:p-4 h-[250px] sm:h-[300px] md:h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={userActivityData}
                margin={{ top: 5, right: 10, left: 0, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" tick={{fontSize: 10}} />
                <YAxis tick={{fontSize: 10}} />
                <Tooltip contentStyle={{fontSize: '12px'}} />
                <Legend wrapperStyle={{fontSize: '12px'}} />
                <Bar dataKey="active" fill="#3498db" name="Active Users" />
                <Bar dataKey="new" fill="#2ecc71" name="New Users" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="p-3 sm:p-4 pb-1 sm:pb-2">
            <CardTitle className="text-sm sm:text-base md:text-lg">Quest Completion Trend</CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              Monthly quest assignment and completion
            </CardDescription>
          </CardHeader>
          <CardContent className="p-2 sm:p-4 h-[250px] sm:h-[300px] md:h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={questCompletionData}
                margin={{ top: 5, right: 10, left: 0, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tick={{fontSize: 10}} />
                <YAxis tick={{fontSize: 10}} />
                <Tooltip contentStyle={{fontSize: '12px'}} />
                <Legend wrapperStyle={{fontSize: '12px'}} />
                <Line 
                  type="monotone" 
                  dataKey="assigned" 
                  stroke="#8884d8" 
                  name="Quests Assigned"
                  strokeWidth={2}
                />
                <Line 
                  type="monotone" 
                  dataKey="completed" 
                  stroke="#82ca9d" 
                  name="Quests Completed"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="p-3 sm:p-4 pb-1 sm:pb-2">
            <CardTitle className="text-sm sm:text-base md:text-lg">Meal Type Distribution</CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              Distribution of meal types uploaded
            </CardDescription>
          </CardHeader>
          <CardContent className="p-2 sm:p-4 h-[250px] sm:h-[300px] md:h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={mealTypeData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={pieChartRadius}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {mealTypeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{fontSize: '12px'}} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="p-3 sm:p-4 pb-1 sm:pb-2">
            <CardTitle className="text-sm sm:text-base md:text-lg">Quest Distribution by Type</CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              Breakdown of quests by category
            </CardDescription>
          </CardHeader>
          <CardContent className="p-2 sm:p-4 h-[250px] sm:h-[300px] md:h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={questTypeData}
                layout="vertical"
                margin={{ top: 5, right: 10, left: 0, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" tick={{fontSize: 10}} />
                <YAxis 
                  dataKey="type" 
                  type="category" 
                  width={100}
                  tick={{fontSize: 10}}
                  tickFormatter={(value: string) => value.split('_').map((word: string) => 
                    word.charAt(0) + word.slice(1).toLowerCase()
                  ).join(' ')}
                />
                <Tooltip 
                  formatter={(value: number) => [value, 'Count']}
                  contentStyle={{fontSize: '12px'}} 
                />
                <Bar dataKey="count" fill="#8884d8">
                  {questTypeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 