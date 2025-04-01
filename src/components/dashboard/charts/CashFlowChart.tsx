"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { ApexOptions } from "apexcharts";

// Dynamically import ApexCharts to avoid SSR issues
const ReactApexChart = dynamic(() => import("react-apexcharts"), { ssr: false });

type ChartDataPoint = {
  x: string;
  y: number;
};

type ChartSeries = {
  name: string;
  data: ChartDataPoint[];
};

interface CashFlowChartProps {
  projectionData: ChartSeries[];
}

export default function CashFlowChart({ projectionData }: CashFlowChartProps) {
  const [chartOptions, setChartOptions] = useState<ApexOptions>({});
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);

    setChartOptions({
      chart: {
        type: 'bar',
        height: 350,
        stacked: true,
        toolbar: {
          show: false
        },
        zoom: {
          enabled: false
        },
        fontFamily: 'inherit',
      },
      colors: ['#22c55e', '#ef4444'],
      plotOptions: {
        bar: {
          horizontal: false,
          borderRadius: 5,
          columnWidth: '60%',
        },
      },
      dataLabels: {
        enabled: false
      },
      stroke: {
        width: 2,
        colors: ['transparent']
      },
      grid: {
        borderColor: '#f1f1f1',
        row: {
          colors: ['transparent', 'transparent'],
          opacity: 0.5
        },
      },
      xaxis: {
        categories: projectionData[0]?.data.map((d: ChartDataPoint) => {
          // Convert YYYY-MM to Month YYYY
          const [year, month] = d.x.split('-');
          const monthName = new Date(parseInt(year), parseInt(month) - 1, 1)
            .toLocaleDateString('en-US', { month: 'long' });
          return `${monthName} ${year}`;
        }) || [],
        axisBorder: {
          show: false,
        },
        axisTicks: {
          show: false,
        }
      },
      yaxis: {
        labels: {
          formatter: function(value: number) {
            return '$' + value.toLocaleString();
          }
        },
      },
      tooltip: {
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
      },
      fill: {
        opacity: 1
      }
    });
  }, [projectionData]);

  // Format data for the chart
  const formatChartData = () => {
    if (!projectionData || projectionData.length === 0) return [];
    
    return projectionData.map(series => ({
      name: series.name,
      data: series.data.map((point: ChartDataPoint) => point.y)
    }));
  };

  // Don't render the chart on the server side
  if (!mounted) {
    return (
      <div className="h-[350px] w-full flex items-center justify-center bg-muted/20">
        <p className="text-muted-foreground">Loading chart...</p>
      </div>
    );
  }

  return (
    <div className="h-[350px]">
      {projectionData && projectionData.length > 0 ? (
        <ReactApexChart
          options={chartOptions}
          series={formatChartData()}
          type="bar"
          height={350}
        />
      ) : (
        <div className="h-full w-full flex items-center justify-center">
          <p className="text-muted-foreground">No projection data available</p>
        </div>
      )}
    </div>
  );
}
