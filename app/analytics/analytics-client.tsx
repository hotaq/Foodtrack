'use client';

import Link from "next/link";
import { ChevronLeft } from "lucide-react";
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

export default function AnalyticsClient({ user, mealCountByType, mealsByDay }: AnalyticsClientProps) {
  // Prepare data for meal type radar chart
  const mealTypeData = [
    { name: 'Breakfast', value: mealCountByType.BREAKFAST },
    { name: 'Lunch', value: mealCountByType.LUNCH },
    { name: 'Dinner', value: mealCountByType.DINNER },
  ];
  
  // Calculate max value for better visualization
  const maxMealTypeValue = Math.max(
    mealCountByType.BREAKFAST,
    mealCountByType.LUNCH,
    mealCountByType.DINNER
  );
  
  // Calculate max value for days of week
  const maxDayValue = Math.max(...mealsByDay.map(day => day.count));
  
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-primary py-4">
        <div className="container mx-auto px-4">
          <div className="flex items-center">
            <Link href="/dashboard" className="flex items-center text-primary hover:text-primary/80 transition-colors">
              <ChevronLeft size={20} />
              <span>Back to Dashboard</span>
            </Link>
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
      </main>
    </div>
  );
} 