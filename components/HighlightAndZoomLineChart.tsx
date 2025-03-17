'use client';

import { useState, useCallback } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceArea,
  ReferenceLine
} from 'recharts';

interface DataPoint {
  name: string;
  value: number;
}

interface HighlightAndZoomLineChartProps {
  data: DataPoint[];
  title: string;
  color?: string;
}

export default function HighlightAndZoomLineChart({ 
  data, 
  title, 
  color = "#8884d8" 
}: HighlightAndZoomLineChartProps) {
  const [left, setLeft] = useState<string | null>(null);
  const [right, setRight] = useState<string | null>(null);
  const [refAreaLeft, setRefAreaLeft] = useState<string>('');
  const [refAreaRight, setRefAreaRight] = useState<string>('');
  const [top, setTop] = useState<number | 'auto'>('auto');
  const [bottom, setBottom] = useState<number | 'auto'>('auto');
  const [zoomedData, setZoomedData] = useState<DataPoint[]>(data);

  const getAxisYDomain = useCallback((from: string, to: string, ref: string, offset: number) => {
    const refIndex = data.findIndex(d => d.name === ref);
    let [bottom, top] = [
      data[refIndex].value,
      data[refIndex].value,
    ];
    
    const fromIndex = data.findIndex(d => d.name === from);
    const toIndex = data.findIndex(d => d.name === to);
    
    for (let i = fromIndex; i <= toIndex; i++) {
      if (i >= 0 && i < data.length) {
        if (data[i].value > top) top = data[i].value;
        if (data[i].value < bottom) bottom = data[i].value;
      }
    }

    return [(bottom | 0) - offset, (top | 0) + offset];
  }, [data]);

  const zoom = () => {
    if (refAreaLeft === refAreaRight || refAreaRight === '') {
      setRefAreaLeft('');
      setRefAreaRight('');
      return;
    }

    // Ensure left is always less than right
    const leftIndex = data.findIndex(d => d.name === refAreaLeft);
    const rightIndex = data.findIndex(d => d.name === refAreaRight);

    if (leftIndex > rightIndex) {
      setRefAreaLeft(refAreaRight);
      setRefAreaRight(refAreaLeft);
    }

    // Calculate new domain
    const [newBottom, newTop] = getAxisYDomain(refAreaLeft, refAreaRight, refAreaLeft, 1);
    
    // Filter data for zoom
    const startIndex = data.findIndex(d => d.name === refAreaLeft);
    const endIndex = data.findIndex(d => d.name === refAreaRight);
    const newData = data.slice(
      Math.min(startIndex, endIndex),
      Math.max(startIndex, endIndex) + 1
    );

    setZoomedData(newData.length > 1 ? newData : data);
    setRefAreaLeft('');
    setRefAreaRight('');
    setLeft(refAreaLeft);
    setRight(refAreaRight);
    setBottom(newBottom);
    setTop(newTop);
  };

  const zoomOut = () => {
    setZoomedData(data);
    setRefAreaLeft('');
    setRefAreaRight('');
    setLeft(null);
    setRight(null);
    setTop('auto');
    setBottom('auto');
  };

  const onMouseDown = (e: any) => {
    if (!e || !e.activeLabel) return;
    setRefAreaLeft(e.activeLabel);
  };

  const onMouseMove = (e: any) => {
    if (!e || !e.activeLabel) return;
    if (refAreaLeft) setRefAreaRight(e.activeLabel);
  };

  return (
    <div className="bg-card p-6 rounded-lg vintage-border">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold vintage-text">{title}</h2>
        {(left || right) && (
          <button 
            className="text-xs px-2 py-1 bg-primary/20 hover:bg-primary/30 rounded-md transition-colors"
            onClick={zoomOut}
          >
            Reset Zoom
          </button>
        )}
      </div>
      <p className="text-xs text-gray-400 mb-2">Click and drag to zoom in</p>
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={zoomedData}
            onMouseDown={onMouseDown}
            onMouseMove={onMouseMove}
            onMouseUp={zoom}
            margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="name" 
              allowDataOverflow 
            />
            <YAxis 
              domain={[bottom, top]} 
              allowDataOverflow 
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#1e1e1e', 
                border: '1px solid #333',
                color: '#fff'
              }}
            />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="value" 
              stroke={color} 
              activeDot={{ r: 8 }} 
              strokeWidth={2}
              name={title}
            />
            {refAreaLeft && refAreaRight && (
              <ReferenceArea 
                x1={refAreaLeft} 
                x2={refAreaRight} 
                strokeOpacity={0.3} 
                fill={color} 
                fillOpacity={0.3} 
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
} 