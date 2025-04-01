"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

// Mock data for cash flow projection
const data = [
  { name: "June", actual: 25000, projected: 25000 },
  { name: "July", actual: 28500, projected: 28500 },
  { name: "August", actual: null, projected: 27000 },
  { name: "September", actual: null, projected: 31000 },
  { name: "October", actual: null, projected: 33500 },
];

const CashFlowChart = () => {
  return (
    <div className="h-[250px]">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={data}
          margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
        >
          <defs>
            <linearGradient id="colorActual" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1} />
            </linearGradient>
            <linearGradient id="colorProjected" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#64748b" stopOpacity={0.5} />
              <stop offset="95%" stopColor="#64748b" stopOpacity={0.1} />
            </linearGradient>
          </defs>
          <CartesianGrid
            strokeDasharray="3 3"
            vertical={false}
            stroke="#f0f0f0"
          />
          <XAxis dataKey="name" />
          <YAxis tickFormatter={(value: number) => `$${value / 1000}k`} width={60} />
          <Tooltip
            formatter={(value: string | number | Array<string | number>) => {
              if (typeof value === 'number') {
                return [`$${value.toLocaleString()}`, ""];
              }
              return [String(value), ""];
            }}
            contentStyle={{
              backgroundColor: "rgba(255, 255, 255, 0.8)",
              borderRadius: "0.375rem",
              border: "1px solid #e2e8f0",
            }}
          />
          <Legend />
          <Area
            type="monotone"
            dataKey="actual"
            stroke="#3b82f6"
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#colorActual)"
            name="Actual"
          />
          <Area
            type="monotone"
            dataKey="projected"
            stroke="#64748b"
            strokeDasharray="5 5"
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#colorProjected)"
            name="Projected"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export default CashFlowChart;
