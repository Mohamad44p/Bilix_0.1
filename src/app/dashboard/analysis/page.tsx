import React from 'react';
import { 
  getGeneralLedger, 
  getProfitLoss, 
  getBalanceSheet, 
  getTrialBalance, 
  getCashFlowProjection, 
  getAiFinancialInsights 
} from '@/lib/actions/accounting';
import AnalysisPage from '@/components/dashboard/pages/AnalysisPage';

export default async function Analysis() {
  const [
    ledgerEntries,
    profitLossData,
    balanceSheetData,
    trialBalanceData,
    cashFlowData,
    aiInsightsData
  ] = await Promise.all([
    getGeneralLedger(),
    getProfitLoss('month'),
    getBalanceSheet(),
    getTrialBalance(),
    getCashFlowProjection('30days'),
    getAiFinancialInsights()
  ]);

  return (
    <AnalysisPage 
      ledgerEntries={ledgerEntries}
      profitLossData={profitLossData}
      balanceSheetData={balanceSheetData}
      trialBalanceData={trialBalanceData}
      cashFlowData={cashFlowData}
      aiInsightsData={aiInsightsData}
    />
  );
}
