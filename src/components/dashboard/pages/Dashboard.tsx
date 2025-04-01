"use client";

import { useState } from "react";
import { 
  BarChart3, Sparkles, TrendingUp , ArrowRight, 
  ArrowDown, ArrowUp, AlertTriangle, Clock, Filter, CalendarDays 
} from "lucide-react";
import { 
  Card, CardContent, CardDescription, CardHeader, CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { 
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, 
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import DashboardLayout from "@/components/layout/DashboardLayout";
import OverviewChart from "../charts/OverviewChart";
import AiInsights from "../charts/AiInsights";
import CashFlowChart from "../charts/CashFlowChart";
import RecentInvoices from "../charts/RecentInvoices";
import { Invoice } from "@/lib/types";

interface DashboardProps {
  invoices: Invoice[];
}

const Dashboard = ({ invoices }: DashboardProps) => {
  const [timeframe, setTimeframe] = useState("30d");

  const totalInvoicesAmount = invoices.reduce((total, invoice) => {
    return total + (invoice.amount || 0);
  }, 0);

  const outstandingInvoices = invoices.filter(
    (invoice) => invoice.status === "PENDING" || invoice.status === "OVERDUE"
  );
  
  const outstandingAmount = outstandingInvoices.reduce((total, invoice) => {
    return total + (invoice.amount || 0);
  }, 0);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
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
              <DropdownMenuItem onClick={() => setTimeframe("7d")}>Last 7 days</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTimeframe("30d")}>Last 30 days</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTimeframe("90d")}>Last 90 days</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTimeframe("1y")}>Last year</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
          <Button className="hidden sm:flex">
            <BarChart3 className="mr-2 h-4 w-4" /> Generate Report
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        <Card className="bg-card text-card-foreground shadow-sm transition-all hover:shadow-md">
          <CardHeader className="p-4 pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Invoices</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="flex items-end justify-between">
              <div>
                <p className="text-2xl font-bold">{formatCurrency(totalInvoicesAmount)}</p>
                <div className="flex items-center mt-1 text-xs">
                  <Badge variant="outline" className="gap-1 font-normal bg-green-500/10 text-green-500 border-green-500/20">
                    <ArrowUp className="h-3 w-3" />
                    <span>12.5%</span>
                  </Badge>
                  <span className="text-muted-foreground ml-1">vs previous period</span>
                </div>
              </div>
              <div className="h-12 w-16 bg-primary/10 flex items-center justify-center rounded-md">
                <TrendingUp className="h-6 w-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card text-card-foreground shadow-sm transition-all hover:shadow-md">
          <CardHeader className="p-4 pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">Outstanding</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="flex items-end justify-between">
              <div>
                <p className="text-2xl font-bold">{formatCurrency(outstandingAmount)}</p>
                <div className="flex items-center mt-1 text-xs">
                  <Badge variant="outline" className="gap-1 font-normal bg-red-500/10 text-red-500 border-red-500/20">
                    <ArrowDown className="h-3 w-3" />
                    <span>8.2%</span>
                  </Badge>
                  <span className="text-muted-foreground ml-1">vs previous period</span>
                </div>
              </div>
              <div className="h-12 w-16 bg-amber-500/10 flex items-center justify-center rounded-md">
                <Clock className="h-6 w-6 text-amber-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card text-card-foreground shadow-sm transition-all hover:shadow-md">
          <CardHeader className="p-4 pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">Cash Flow</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="flex items-end justify-between">
              <div>
                <p className="text-2xl font-bold">$86,231</p>
                <div className="flex items-center mt-1 text-xs">
                  <Badge variant="outline" className="gap-1 font-normal bg-green-500/10 text-green-500 border-green-500/20">
                    <ArrowUp className="h-3 w-3" />
                    <span>23.1%</span>
                  </Badge>
                  <span className="text-muted-foreground ml-1">vs previous period</span>
                </div>
              </div>
              <div className="h-12 w-16 bg-green-500/10 flex items-center justify-center rounded-md">
                <TrendingUp className="h-6 w-6 text-green-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

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
                  <DropdownMenuLabel>View</DropdownMenuLabel>
                  <DropdownMenuItem>Revenue only</DropdownMenuItem>
                  <DropdownMenuItem>Expenses only</DropdownMenuItem>
                  <DropdownMenuItem>Net cash flow</DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>All data</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </CardHeader>
            <CardContent className="p-0">
              <Tabs defaultValue="revenue">
                <div className="px-6">
                  <TabsList className="grid w-full max-w-[400px] grid-cols-3">
                    <TabsTrigger value="revenue">Revenue</TabsTrigger>
                    <TabsTrigger value="expenses">Expenses</TabsTrigger>
                    <TabsTrigger value="combined">Combined</TabsTrigger>
                  </TabsList>
                </div>
                <TabsContent value="revenue" className="pt-2">
                  <OverviewChart timeframe={timeframe} type="revenue" />
                </TabsContent>
                <TabsContent value="expenses" className="pt-2">
                  <OverviewChart timeframe={timeframe} type="expenses" />
                </TabsContent>
                <TabsContent value="combined" className="pt-2">
                  <OverviewChart timeframe={timeframe} type="combined" />
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
                <Badge className="bg-primary/10 text-primary hover:bg-primary/15">AI-Powered</Badge>
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
              <CashFlowChart />
            </CardContent>
          </Card>
        </div>
        
        <div>
          <Card className="h-full flex flex-col shadow-sm transition-all hover:shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center">
                <AlertTriangle className="h-4 w-4 mr-2 text-amber-500" />
                Financial Alerts
              </CardTitle>
              <CardDescription>Issues requiring your attention</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg p-4 bg-amber-500/10 border border-amber-500/20 transition-all hover:bg-amber-500/15">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-sm">Cash Flow Warning</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Projected cash flow for August shows potential shortfall of $12,500.
                    </p>
                    <Button variant="link" size="sm" className="h-auto p-0 mt-1 text-amber-500">
                      View projection
                    </Button>
                  </div>
                </div>
              </div>
              
              <div className="rounded-lg p-4 bg-red-500/10 border border-red-500/20 transition-all hover:bg-red-500/15">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-sm">Overdue Invoices</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      3 invoices totaling $8,750 are overdue by more than 30 days.
                    </p>
                    <Button variant="link" size="sm" className="h-auto p-0 mt-1 text-red-500">
                      View invoices
                    </Button>
                  </div>
                </div>
              </div>
              
              <div className="rounded-lg p-4 bg-primary/10 border border-primary/20 transition-all hover:bg-primary/15">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-sm">Unusual Expense</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Detected unusual expense to &quot;Digital Services Inc.&quot; for $4,250.
                    </p>
                    <Button variant="link" size="sm" className="h-auto p-0 mt-1 text-primary">
                      Review expense
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
            <div className="p-4 mt-auto border-t border-border/50">
              <Button variant="outline" size="sm" className="w-full">
                View all alerts
              </Button>
            </div>
          </Card>
        </div>
      </div>

      <div className="mb-6">
        <Card className="shadow-sm transition-all hover:shadow-md">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Recent Activity</CardTitle>
              <Button variant="outline" size="sm">
                View all
              </Button>
            </div>
            <CardDescription>Recent invoices and financial activities</CardDescription>
          </CardHeader>
          <CardContent>
            <RecentInvoices />
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;