"use client";

import { useState } from "react";
import { 
  BarChart3, Sparkles, ArrowRight, CalendarDays, Filter
} from "lucide-react";
import { 
  Card, CardContent, CardDescription, CardHeader, CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Invoice, Vendor, Category } from "@prisma/client";
import { 
  DashboardStats as DashboardStatsType, 
  FinancialAlert, 
  TimeframeOption 
} from "@/lib/actions/dashboard";

// Import our smaller components
import OverviewChart from "../charts/OverviewChart";
import AiInsights from "../charts/AiInsights";
import CashFlowChart from "../charts/CashFlowChart";
import RecentInvoices from "../charts/RecentInvoices";
import DashboardStats from "../stats/DashboardStats";
import FinancialAlerts from "../alerts/FinancialAlerts";
import { useRouter } from "next/navigation";

// Types for extended invoice and chart data
interface ExtendedInvoice extends Invoice {
  vendor?: Vendor | null;
  category?: Category | null;
}

type ChartDataPoint = {
  x: string;
  y: number;
};

type ChartSeries = {
  name: string;
  data: ChartDataPoint[];
};

interface DashboardProps {
  timeframe: TimeframeOption;
  invoices: Invoice[];
  dashboardStats: DashboardStatsType;
  financialAlerts: FinancialAlert[];
  revenueOverviewData: ChartSeries[];
  cashFlowProjectionData: ChartSeries[];
  recentInvoices: ExtendedInvoice[];
}

const Dashboard = ({ 
  timeframe: initialTimeframe, 
  dashboardStats,
  financialAlerts,
  revenueOverviewData,
  cashFlowProjectionData,
  recentInvoices
}: DashboardProps) => {
  const [timeframe, setTimeframe] = useState<TimeframeOption>(initialTimeframe);
  const [chartType, setChartType] = useState<"revenue" | "expenses" | "combined">("combined");
  const router = useRouter();

  // Handle timeframe change
  const handleTimeframeChange = (newTimeframe: TimeframeOption) => {
    setTimeframe(newTimeframe);
    // Update the URL to reflect the new timeframe
    router.push(`/dashboard?timeframe=${newTimeframe}`);
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Welcome back! Here&apos;s an overview of your invoices and finances.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-1">
                <CalendarDays className="h-4 w-4" />
                {timeframe === "7d" && "Last 7 days"}
                {timeframe === "30d" && "Last 30 days"}
                {timeframe === "90d" && "Last 90 days"}
                {timeframe === "1y" && "Last year"}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleTimeframeChange("7d")}>
                Last 7 days
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleTimeframeChange("30d")}>
                Last 30 days
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleTimeframeChange("90d")}>
                Last 90 days
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleTimeframeChange("1y")}>
                Last year
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
          <Button className="hidden sm:flex">
            <BarChart3 className="mr-2 h-4 w-4" /> Generate Report
          </Button>
        </div>
      </div>

      {/* Dashboard Stats */}
      <DashboardStats stats={dashboardStats} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-2">
          <Card className="shadow-sm h-full transition-all hover:shadow-md">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Revenue Overview</CardTitle>
                <CardDescription>Income, expenses and net cash flow</CardDescription>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Filter className="h-4 w-4 mr-1" /> Filter
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setChartType("revenue")}>
                    Revenue only
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setChartType("expenses")}>
                    Expenses only
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setChartType("combined")}>
                    All data
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </CardHeader>
            <CardContent className="p-0">
              <Tabs defaultValue={chartType} onValueChange={(value) => 
                setChartType(value as "revenue" | "expenses" | "combined")
              }>
                <div className="px-6">
                  <TabsList className="grid w-full max-w-[400px] grid-cols-3">
                    <TabsTrigger value="revenue">Revenue</TabsTrigger>
                    <TabsTrigger value="expenses">Expenses</TabsTrigger>
                    <TabsTrigger value="combined">Combined</TabsTrigger>
                  </TabsList>
                </div>
                <TabsContent value="revenue" className="pt-2">
                  <OverviewChart 
                    timeframe={timeframe} 
                    type="revenue" 
                    chartData={revenueOverviewData.filter(series => series.name === "Revenue")}
                  />
                </TabsContent>
                <TabsContent value="expenses" className="pt-2">
                  <OverviewChart 
                    timeframe={timeframe} 
                    type="expenses" 
                    chartData={revenueOverviewData.filter(series => series.name === "Expenses")}
                  />
                </TabsContent>
                <TabsContent value="combined" className="pt-2">
                  <OverviewChart 
                    timeframe={timeframe} 
                    type="combined" 
                    chartData={revenueOverviewData}
                  />
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
        
        <div>
          <Card className="h-full flex flex-col shadow-sm transition-all hover:shadow-md bg-card text-card-foreground">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center">
                  <Sparkles className="h-4 w-4 mr-2 text-amber-500" />
                  AI Insights
                </CardTitle>
              </div>
              <CardDescription>Financial analysis & recommendations</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto">
              <AiInsights />
            </CardContent>
            <div className="p-4 pt-0 mt-auto">
              <Button variant="ghost" size="sm" className="w-full hover:bg-primary/5">
                View all insights <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            </div>
          </Card>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-2">
          <Card className="shadow-sm transition-all hover:shadow-md">
            <CardHeader>
              <CardTitle>Cash Flow Projection</CardTitle>
              <CardDescription>Predicted income & expenses for the next 3 months</CardDescription>
            </CardHeader>
            <CardContent>
              <CashFlowChart projectionData={cashFlowProjectionData} />
            </CardContent>
          </Card>
        </div>
        
        <div>
          <FinancialAlerts alerts={financialAlerts} />
        </div>
      </div>

      <div className="mb-6">
        <Card className="shadow-sm transition-all hover:shadow-md">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Recent Activity</CardTitle>
              <Button variant="outline" size="sm" asChild>
                <a href="/dashboard/invoices">View all</a>
              </Button>
            </div>
            <CardDescription>Recent invoices and financial activities</CardDescription>
          </CardHeader>
          <CardContent>
            <RecentInvoices invoices={recentInvoices} />
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;