"use client";
import { Card } from "@/components/ui/card";
import { TimeframeOption } from "@/lib/actions/dashboard";
import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { ApexOptions } from "apexcharts";

// Dynamically import ApexCharts to avoid SSR issues
const ReactApexChart = dynamic(() => import("react-apexcharts"), { ssr: false });

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

type ChartDataPoint = {
  x: string;
  y: number;
};

type ChartSeries = {
  name: string;
  data: ChartDataPoint[];
};

interface OverviewChartProps {
  timeframe: TimeframeOption;
  type: "revenue" | "expenses" | "combined";
  chartData: ChartSeries[];
}

export default function OverviewChart({ 
  timeframe, 
  type,
  chartData
}: OverviewChartProps) {
  const [chartOptions, setChartOptions] = useState<ApexOptions>({});
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);

    // Configure chart options
    setChartOptions({
      chart: {
        type: 'area',
        height: 350,
        toolbar: {
          show: false
        },
        zoom: {
          enabled: false
        },
        fontFamily: 'inherit',
      },
      colors: ['#2563eb', '#ef4444', '#10b981'],
      dataLabels: {
        enabled: false
      },
      stroke: {
        curve: 'smooth',
        width: 2
      },
      fill: {
        type: 'gradient',
        gradient: {
          shadeIntensity: 1,
          opacityFrom: 0.3,
          opacityTo: 0.1,
          stops: [0, 95, 100]
        }
      },
      grid: {
        borderColor: '#f1f1f1',
        row: {
          colors: ['transparent', 'transparent'],
          opacity: 0.5
        },
      },
      markers: {
        size: 4,
        colors: ["#2563eb", "#ef4444", "#10b981"],
        strokeColors: "#fff",
        strokeWidth: 2,
        hover: {
          size: 6,
        }
      },
      xaxis: {
        type: 'category',
        tickAmount: 6,
        tooltip: {
          enabled: false
        }
      },
      yaxis: {
        labels: {
          formatter: function(value: number) {
            return '$' + value.toLocaleString();
          }
        }
      },
      tooltip: {
        x: {
          format: timeframe === "1y" ? 'MMM yyyy' : 'dd MMM yyyy'
        },
        y: {
          formatter: function(value: number) {
            return '$' + value.toLocaleString();
          }
        }
      },
      legend: {
        position: 'top',
        horizontalAlign: 'right',
        offsetY: -15
      }
    });
  }, [timeframe, type]);

  // Format the chart data based on the timeframe
  const formatXAxisLabels = () => {
    if (!chartData || !chartData[0]?.data) return [];
    
    return chartData.map(series => ({
      ...series,
      data: series.data.map((point: ChartDataPoint) => {
        // Format date labels based on timeframe
        let label = point.x;
        
        if (timeframe === "7d" || timeframe === "30d") {
          // For daily data, format as "Jan 1"
          const date = new Date(point.x);
          label = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        } else if (timeframe === "90d" && point.x.includes("W")) {
          // For weekly data, format as "Week 1, Jan"
          const [year, month, week] = point.x.split(/[-W]/);
          const monthName = new Date(parseInt(year), parseInt(month) - 1, 1)
            .toLocaleDateString('en-US', { month: 'short' });
          label = `Week ${week}, ${monthName}`;
        } else if (timeframe === "1y") {
          // For monthly data, format as "Jan 2023"
          const [year, month] = point.x.split('-');
          const monthName = new Date(parseInt(year), parseInt(month) - 1, 1)
            .toLocaleDateString('en-US', { month: 'short' });
          label = `${monthName} ${year}`;
        }
        
        return {
          x: label,
          y: point.y
        };
      })
    }));
  };

  // Don't render the chart on the server side
  if (!mounted) {
    return (
      <div className="h-[400px] w-full flex items-center justify-center bg-muted/20">
        <p className="text-muted-foreground">Loading chart...</p>
      </div>
    );
  }

  return (
    <div className="pt-4 px-4 h-[400px]">
      {chartData && chartData.length > 0 ? (
        <ReactApexChart
          options={chartOptions}
          series={formatXAxisLabels()}
          type="area"
          height={350}
        />
      ) : (
        <div className="h-[350px] w-full flex items-center justify-center">
          <p className="text-muted-foreground">No data available for the selected period</p>
        </div>
      )}
    </div>
  );
}
