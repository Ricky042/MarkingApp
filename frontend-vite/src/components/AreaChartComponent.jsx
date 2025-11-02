import React, { useState, useEffect } from 'react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import api from "../utils/axios";

const mockData = [
  { month: "Jan", total: 12 },
  { month: "Feb", total: 18 },
  { month: "Mar", total: 15 },
  { month: "Apr", total: 22 },
  { month: "May", total: 19 },
  { month: "Jun", total: 25 },
];

const AreaChartComponent = ({ teamId,}) => {
  const [chartData, setChartData] = useState(mockData);
  const [isLoading, setIsLoading] = useState(true);



  useEffect(() => {
    const fetchChartData = async () => {
      setIsLoading(true);
      try {
        const token = localStorage.getItem("token");
        console.log("Fetching chart data for team:", teamId);
        
        const res = await api.get(`/team/${teamId}/chart-data`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        console.log("API response:", res.data);
        
        if (res.data && res.data.chartData) {
          console.log("Chart data received");
          setChartData(res.data.chartData);
        } else {
          console.log("No chart data received, using mock data");
          setChartData(mockData);
        }
      } catch (err) {
        console.error("Failed to fetch chart data:", err);
        setChartData(mockData);
      } finally {
        setIsLoading(false);
      }
    };

    if (teamId) {
      fetchChartData();
    } else {
      setChartData(mockData);
      setIsLoading(false);
    }
  }, [teamId]);

  if (isLoading) {
    return (
      <div className="w-full h-full p-4 flex items-center justify-center">
        <div className="text-gray-500">Loading chart data...</div>
      </div>
    );
  }

  return (
    <div className="w-full h-full p-4">
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart
          data={chartData}
          margin={{
            top: 20,
            right: 30,
            left: 20,
            bottom: 5,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis 
            dataKey="month" 
            stroke="#666"
            fontSize={12}
            tickLine={false}
            axisLine={false}
          />
          <YAxis 
            stroke="#666"
            fontSize={12}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip 
            contentStyle={{
              backgroundColor: 'white',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            }}
            formatter={(value) => [`${value} submissions`, 'Total']}
            labelFormatter={(label) => `Month: ${label}`}
          />
          <Area
            type="monotone"
            dataKey="total"
            stroke="var(--deakinTeal)"
            fill="var(--deakinTeal)"
            fillOpacity={0.2}
            strokeWidth={2}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export default AreaChartComponent;