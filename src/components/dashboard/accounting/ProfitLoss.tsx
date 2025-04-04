"use client";

import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend 
} from "recharts";
import { Button } from "@/components/ui/button";
import { Download, Calendar } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export type ProfitLossCategory = {
  id: string;
  name: string;
  amount: number;
  type: "revenue" | "expense";
};

export type ProfitLossData = {
  totalRevenue: number;
  totalExpenses: number;
  netIncome: number;
  revenueCategories?: { name: string; value: number; }[];
  expenseCategories?: { name: string; value: number; }[];
  monthlyData: {
    month: string;
    revenue: number;
    expenses: number;
    profit: number;
  }[];
  period?: string;
  startDate?: Date;
  endDate?: Date;
  previousPeriod?: {
    totalRevenue: number;
    totalExpenses: number;
    netIncome: number;
  };
  changes?: {
    revenueChange: number;
    expensesChange: number;
    netIncomeChange: number;
  };
};

interface ProfitLossProps {
  data?: ProfitLossData;
  period: "month" | "quarter" | "year";
}

const ProfitLoss: React.FC<ProfitLossProps> = ({ data, period }) => {
  const defaultData: ProfitLossData = {
    totalRevenue: 0,
    totalExpenses: 0,
    netIncome: 0,
    revenueCategories: [],
    expenseCategories: [],
    monthlyData: [],
    previousPeriod: {
      totalRevenue: 0,
      totalExpenses: 0,
      netIncome: 0
    },
    changes: {
      revenueChange: 0,
      expensesChange: 0,
      netIncomeChange: 0
    }
  };
  
  const safeData: ProfitLossData = {
    totalRevenue: data?.totalRevenue || defaultData.totalRevenue,
    totalExpenses: data?.totalExpenses || defaultData.totalExpenses,
    netIncome: data?.netIncome || defaultData.netIncome,
    revenueCategories: data?.revenueCategories || defaultData.revenueCategories,
    expenseCategories: data?.expenseCategories || defaultData.expenseCategories,
    monthlyData: data?.monthlyData || defaultData.monthlyData,
    previousPeriod: {
      totalRevenue: data?.previousPeriod?.totalRevenue || defaultData.previousPeriod?.totalRevenue || 0,
      totalExpenses: data?.previousPeriod?.totalExpenses || defaultData.previousPeriod?.totalExpenses || 0,
      netIncome: data?.previousPeriod?.netIncome || defaultData.previousPeriod?.netIncome || 0
    },
    changes: {
      revenueChange: data?.changes?.revenueChange || defaultData.changes?.revenueChange || 0,
      expensesChange: data?.changes?.expensesChange || defaultData.changes?.expensesChange || 0,
      netIncomeChange: data?.changes?.netIncomeChange || defaultData.changes?.netIncomeChange || 0
    }
  };
  
  const periodLabel = {
    month: "Monthly",
    quarter: "Quarterly",
    year: "Annual"
  }[period];
  
  return (
    <Card className="shadow-sm">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Profit &amp; Loss Statement</CardTitle>
            <CardDescription>{periodLabel} overview of revenues and expenses</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <Calendar className="mr-2 h-4 w-4" />
              {new Date().toLocaleString('default', { month: 'long' })}
            </Button>
            <Button variant="outline" size="sm">
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="summary" className="space-y-4">
          <TabsList>
            <TabsTrigger value="summary">Summary</TabsTrigger>
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="chart">Chart</TabsTrigger>
          </TabsList>
          
          <TabsContent value="summary" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Total Revenue</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">${safeData.totalRevenue.toFixed(2)}</div>
                  <p className="text-sm text-muted-foreground">
                    {(safeData.changes?.revenueChange || 0) >= 0 ? "+" : ""}
                    {Math.abs(safeData.changes?.revenueChange || 0).toFixed(1)}% from previous period
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Total Expenses</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-600">${safeData.totalExpenses.toFixed(2)}</div>
                  <p className="text-sm text-muted-foreground">
                    {(safeData.changes?.expensesChange || 0) < 0 ? "-" : "+"}
                    {Math.abs(safeData.changes?.expensesChange || 0).toFixed(1)}% from previous period
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Net Income</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className={`text-2xl font-bold ${safeData.netIncome >= 0 ? "text-green-600" : "text-red-600"}`}>
                    ${safeData.netIncome.toFixed(2)}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {((safeData.netIncome / Math.max(safeData.totalRevenue, 1)) * 100).toFixed(1)}% profit margin
                  </p>
                </CardContent>
              </Card>
            </div>
            
            <div className="mt-6">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={safeData.monthlyData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(value) => `$${Number(value).toFixed(2)}`} />
                  <Legend />
                  <Bar dataKey="revenue" name="Revenue" fill="#10b981" />
                  <Bar dataKey="expenses" name="Expenses" fill="#ef4444" />
                  <Bar dataKey="profit" name="Profit" fill="#6366f1" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>
          
          <TabsContent value="details">
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium mb-2">Revenue</h3>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Category</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                        <TableHead className="text-right">% of Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {safeData.revenueCategories?.map((item) => (
                        <TableRow key={item.name}>
                          <TableCell>{item.name}</TableCell>
                          <TableCell className="text-right">${item.value.toFixed(2)}</TableCell>
                          <TableCell className="text-right">
                            {((item.value / Math.max(safeData.totalRevenue, 1)) * 100).toFixed(1)}%
                          </TableCell>
                        </TableRow>
                      ))}
                      <TableRow className="font-medium">
                        <TableCell>Total Revenue</TableCell>
                        <TableCell className="text-right">${safeData.totalRevenue.toFixed(2)}</TableCell>
                        <TableCell className="text-right">100%</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-medium mb-2">Expenses</h3>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Category</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                        <TableHead className="text-right">% of Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {safeData.expenseCategories?.map((item) => (
                        <TableRow key={item.name}>
                          <TableCell>{item.name}</TableCell>
                          <TableCell className="text-right">${item.value.toFixed(2)}</TableCell>
                          <TableCell className="text-right">
                            {((item.value / Math.max(safeData.totalExpenses, 1)) * 100).toFixed(1)}%
                          </TableCell>
                        </TableRow>
                      ))}
                      <TableRow className="font-medium">
                        <TableCell>Total Expenses</TableCell>
                        <TableCell className="text-right">${safeData.totalExpenses.toFixed(2)}</TableCell>
                        <TableCell className="text-right">100%</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              </div>
              
              <div className="pt-4 border-t">
                <div className="flex justify-between items-center font-medium text-lg">
                  <span>Net Income</span>
                  <span className={safeData.netIncome >= 0 ? "text-green-600" : "text-red-600"}>
                    ${safeData.netIncome.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="chart">
            <div className="space-y-6">
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={safeData.monthlyData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(value) => `$${Number(value).toFixed(2)}`} />
                  <Legend />
                  <Bar dataKey="revenue" name="Revenue" fill="#10b981" />
                  <Bar dataKey="expenses" name="Expenses" fill="#ef4444" />
                  <Bar dataKey="profit" name="Profit" fill="#6366f1" />
                </BarChart>
              </ResponsiveContainer>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Revenue Breakdown</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={200}>
                      <BarChart 
                        data={safeData.revenueCategories || []} 
                        layout="vertical" 
                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" />
                        <YAxis type="category" dataKey="name" width={100} />
                        <Tooltip formatter={(value) => `$${Number(value).toFixed(2)}`} />
                        <Bar dataKey="value" fill="#10b981" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Expense Breakdown</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={200}>
                      <BarChart 
                        data={safeData.expenseCategories || []} 
                        layout="vertical" 
                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" />
                        <YAxis type="category" dataKey="name" width={100} />
                        <Tooltip formatter={(value) => `$${Number(value).toFixed(2)}`} />
                        <Bar dataKey="value" fill="#ef4444" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default ProfitLoss;
