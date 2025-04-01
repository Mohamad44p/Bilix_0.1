"use client";
import { useEffect, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

// Mock data for the chart
const generateMockData = (type: string, timeframe: string) => {
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  const dataPoints =
    timeframe === "7d"
      ? 7
      : timeframe === "30d"
      ? 6
      : timeframe === "90d"
      ? 12
      : 12;

  return Array.from({ length: dataPoints }).map((_, index) => {
    const revenue = 15000 + Math.random() * 10000;
    const expenses = 8000 + Math.random() * 5000;

    return {
      name: timeframe === "7d" ? `Day ${index + 1}` : months[index % 12],
      revenue: Math.round(revenue),
      expenses: Math.round(expenses),
      profit: Math.round(revenue - expenses),
    };
  });
};

interface ChartDataPoint {
  name: string;
  revenue: number;
  expenses: number;
  profit: number;
}

interface OverviewChartProps {
  timeframe: string;
  type: "revenue" | "expenses" | "combined";
}

const OverviewChart = ({ timeframe, type }: OverviewChartProps) => {
  const [data, setData] = useState<ChartDataPoint[]>([]);

  useEffect(() => {
    // Generate mock data based on timeframe
    setData(generateMockData(type, timeframe));
  }, [timeframe, type]);

  return (
    <div className="h-[300px] w-full px-4">
      <ResponsiveContainer width="100%" height="100%">
        {type === "combined" ? (
          <BarChart
            data={data}
            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              vertical={false}
              stroke="#f0f0f0"
            />
            <XAxis dataKey="name" />
            <YAxis tickFormatter={(value) => `$${value / 1000}k`} width={60} />
            <Tooltip
              formatter={(value: string | number | Array<string | number>) => {
                if (typeof value === 'number') {
                  return [`$${value.toLocaleString()}`, ""];
                }
                return [String(value), ""]; // Fallback for other types
              }}
              contentStyle={{
                backgroundColor: "rgba(255, 255, 255, 0.8)",
                borderRadius: "0.375rem",
                border: "1px solid #e2e8f0",
              }}
            />
            <Legend />
            <Bar
              dataKey="revenue"
              fill="#3b82f6"
              name="Revenue"
              radius={[4, 4, 0, 0]}
            />
            <Bar
              dataKey="expenses"
              fill="#ef4444"
              name="Expenses"
              radius={[4, 4, 0, 0]}
            />
            <Bar
              dataKey="profit"
              fill="#22c55e"
              name="Profit"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        ) : (
          <AreaChart
            data={data}
            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
          >
            <defs>
              <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1} />
              </linearGradient>
              <linearGradient id="colorExpenses" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#ef4444" stopOpacity={0.1} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              vertical={false}
              stroke="#f0f0f0"
            />
            <XAxis dataKey="name" />
            <YAxis tickFormatter={(value) => `$${value / 1000}k`} width={60} />
            <Tooltip
              formatter={(value: string | number | Array<string | number>) => {
                if (typeof value === 'number') {
                  return [`$${value.toLocaleString()}`, ""];
                }
                return [String(value), ""]; // Fallback for other types
              }}
              contentStyle={{
                backgroundColor: "rgba(255, 255, 255, 0.8)",
                borderRadius: "0.375rem",
                border: "1px solid #e2e8f0",
              }}
            />
            <Legend />
            {type === "revenue" && (
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="#3b82f6"
                fillOpacity={1}
                fill="url(#colorRevenue)"
                name="Revenue"
              />
            )}
            {type === "expenses" && (
              <Area
                type="monotone"
                dataKey="expenses"
                stroke="#ef4444"
                fillOpacity={1}
                fill="url(#colorExpenses)"
                name="Expenses"
              />
            )}
          </AreaChart>
        )}
      </ResponsiveContainer>
    </div>
  );
};

export default OverviewChart;
