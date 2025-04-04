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
  revenues: ProfitLossCategory[];
  expenses: ProfitLossCategory[];
  totalRevenue: number;
  totalExpenses: number;
  netIncome: number;
  periodComparison: {
    current: { month: string; revenue: number; expenses: number; profit: number };
    previous: { month: string; revenue: number; expenses: number; profit: number };
    changePercent: number;
  };
  monthlyData: {
    month: string;
    revenue: number;
    expenses: number;
    profit: number;
  }[];
};

interface ProfitLossProps {
  data: ProfitLossData;
  period: "month" | "quarter" | "year";
}

const ProfitLoss = ({ data, period }: ProfitLossProps) => {
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
            <CardTitle>Profit & Loss Statement</CardTitle>
            <CardDescription>{periodLabel} overview of revenues and expenses</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <Calendar className="mr-2 h-4 w-4" />
              {data.periodComparison.current.month}
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
                  <div className="text-2xl font-bold text-green-600">${data.totalRevenue.toFixed(2)}</div>
                  <p className="text-sm text-muted-foreground">
                    {data.periodComparison.changePercent >= 0 ? "+" : ""}
                    {data.periodComparison.changePercent.toFixed(1)}% from previous period
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Total Expenses</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-600">${data.totalExpenses.toFixed(2)}</div>
                  <p className="text-sm text-muted-foreground">
                    {data.periodComparison.current.expenses < data.periodComparison.previous.expenses ? "-" : "+"}
                    {Math.abs(((data.periodComparison.current.expenses - data.periodComparison.previous.expenses) / 
                      data.periodComparison.previous.expenses) * 100).toFixed(1)}% from previous period
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Net Income</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className={`text-2xl font-bold ${data.netIncome >= 0 ? "text-green-600" : "text-red-600"}`}>
                    ${data.netIncome.toFixed(2)}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {((data.netIncome / data.totalRevenue) * 100).toFixed(1)}% profit margin
                  </p>
                </CardContent>
              </Card>
            </div>
            
            <div className="mt-6">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={data.monthlyData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
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
                      {data.revenues.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell>{item.name}</TableCell>
                          <TableCell className="text-right">${item.amount.toFixed(2)}</TableCell>
                          <TableCell className="text-right">
                            {((item.amount / data.totalRevenue) * 100).toFixed(1)}%
                          </TableCell>
                        </TableRow>
                      ))}
                      <TableRow className="font-medium">
                        <TableCell>Total Revenue</TableCell>
                        <TableCell className="text-right">${data.totalRevenue.toFixed(2)}</TableCell>
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
                      {data.expenses.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell>{item.name}</TableCell>
                          <TableCell className="text-right">${item.amount.toFixed(2)}</TableCell>
                          <TableCell className="text-right">
                            {((item.amount / data.totalExpenses) * 100).toFixed(1)}%
                          </TableCell>
                        </TableRow>
                      ))}
                      <TableRow className="font-medium">
                        <TableCell>Total Expenses</TableCell>
                        <TableCell className="text-right">${data.totalExpenses.toFixed(2)}</TableCell>
                        <TableCell className="text-right">100%</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              </div>
              
              <div className="pt-4 border-t">
                <div className="flex justify-between items-center font-medium text-lg">
                  <span>Net Income</span>
                  <span className={data.netIncome >= 0 ? "text-green-600" : "text-red-600"}>
                    ${data.netIncome.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="chart">
            <div className="space-y-6">
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={data.monthlyData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
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
                        data={data.revenues} 
                        layout="vertical" 
                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" />
                        <YAxis type="category" dataKey="name" width={100} />
                        <Tooltip formatter={(value) => `$${Number(value).toFixed(2)}`} />
                        <Bar dataKey="amount" fill="#10b981" />
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
                        data={data.expenses} 
                        layout="vertical" 
                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" />
                        <YAxis type="category" dataKey="name" width={100} />
                        <Tooltip formatter={(value) => `$${Number(value).toFixed(2)}`} />
                        <Bar dataKey="amount" fill="#ef4444" />
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
