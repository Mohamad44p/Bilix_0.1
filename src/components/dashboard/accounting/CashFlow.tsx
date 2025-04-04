"use client";

import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend,
  ReferenceLine
} from "recharts";
import { Button } from "@/components/ui/button";
import { Download, Calendar, TrendingUp, TrendingDown, AlertCircle } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export type CashFlowPrediction = {
  date: Date;
  inflow: number;
  outflow: number;
  netFlow: number;
  balance: number;
  inflowSources: {
    id: string;
    name: string;
    amount: number;
    probability: number;
  }[];
  outflowSources: {
    id: string;
    name: string;
    amount: number;
    probability: number;
  }[];
};

export type CashFlowData = {
  predictions: CashFlowPrediction[];
  currentBalance: number;
  projectedEndBalance: number;
  lowestProjectedBalance: number;
  highestProjectedBalance: number;
  riskAssessment: {
    cashShortage: boolean;
    shortageDate?: Date;
    shortageAmount?: number;
    riskLevel: "low" | "medium" | "high";
    recommendations: string[];
  };
};

interface CashFlowProps {
  data: CashFlowData;
  period: "30days" | "60days" | "90days";
}

const CashFlow = ({ data, period }: CashFlowProps) => {
  const chartData = data.predictions.map(prediction => ({
    date: prediction.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    inflow: prediction.inflow,
    outflow: prediction.outflow,
    netFlow: prediction.netFlow,
    balance: prediction.balance
  }));
  
  const periodLabel = {
    "30days": "30 Days",
    "60days": "60 Days",
    "90days": "90 Days"
  }[period];
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount);
  };
  
  const getRiskLevelColor = (level: "low" | "medium" | "high") => {
    return {
      low: "text-green-600 bg-green-50",
      medium: "text-amber-600 bg-amber-50",
      high: "text-red-600 bg-red-50"
    }[level];
  };
  
  return (
    <Card className="shadow-sm">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Cash Flow Forecast</CardTitle>
            <CardDescription>Projected cash flow for the next {periodLabel}</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <Calendar className="mr-2 h-4 w-4" />
              Next {periodLabel}
            </Button>
            <Button variant="outline" size="sm">
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Current Balance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(data.currentBalance)}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Projected End Balance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${data.projectedEndBalance >= data.currentBalance ? "text-green-600" : "text-red-600"}`}>
                {formatCurrency(data.projectedEndBalance)}
                <span className="text-xs ml-1">
                  {data.projectedEndBalance >= data.currentBalance ? (
                    <TrendingUp className="inline h-4 w-4" />
                  ) : (
                    <TrendingDown className="inline h-4 w-4" />
                  )}
                </span>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Lowest Projected Balance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-amber-600">
                {formatCurrency(data.lowestProjectedBalance)}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Risk Level</CardTitle>
            </CardHeader>
            <CardContent>
              <Badge variant="outline" className={`${getRiskLevelColor(data.riskAssessment.riskLevel)}`}>
                {data.riskAssessment.riskLevel.toUpperCase()}
              </Badge>
              {data.riskAssessment.cashShortage && (
                <div className="mt-2 text-xs text-red-600 flex items-center">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  Potential cash shortage on {data.riskAssessment.shortageDate?.toLocaleDateString()}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
        
        <Tabs defaultValue="chart" className="space-y-4">
          <TabsList>
            <TabsTrigger value="chart">Chart</TabsTrigger>
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
          </TabsList>
          
          <TabsContent value="chart" className="space-y-4">
            <div className="rounded-md border p-4">
              <h3 className="text-lg font-medium mb-4">Cash Flow Projection</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                  <Legend />
                  <ReferenceLine y={0} stroke="#000" />
                  <Line type="monotone" dataKey="balance" name="Balance" stroke="#6366f1" strokeWidth={2} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            
            <div className="rounded-md border p-4">
              <h3 className="text-lg font-medium mb-4">Cash Inflows & Outflows</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                  <Legend />
                  <Bar dataKey="inflow" name="Inflow" fill="#10b981" />
                  <Bar dataKey="outflow" name="Outflow" fill="#ef4444" />
                  <Bar dataKey="netFlow" name="Net Flow" fill="#6366f1" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>
          
          <TabsContent value="details">
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Inflow</TableHead>
                    <TableHead className="text-right">Outflow</TableHead>
                    <TableHead className="text-right">Net Flow</TableHead>
                    <TableHead className="text-right">Balance</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.predictions.map((prediction, index) => (
                    <TableRow key={index}>
                      <TableCell>{prediction.date.toLocaleDateString()}</TableCell>
                      <TableCell className="text-right text-green-600">{formatCurrency(prediction.inflow)}</TableCell>
                      <TableCell className="text-right text-red-600">{formatCurrency(prediction.outflow)}</TableCell>
                      <TableCell className={`text-right ${prediction.netFlow >= 0 ? "text-green-600" : "text-red-600"}`}>
                        {formatCurrency(prediction.netFlow)}
                      </TableCell>
                      <TableCell className={`text-right font-medium ${prediction.balance >= 0 ? "" : "text-red-600"}`}>
                        {formatCurrency(prediction.balance)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </TabsContent>
          
          <TabsContent value="recommendations">
            {data.riskAssessment.recommendations.length > 0 ? (
              <div className="space-y-4">
                <div className={`rounded-md border p-4 ${getRiskLevelColor(data.riskAssessment.riskLevel)}`}>
                  <h3 className="text-lg font-medium mb-2">Risk Assessment</h3>
                  <p className="text-sm">
                    {data.riskAssessment.cashShortage 
                      ? `Potential cash shortage of ${formatCurrency(data.riskAssessment.shortageAmount || 0)} on ${data.riskAssessment.shortageDate?.toLocaleDateString()}.` 
                      : "No cash shortages predicted in this period."}
                  </p>
                </div>
                
                <div className="rounded-md border p-4">
                  <h3 className="text-lg font-medium mb-2">AI Recommendations</h3>
                  <ul className="space-y-2">
                    {data.riskAssessment.recommendations.map((recommendation, index) => (
                      <li key={index} className="flex items-start">
                        <span className="mr-2">•</span>
                        <span>{recommendation}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <p>No recommendations available for this period.</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default CashFlow;
