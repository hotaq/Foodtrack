'use client';

import { useState } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine
} from 'recharts';

interface DataPoint {
  name: string;
  value: number | null;
}

interface AreaChartConnectNullsProps {
  data: DataPoint[];
  title: string;
  color?: string;
  gradientStart?: string;
  gradientEnd?: string;
  connectNulls?: boolean;
  showAverage?: boolean;
}

export default function AreaChartConnectNulls({ 
  data, 
  title, 
  color = "#8884d8", 
  gradientStart = "#8884d8",
  gradientEnd = "rgba(136, 132, 216, 0.1)",
  connectNulls = true,
  showAverage = true
}: AreaChartConnectNullsProps) {
  const [showConnectNulls, setShowConnectNulls] = useState(connectNulls);
  
  // Calculate average value (excluding nulls)
  const validValues = data.filter(item => item.value !== null).map(item => item.value as number);
  const average = validValues.length > 0 
    ? validValues.reduce((sum, val) => sum + val, 0) / validValues.length 
    : 0;
  
  // Find min and max for better Y axis display
  const minValue = Math.min(...validValues, 0);
  const maxValue = Math.max(...validValues, 3); // At least 3 for meal tracking
  
  // Calculate domain with some padding
  const yDomain = [
    Math.floor(minValue - 0.5), 
    Math.ceil(maxValue + 0.5)
  ];

  return (
    <div className="bg-card p-6 rounded-lg vintage-border">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold vintage-text">{title}</h2>
        <div className="flex items-center space-x-2">
          <label className="flex items-center space-x-2 text-sm">
            <input
              type="checkbox"
              checked={showConnectNulls}
              onChange={() => setShowConnectNulls(!showConnectNulls)}
              className="rounded border-gray-400 text-primary focus:ring-primary"
            />
            <span>Connect gaps</span>
          </label>
        </div>
      </div>
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data}
            margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
          >
            <defs>
              <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={gradientStart} stopOpacity={0.8}/>
                <stop offset="95%" stopColor={gradientEnd} stopOpacity={0.2}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="name" 
              tick={{ fontSize: 12 }}
              interval="preserveStartEnd"
            />
            <YAxis 
              domain={yDomain}
              tick={{ fontSize: 12 }}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#1e1e1e', 
                border: '1px solid #333',
                color: '#fff'
              }}
              formatter={(value) => [value === null ? 'No data' : value, title]}
            />
            <Legend />
            <Area 
              type="monotone" 
              dataKey="value" 
              stroke={color} 
              fill="url(#colorGradient)"
              activeDot={{ r: 8 }} 
              strokeWidth={2}
              name={title}
              connectNulls={showConnectNulls}
            />
            {showAverage && (
              <ReferenceLine 
                y={average} 
                stroke="#ff7300" 
                strokeDasharray="3 3"
                label={{ 
                  value: `Avg: ${average.toFixed(1)}`, 
                  position: 'insideBottomRight',
                  fill: '#ff7300',
                  fontSize: 12
                }}
              />
            )}
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <p className="text-xs text-center text-gray-400 mt-2">
        Toggle "Connect gaps" to show/hide connections across missing data points
      </p>
    </div>
  );
} 