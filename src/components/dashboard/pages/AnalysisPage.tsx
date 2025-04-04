"use client";

import React, { useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Download, Filter, Calendar } from "lucide-react";
import GeneralLedger from "@/components/dashboard/accounting/GeneralLedger";
import ProfitLoss from "@/components/dashboard/accounting/ProfitLoss";
import BalanceSheet from "@/components/dashboard/accounting/BalanceSheet";
import TrialBalance from "@/components/dashboard/accounting/TrialBalance";
import CashFlow from "@/components/dashboard/accounting/CashFlow";
import AiInsights from "@/components/dashboard/accounting/AiInsights";

import { LedgerEntry } from "@/components/dashboard/accounting/GeneralLedger";
import { ProfitLossData } from "@/components/dashboard/accounting/ProfitLoss";
import { BalanceSheetData } from "@/components/dashboard/accounting/BalanceSheet";
import { TrialBalanceData } from "@/components/dashboard/accounting/TrialBalance";
import { CashFlowData } from "@/components/dashboard/accounting/CashFlow";
import { AiInsightsData } from "@/components/dashboard/accounting/AiInsights";

interface AnalysisPageProps {
  ledgerEntries: LedgerEntry[];
  profitLossData: ProfitLossData;
  balanceSheetData: BalanceSheetData;
  trialBalanceData: TrialBalanceData;
  cashFlowData: CashFlowData;
  aiInsightsData: AiInsightsData;
}

const AnalysisPage = ({
  ledgerEntries,
  profitLossData,
  balanceSheetData,
  trialBalanceData,
  cashFlowData,
  aiInsightsData
}: AnalysisPageProps) => {
  const [profitLossPeriod, setProfitLossPeriod] = useState<"month" | "quarter" | "year">("month");
  const [cashFlowPeriod, setCashFlowPeriod] = useState<"30days" | "60days" | "90days">("30days");

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Financial Analysis</h1>
            <p className="text-muted-foreground">Real-time financial insights based on your invoice data</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="h-9">
              <Calendar className="mr-2 h-4 w-4" />
              {profitLossPeriod === "month" ? "This Month" : 
               profitLossPeriod === "quarter" ? "This Quarter" : "This Year"}
            </Button>
            <Button variant="outline" size="sm" className="h-9">
              <Filter className="mr-2 h-4 w-4" />
              Filter
            </Button>
            <Button size="sm" className="h-9">
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
          </div>
        </div>

        <Tabs defaultValue="profit-loss" className="space-y-4">
          <TabsList className="grid grid-cols-3 md:grid-cols-6 w-full">
            <TabsTrigger value="profit-loss">Profit & Loss</TabsTrigger>
            <TabsTrigger value="balance-sheet">Balance Sheet</TabsTrigger>
            <TabsTrigger value="general-ledger">General Ledger</TabsTrigger>
            <TabsTrigger value="trial-balance">Trial Balance</TabsTrigger>
            <TabsTrigger value="cash-flow">Cash Flow</TabsTrigger>
            <TabsTrigger value="ai-insights">AI Insights</TabsTrigger>
          </TabsList>
          
          <TabsContent value="profit-loss" className="space-y-4">
            <div className="flex justify-end space-x-2 mb-4">
              <Button 
                variant={profitLossPeriod === "month" ? "default" : "outline"} 
                size="sm"
                onClick={() => setProfitLossPeriod("month")}
              >
                Monthly
              </Button>
              <Button 
                variant={profitLossPeriod === "quarter" ? "default" : "outline"} 
                size="sm"
                onClick={() => setProfitLossPeriod("quarter")}
              >
                Quarterly
              </Button>
              <Button 
                variant={profitLossPeriod === "year" ? "default" : "outline"} 
                size="sm"
                onClick={() => setProfitLossPeriod("year")}
              >
                Yearly
              </Button>
            </div>
            <ProfitLoss data={profitLossData} period={profitLossPeriod} />
          </TabsContent>
          
          <TabsContent value="balance-sheet" className="space-y-4">
            <BalanceSheet data={balanceSheetData} />
          </TabsContent>
          
          <TabsContent value="general-ledger" className="space-y-4">
            <GeneralLedger entries={ledgerEntries} />
          </TabsContent>
          
          <TabsContent value="trial-balance" className="space-y-4">
            <TrialBalance data={trialBalanceData} />
          </TabsContent>
          
          <TabsContent value="cash-flow" className="space-y-4">
            <div className="flex justify-end space-x-2 mb-4">
              <Button 
                variant={cashFlowPeriod === "30days" ? "default" : "outline"} 
                size="sm"
                onClick={() => setCashFlowPeriod("30days")}
              >
                30 Days
              </Button>
              <Button 
                variant={cashFlowPeriod === "60days" ? "default" : "outline"} 
                size="sm"
                onClick={() => setCashFlowPeriod("60days")}
              >
                60 Days
              </Button>
              <Button 
                variant={cashFlowPeriod === "90days" ? "default" : "outline"} 
                size="sm"
                onClick={() => setCashFlowPeriod("90days")}
              >
                90 Days
              </Button>
            </div>
            <CashFlow data={cashFlowData} period={cashFlowPeriod} />
          </TabsContent>
          
          <TabsContent value="ai-insights" className="space-y-4">
            <AiInsights data={aiInsightsData} />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default AnalysisPage;
