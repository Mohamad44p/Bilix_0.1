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
  asOfDate: Date;
  assets: {
    currentAssets: {
      cashAndEquivalents: number;
      accountsReceivable: number;
      inventory: number;
      prepaidExpenses: number;
      total: number;
    };
    fixedAssets: {
      propertyAndEquipment: number;
      accumulatedDepreciation: number;
      total: number;
    };
    totalAssets: number;
  };
  liabilities: {
    currentLiabilities: {
      accountsPayable: number;
      shortTermDebt: number;
      total: number;
    };
    longTermLiabilities: {
      longTermDebt: number;
      total: number;
    };
    totalLiabilities: number;
  };
  equity: {
    ownersEquity: number;
    retainedEarnings: number;
    total: number;
  };
  changes: {
    assetsChange: number;
    liabilitiesChange: number;
    equityChange: number;
  };
  previousPeriod: {
    totalAssets: number;
    totalLiabilities: number;
    equity: number;
  };
};

interface BalanceSheetProps {
  data: BalanceSheetData;
}

const BalanceSheet = ({ data }: BalanceSheetProps) => {
  const assetCategories = {
    "Current Assets": [
      { id: "cash", name: "Cash & Equivalents", amount: data.assets.currentAssets.cashAndEquivalents, category: "Current Assets" },
      { id: "ar", name: "Accounts Receivable", amount: data.assets.currentAssets.accountsReceivable, category: "Current Assets" },
      { id: "inventory", name: "Inventory", amount: data.assets.currentAssets.inventory, category: "Current Assets" },
      { id: "prepaid", name: "Prepaid Expenses", amount: data.assets.currentAssets.prepaidExpenses, category: "Current Assets" }
    ],
    "Fixed Assets": [
      { id: "ppe", name: "Property & Equipment", amount: data.assets.fixedAssets.propertyAndEquipment, category: "Fixed Assets" },
      { id: "accum-dep", name: "Accumulated Depreciation", amount: data.assets.fixedAssets.accumulatedDepreciation, category: "Fixed Assets" }
    ]
  };

  const liabilityCategories = {
    "Current Liabilities": [
      { id: "ap", name: "Accounts Payable", amount: data.liabilities.currentLiabilities.accountsPayable, category: "Current Liabilities" },
      { id: "std", name: "Short-term Debt", amount: data.liabilities.currentLiabilities.shortTermDebt, category: "Current Liabilities" }
    ],
    "Long-term Liabilities": [
      { id: "ltd", name: "Long-term Debt", amount: data.liabilities.longTermLiabilities.longTermDebt, category: "Long-term Liabilities" }
    ]
  };

  const equityItems = [
    { id: "oe", name: "Owner's Equity", amount: data.equity.ownersEquity, category: "Equity" },
    { id: "re", name: "Retained Earnings", amount: data.equity.retainedEarnings, category: "Equity" }
  ];

  const assetCategoryTotals = [
    { category: "Current Assets", total: data.assets.currentAssets.total },
    { category: "Fixed Assets", total: data.assets.fixedAssets.total }
  ];

  const liabilityCategoryTotals = [
    { category: "Current Liabilities", total: data.liabilities.currentLiabilities.total },
    { category: "Long-term Liabilities", total: data.liabilities.longTermLiabilities.total }
  ];

  const assetChangePercent = data.changes.assetsChange;
  const liabilityChangePercent = data.changes.liabilitiesChange;
  const equityChangePercent = data.changes.equityChange;

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
                  <div className="text-2xl font-bold">${data.assets.totalAssets.toFixed(2)}</div>
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
                  <div className="text-2xl font-bold">${data.liabilities.totalLiabilities.toFixed(2)}</div>
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
                  <div className="text-2xl font-bold">${data.equity.total.toFixed(2)}</div>
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
                            {((category.total / data.assets.totalAssets) * 100).toFixed(1)}%
                          </TableCell>
                        </TableRow>
                      ))}
                      <TableRow className="font-medium">
                        <TableCell>Total Assets</TableCell>
                        <TableCell className="text-right">${data.assets.totalAssets.toFixed(2)}</TableCell>
                        <TableCell className="text-right">100%</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-medium mb-2">Liabilities &amp; Equity</h3>
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
                            {((category.total / (data.liabilities.totalLiabilities + data.equity.total)) * 100).toFixed(1)}%
                          </TableCell>
                        </TableRow>
                      ))}
                      <TableRow>
                        <TableCell>Total Equity</TableCell>
                        <TableCell className="text-right">${data.equity.total.toFixed(2)}</TableCell>
                        <TableCell className="text-right">
                          {((data.equity.total / (data.liabilities.totalLiabilities + data.equity.total)) * 100).toFixed(1)}%
                        </TableCell>
                      </TableRow>
                      <TableRow className="font-medium">
                        <TableCell>Total Liabilities &amp; Equity</TableCell>
                        <TableCell className="text-right">${(data.liabilities.totalLiabilities + data.equity.total).toFixed(2)}</TableCell>
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
                    {/* Current Assets */}
                    <TableRow>
                      <TableCell colSpan={2}>Cash &amp; Equivalents</TableCell>
                      <TableCell className="text-right">${data.assets.currentAssets.cashAndEquivalents.toFixed(2)}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell colSpan={2}>Accounts Receivable</TableCell>
                      <TableCell className="text-right">${data.assets.currentAssets.accountsReceivable.toFixed(2)}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell colSpan={2}>Inventory</TableCell>
                      <TableCell className="text-right">${data.assets.currentAssets.inventory.toFixed(2)}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell colSpan={2}>Prepaid Expenses</TableCell>
                      <TableCell className="text-right">${data.assets.currentAssets.prepaidExpenses.toFixed(2)}</TableCell>
                    </TableRow>
                    <TableRow className="border-t">
                      <TableCell colSpan={2} className="font-medium">Total Current Assets</TableCell>
                      <TableCell className="text-right">${data.assets.currentAssets.total.toFixed(2)}</TableCell>
                    </TableRow>
                    
                    {/* Fixed Assets */}
                    <TableRow className="mt-2">
                      <TableCell colSpan={2}>Property &amp; Equipment</TableCell>
                      <TableCell className="text-right">${data.assets.fixedAssets.propertyAndEquipment.toFixed(2)}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell colSpan={2}>Accumulated Depreciation</TableCell>
                      <TableCell className="text-right">${data.assets.fixedAssets.accumulatedDepreciation.toFixed(2)}</TableCell>
                    </TableRow>
                    <TableRow className="border-t">
                      <TableCell colSpan={2} className="font-medium">Total Fixed Assets</TableCell>
                      <TableCell className="text-right">${data.assets.fixedAssets.total.toFixed(2)}</TableCell>
                    </TableRow>
                    <TableRow className="font-medium">
                      <TableCell colSpan={2}>Total Assets</TableCell>
                      <TableCell className="text-right">${data.assets.totalAssets.toFixed(2)}</TableCell>
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
                    {/* Current Liabilities */}
                    <TableRow>
                      <TableCell colSpan={2}>Accounts Payable</TableCell>
                      <TableCell className="text-right">${data.liabilities.currentLiabilities.accountsPayable.toFixed(2)}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell colSpan={2}>Short Term Debt</TableCell>
                      <TableCell className="text-right">${data.liabilities.currentLiabilities.shortTermDebt.toFixed(2)}</TableCell>
                    </TableRow>
                    <TableRow className="border-t">
                      <TableCell colSpan={2} className="font-medium">Total Current Liabilities</TableCell>
                      <TableCell className="text-right">${data.liabilities.currentLiabilities.total.toFixed(2)}</TableCell>
                    </TableRow>
                    
                    {/* Long Term Liabilities */}
                    <TableRow className="mt-2">
                      <TableCell colSpan={2}>Long Term Debt</TableCell>
                      <TableCell className="text-right">${data.liabilities.longTermLiabilities.longTermDebt.toFixed(2)}</TableCell>
                    </TableRow>
                    <TableRow className="border-t">
                      <TableCell colSpan={2} className="font-medium">Total Long Term Liabilities</TableCell>
                      <TableCell className="text-right">${data.liabilities.longTermLiabilities.total.toFixed(2)}</TableCell>
                    </TableRow>
                    <TableRow className="font-medium">
                      <TableCell colSpan={2}>Total Liabilities</TableCell>
                      <TableCell className="text-right">${data.liabilities.totalLiabilities.toFixed(2)}</TableCell>
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
                    {/* Equity Items */}
                    <TableRow>
                      <TableCell colSpan={2}>Owner's Equity</TableCell>
                      <TableCell className="text-right">${data.equity.ownersEquity.toFixed(2)}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell colSpan={2}>Retained Earnings</TableCell>
                      <TableCell className="text-right">${data.equity.retainedEarnings.toFixed(2)}</TableCell>
                    </TableRow>
                    <TableRow className="font-medium">
                      <TableCell colSpan={2}>Total Equity</TableCell>
                      <TableCell className="text-right">${data.equity.total.toFixed(2)}</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </div>
            
            <div className="pt-4 border-t">
              <div className="flex justify-between items-center font-medium text-lg">
                <span>Total Liabilities &amp; Equity</span>
                <span>${(data.liabilities.totalLiabilities + data.equity.total).toFixed(2)}</span>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default BalanceSheet;
