"use client";

import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Download, Calendar } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export type BalanceSheetItem = {
  id: string;
  name: string;
  amount: number;
  type: "asset" | "liability" | "equity";
  category: string;
};

export type BalanceSheetData = {
  assets: BalanceSheetItem[];
  liabilities: BalanceSheetItem[];
  equity: BalanceSheetItem[];
  totalAssets: number;
  totalLiabilities: number;
  totalEquity: number;
  asOfDate: Date;
  previousPeriod: {
    totalAssets: number;
    totalLiabilities: number;
    totalEquity: number;
    asOfDate: Date;
  };
};

interface BalanceSheetProps {
  data: BalanceSheetData;
}

const BalanceSheet = ({ data }: BalanceSheetProps) => {
  const assetCategories = data.assets.reduce<Record<string, BalanceSheetItem[]>>((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = [];
    }
    acc[item.category].push(item);
    return acc;
  }, {});

  const liabilityCategories = data.liabilities.reduce<Record<string, BalanceSheetItem[]>>((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = [];
    }
    acc[item.category].push(item);
    return acc;
  }, {});

  const assetCategoryTotals = Object.entries(assetCategories).map(([category, items]) => ({
    category,
    total: items.reduce((sum, item) => sum + item.amount, 0)
  }));

  const liabilityCategoryTotals = Object.entries(liabilityCategories).map(([category, items]) => ({
    category,
    total: items.reduce((sum, item) => sum + item.amount, 0)
  }));

  const assetChangePercent = ((data.totalAssets - data.previousPeriod.totalAssets) / data.previousPeriod.totalAssets) * 100;
  const liabilityChangePercent = ((data.totalLiabilities - data.previousPeriod.totalLiabilities) / data.previousPeriod.totalLiabilities) * 100;
  const equityChangePercent = ((data.totalEquity - data.previousPeriod.totalEquity) / data.previousPeriod.totalEquity) * 100;

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Balance Sheet</CardTitle>
            <CardDescription>Financial position as of {data.asOfDate.toLocaleDateString()}</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <Calendar className="mr-2 h-4 w-4" />
              {data.asOfDate.toLocaleDateString()}
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
          </TabsList>
          
          <TabsContent value="summary" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Total Assets</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">${data.totalAssets.toFixed(2)}</div>
                  <p className="text-sm text-muted-foreground">
                    {assetChangePercent >= 0 ? "+" : ""}
                    {assetChangePercent.toFixed(1)}% from previous period
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Total Liabilities</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">${data.totalLiabilities.toFixed(2)}</div>
                  <p className="text-sm text-muted-foreground">
                    {liabilityChangePercent >= 0 ? "+" : ""}
                    {liabilityChangePercent.toFixed(1)}% from previous period
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Total Equity</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">${data.totalEquity.toFixed(2)}</div>
                  <p className="text-sm text-muted-foreground">
                    {equityChangePercent >= 0 ? "+" : ""}
                    {equityChangePercent.toFixed(1)}% from previous period
                  </p>
                </CardContent>
              </Card>
            </div>
            
            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-medium mb-2">Assets by Category</h3>
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
                      {assetCategoryTotals.map((category) => (
                        <TableRow key={category.category}>
                          <TableCell>{category.category}</TableCell>
                          <TableCell className="text-right">${category.total.toFixed(2)}</TableCell>
                          <TableCell className="text-right">
                            {((category.total / data.totalAssets) * 100).toFixed(1)}%
                          </TableCell>
                        </TableRow>
                      ))}
                      <TableRow className="font-medium">
                        <TableCell>Total Assets</TableCell>
                        <TableCell className="text-right">${data.totalAssets.toFixed(2)}</TableCell>
                        <TableCell className="text-right">100%</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-medium mb-2">Liabilities & Equity</h3>
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
                      {liabilityCategoryTotals.map((category) => (
                        <TableRow key={category.category}>
                          <TableCell>{category.category}</TableCell>
                          <TableCell className="text-right">${category.total.toFixed(2)}</TableCell>
                          <TableCell className="text-right">
                            {((category.total / (data.totalLiabilities + data.totalEquity)) * 100).toFixed(1)}%
                          </TableCell>
                        </TableRow>
                      ))}
                      <TableRow>
                        <TableCell>Total Equity</TableCell>
                        <TableCell className="text-right">${data.totalEquity.toFixed(2)}</TableCell>
                        <TableCell className="text-right">
                          {((data.totalEquity / (data.totalLiabilities + data.totalEquity)) * 100).toFixed(1)}%
                        </TableCell>
                      </TableRow>
                      <TableRow className="font-medium">
                        <TableCell>Total Liabilities & Equity</TableCell>
                        <TableCell className="text-right">${(data.totalLiabilities + data.totalEquity).toFixed(2)}</TableCell>
                        <TableCell className="text-right">100%</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="details" className="space-y-6">
            <div>
              <h3 className="text-lg font-medium mb-2">Assets</h3>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Item</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.assets.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>{item.name}</TableCell>
                        <TableCell>{item.category}</TableCell>
                        <TableCell className="text-right">${item.amount.toFixed(2)}</TableCell>
                      </TableRow>
                    ))}
                    <TableRow className="font-medium">
                      <TableCell colSpan={2}>Total Assets</TableCell>
                      <TableCell className="text-right">${data.totalAssets.toFixed(2)}</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-medium mb-2">Liabilities</h3>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Item</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.liabilities.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>{item.name}</TableCell>
                        <TableCell>{item.category}</TableCell>
                        <TableCell className="text-right">${item.amount.toFixed(2)}</TableCell>
                      </TableRow>
                    ))}
                    <TableRow className="font-medium">
                      <TableCell colSpan={2}>Total Liabilities</TableCell>
                      <TableCell className="text-right">${data.totalLiabilities.toFixed(2)}</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-medium mb-2">Equity</h3>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Item</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.equity.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>{item.name}</TableCell>
                        <TableCell>{item.category}</TableCell>
                        <TableCell className="text-right">${item.amount.toFixed(2)}</TableCell>
                      </TableRow>
                    ))}
                    <TableRow className="font-medium">
                      <TableCell colSpan={2}>Total Equity</TableCell>
                      <TableCell className="text-right">${data.totalEquity.toFixed(2)}</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </div>
            
            <div className="pt-4 border-t">
              <div className="flex justify-between items-center font-medium text-lg">
                <span>Total Liabilities & Equity</span>
                <span>${(data.totalLiabilities + data.totalEquity).toFixed(2)}</span>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default BalanceSheet;
