'use client';

import { useState, useEffect } from "react";
import Link from "next/link";
import { ChevronLeft, RefreshCw } from "lucide-react";
import HighlightAndZoomLineChart from "@/components/HighlightAndZoomLineChart";
import LineChartConnectNulls from "@/components/LineChartConnectNulls";
import { 
  RadarChart, 
  PolarGrid, 
  PolarAngleAxis, 
  PolarRadiusAxis, 
  Radar, 
  ResponsiveContainer,
  Tooltip,
  Legend,
  ScatterChart,
  Scatter,
  ComposedChart,
  Line,
  Area,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  LabelList,
  Cell
} from 'recharts';

interface User {
  id: string;
  name: string | null;
  email: string;
  role: "USER" | "ADMIN";
  streak: {
    currentStreak: number;
    longestStreak: number;
  } | null;
}

interface AnalyticsClientProps {
  user: User;
  mealCountByType: {
    BREAKFAST: number;
    LUNCH: number;
    DINNER: number;
  };
  mealsByDay: {
    name: string;
    count: number;
  }[];
}

export default function AnalyticsClient({ user, mealCountByType: initialMealCountByType, mealsByDay: initialMealsByDay }: AnalyticsClientProps) {
  const [mealCountByType, setMealCountByType] = useState(initialMealCountByType);
  const [mealsByDay, setMealsByDay] = useState(initialMealsByDay);
  const [isLoading, setIsLoading] = useState(false);
  const [mealTrendData, setMealTrendData] = useState<{name: string, value: number}[]>([]);
  const [weeklyPatternData, setWeeklyPatternData] = useState<{name: string, value: number | null}[]>([]);
  const [isLoadingTrendData, setIsLoadingTrendData] = useState(true);
  const [isLoadingPatternData, setIsLoadingPatternData] = useState(true);

  // Function to fetch updated analytics data
  const fetchAnalyticsData = async () => {
    setIsLoading(true);
    try {
      console.log("Analytics Client: Fetching data from API");
      const response = await fetch('/api/analytics');
      
      if (!response.ok) {
        console.error("Analytics Client: API response not OK", response.status, response.statusText);
        throw new Error('Failed to fetch analytics data');
      }
      
      const data = await response.json();
      console.log("Analytics Client: Received data from API", data);
      
      setMealCountByType(data.mealCountByType);
      setMealsByDay(data.mealsByDay);
    } catch (error) {
      console.error('Error fetching analytics data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch data when component mounts
  useEffect(() => {
    console.log("Analytics Client: Initial props", { initialMealCountByType, initialMealsByDay });
    fetchAnalyticsData();
  }, []);

  // Fetch meal trend data
  useEffect(() => {
    const fetchMealTrendData = async () => {
      setIsLoadingTrendData(true);
      try {
        const response = await fetch('/api/meals/trend');
        if (!response.ok) {
          throw new Error('Failed to fetch meal trend data');
        }
        const data = await response.json();
        setMealTrendData(data);
      } catch (error) {
        console.error('Error fetching meal trend data:', error);
        // Fallback to sample data if API fails
        setMealTrendData(generateSampleMealTrendData());
      } finally {
        setIsLoadingTrendData(false);
      }
    };

    fetchMealTrendData();
  }, []);

  // Fetch weekly pattern data
  useEffect(() => {
    const fetchWeeklyPatternData = async () => {
      setIsLoadingPatternData(true);
      try {
        const response = await fetch('/api/meals/weekly-pattern');
        if (!response.ok) {
          throw new Error('Failed to fetch weekly pattern data');
        }
        const data = await response.json();
        setWeeklyPatternData(data);
      } catch (error) {
        console.error('Error fetching weekly pattern data:', error);
        // Fallback to sample data if API fails
        setWeeklyPatternData(generateSampleWeeklyPatternData());
      } finally {
        setIsLoadingPatternData(false);
      }
    };

    fetchWeeklyPatternData();
  }, []);

  // Generate sample data as fallback for trend chart
  const generateSampleMealTrendData = () => {
    const data = [];
    const today = new Date();
    
    for (let i = 29; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      
      // Random value between 0-3 for demonstration
      const value = Math.floor(Math.random() * 4);
      
      data.push({
        name: `${date.getMonth() + 1}/${date.getDate()}`,
        value: value
      });
    }
    
    return data;
  };

  // Generate sample data as fallback for weekly pattern chart
  const generateSampleWeeklyPatternData = () => {
    const data = [];
    
    for (let i = 0; i < 24; i++) {
      // Create some null values to demonstrate connect nulls feature
      let value = null;
      
      // Only add values for certain hours to create gaps
      if (i === 7 || i === 8 || i === 12 || i === 13 || i === 18 || i === 19) {
        value = Math.floor(Math.random() * 5) + 1;
      }
      
      data.push({
        name: `${i}:00`,
        value: value
      });
    }
    
    return data;
  };

  // Prepare data for meal type radar chart
  const mealTypeData = [
    { name: 'Breakfast', value: mealCountByType.BREAKFAST || 0 },
    { name: 'Lunch', value: mealCountByType.LUNCH || 0 },
    { name: 'Dinner', value: mealCountByType.DINNER || 0 },
  ];
  
  console.log("Analytics Client: Rendering with data", { mealTypeData, mealsByDay });
  
  // Calculate max value for better visualization
  const maxMealTypeValue = Math.max(
    mealCountByType.BREAKFAST || 0,
    mealCountByType.LUNCH || 0,
    mealCountByType.DINNER || 0
  );
  
  // Calculate max value for days of week
  const maxDayValue = Math.max(...mealsByDay.map(day => day.count || 0));
  
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-primary py-4">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between">
            <Link href="/dashboard" className="flex items-center text-primary hover:text-primary/80 transition-colors">
              <ChevronLeft size={20} />
              <span>Back to Dashboard</span>
            </Link>
            <button 
              onClick={fetchAnalyticsData}
              disabled={isLoading}
              className="flex items-center gap-2 text-primary hover:text-primary/80 transition-colors disabled:opacity-50"
            >
              <RefreshCw size={20} className={isLoading ? "animate-spin" : ""} />
              <span>Refresh Data</span>
            </button>
          </div>
        </div>
      </header>
      
      <main className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6 vintage-text text-primary">Meal Analytics</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          <div className="bg-card p-6 rounded-lg vintage-border">
            <h2 className="text-xl font-bold mb-4 vintage-text">Meal Type Distribution</h2>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart outerRadius="80%" data={mealTypeData}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="name" />
                  <PolarRadiusAxis domain={[0, maxMealTypeValue > 0 ? maxMealTypeValue : 5]} />
                  <Tooltip 
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
                  <Legend />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>
          
          <div className="bg-card p-6 rounded-lg vintage-border">
            <h2 className="text-xl font-bold mb-4 vintage-text">Meals by Day of Week</h2>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart outerRadius="80%" data={mealsByDay}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="name" />
                  <PolarRadiusAxis domain={[0, maxDayValue > 0 ? maxDayValue : 5]} />
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
                    stroke="#82ca9d"
                    fill="#82ca9d"
                    fillOpacity={0.6}
                  />
                  <Legend />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
        
        <div className="bg-card p-6 rounded-lg vintage-border">
          <h2 className="text-xl font-bold mb-4 vintage-text">Meal Stats</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-primary/10 p-4 rounded-lg">
              <h3 className="text-lg font-semibold mb-2">Breakfast</h3>
              <p className="text-3xl font-bold">{mealCountByType.BREAKFAST}</p>
              <p className="text-sm text-gray-300">Total Uploads</p>
            </div>
            
            <div className="bg-primary/10 p-4 rounded-lg">
              <h3 className="text-lg font-semibold mb-2">Lunch</h3>
              <p className="text-3xl font-bold">{mealCountByType.LUNCH}</p>
              <p className="text-sm text-gray-300">Total Uploads</p>
            </div>
            
            <div className="bg-primary/10 p-4 rounded-lg">
              <h3 className="text-lg font-semibold mb-2">Dinner</h3>
              <p className="text-3xl font-bold">{mealCountByType.DINNER}</p>
              <p className="text-sm text-gray-300">Total Uploads</p>
            </div>
          </div>
        </div>
        
        {/* Bubble Chart (using ScatterChart) */}
        <div className="bg-card p-6 rounded-lg vintage-border mt-8">
          <h2 className="text-xl font-bold mb-4 vintage-text">Meal Comparison Bubble Chart</h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart
                margin={{
                  top: 20,
                  right: 20,
                  bottom: 20,
                  left: 20,
                }}
              >
                <CartesianGrid />
                <XAxis 
                  type="category" 
                  dataKey="name" 
                  name="Meal Type" 
                  allowDuplicatedCategory={false} 
                />
                <YAxis type="number" dataKey="value" name="Count" />
                <Tooltip 
                  cursor={{ strokeDasharray: '3 3' }}
                  contentStyle={{ 
                    backgroundColor: '#1e1e1e', 
                    border: '1px solid #333',
                    color: '#fff'
                  }}
                />
                <Scatter 
                  name="Meals" 
                  data={[
                    { name: 'Breakfast', value: mealCountByType.BREAKFAST, z: mealCountByType.BREAKFAST * 100 },
                    { name: 'Lunch', value: mealCountByType.LUNCH, z: mealCountByType.LUNCH * 100 },
                    { name: 'Dinner', value: mealCountByType.DINNER, z: mealCountByType.DINNER * 100 },
                  ]} 
                  fill="#8884d8"
                >
                  {mealTypeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={['#8884d8', '#82ca9d', '#ffc658'][index % 3]} />
                  ))}
                </Scatter>
                <Legend />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        {/* Composed Chart with Axis Labels */}
        <div className="bg-card p-6 rounded-lg vintage-border mt-8">
          <h2 className="text-xl font-bold mb-4 vintage-text">Meal Trends Composed Chart</h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart
                data={[
                  { name: 'Breakfast', value: mealCountByType.BREAKFAST, average: (mealCountByType.BREAKFAST + mealCountByType.LUNCH + mealCountByType.DINNER) / 3 },
                  { name: 'Lunch', value: mealCountByType.LUNCH, average: (mealCountByType.BREAKFAST + mealCountByType.LUNCH + mealCountByType.DINNER) / 3 },
                  { name: 'Dinner', value: mealCountByType.DINNER, average: (mealCountByType.BREAKFAST + mealCountByType.LUNCH + mealCountByType.DINNER) / 3 },
                ]}
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
                <Area type="monotone" dataKey="average" fill="#8884d8" stroke="#8884d8" name="Average" />
                <Bar dataKey="value" barSize={20} fill="#413ea0" name="Count">
                  <LabelList dataKey="value" position="top" />
                </Bar>
                <Line type="monotone" dataKey="value" stroke="#ff7300" name="Trend" />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Meal Trend Chart */}
        <div className="mb-8">
          {isLoadingTrendData ? (
            <div className="bg-card p-6 rounded-lg vintage-border h-96 flex items-center justify-center">
              <div className="text-center">
                <div className="w-10 h-10 border-t-2 border-primary rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-muted-foreground">Loading meal trend data...</p>
              </div>
            </div>
          ) : (
            <>
              <HighlightAndZoomLineChart 
                data={mealTrendData} 
                title="30-Day Meal Upload Trend" 
                color="#8884d8"
              />
              <p className="text-xs text-center text-gray-400 mt-2">
                Chart shows the number of meals uploaded each day over the last 30 days
              </p>
            </>
          )}
        </div>

        {/* Weekly Pattern Chart with Connect Nulls */}
        <div className="mb-8">
          {isLoadingPatternData ? (
            <div className="bg-card p-6 rounded-lg vintage-border h-96 flex items-center justify-center">
              <div className="text-center">
                <div className="w-10 h-10 border-t-2 border-primary rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-muted-foreground">Loading meal pattern data...</p>
              </div>
            </div>
          ) : (
            <>
              <LineChartConnectNulls 
                data={weeklyPatternData} 
                title="Meal Upload Time Patterns" 
                color="#82ca9d"
                connectNulls={true}
                showAverage={true}
              />
              <p className="text-xs text-center text-gray-400 mt-2">
                Chart shows when you typically upload meals throughout the day (hours with no data appear as gaps)
              </p>
            </>
          )}
        </div>
      </main>
    </div>
  );
} 