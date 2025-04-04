import { Invoice, Vendor } from "@prisma/client";
import { OpenAI } from "openai";
import { 
  TrialBalanceAccount 
} from "@/components/dashboard/accounting/TrialBalance";
import { 
  CashFlowPrediction 
} from "@/components/dashboard/accounting/CashFlow";
import { 
  FraudDetectionResult, 
  FinancialRisk, 
  TaxLiability 
} from "@/components/dashboard/accounting/AiInsights";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Calculate payment probability based on invoice history
 */
export function calculatePaymentProbability(invoice: Invoice & { vendor?: Vendor | null }): number {
  let probability = 0.8;
  
  if (invoice.status === 'OVERDUE') {
    probability -= 0.3;
  }
  
  const dueDate = invoice.dueDate;
  if (dueDate) {
    const now = new Date();
    const daysUntilDue = Math.floor((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysUntilDue < 0) {
      probability -= Math.min(0.5, Math.abs(daysUntilDue) * 0.01);
    } else if (daysUntilDue < 7) {
      probability -= 0.1;
    }
  }
  
  if (invoice.vendor?.name?.toLowerCase().includes('reliable')) {
    probability += 0.1;
  }
  
  return Math.max(0, Math.min(1, probability));
}

/**
 * Assess cash flow risk based on predictions
 */
export function assessCashFlowRisk(predictions: CashFlowPrediction[], currentBalance: number): {
  cashShortage: boolean;
  shortageDate?: Date;
  shortageAmount?: number;
  riskLevel: "low" | "medium" | "high";
  recommendations: string[];
} {
  const result = {
    cashShortage: false,
    shortageDate: undefined as Date | undefined,
    shortageAmount: undefined as number | undefined,
    riskLevel: "low" as "low" | "medium" | "high",
    recommendations: [] as string[]
  };
  
  for (const prediction of predictions) {
    if (prediction.balance < 0 && !result.cashShortage) {
      result.cashShortage = true;
      result.shortageDate = prediction.date;
      result.shortageAmount = Math.abs(prediction.balance);
      break;
    }
  }
  
  const balances = predictions.map(p => p.balance);
  const volatility = calculateVolatility(balances);
  
  if (result.cashShortage) {
    result.riskLevel = "high";
  } else if (volatility > 0.3 || Math.min(...balances) < currentBalance * 0.2) {
    result.riskLevel = "medium";
  }
  
  if (result.cashShortage) {
    result.recommendations.push(`Prepare for a cash shortage of ${formatCurrency(result.shortageAmount || 0)} on ${result.shortageDate?.toLocaleDateString()}.`);
    result.recommendations.push("Consider securing a line of credit or delaying non-essential expenses.");
    result.recommendations.push("Follow up on outstanding receivables to improve cash flow.");
  }
  
  if (volatility > 0.3) {
    result.recommendations.push("Your cash flow shows high volatility. Consider implementing more consistent billing cycles.");
  }
  
  if (predictions.some(p => p.inflow === 0)) {
    result.recommendations.push("There are periods with no projected income. Diversify revenue streams to ensure more consistent cash flow.");
  }
  
  if (predictions.some(p => p.outflow > p.inflow * 1.5)) {
    result.recommendations.push("Some periods show significantly higher expenses than income. Review and potentially reschedule large expenses.");
  }
  
  return result;
}

/**
 * Calculate volatility of a series of numbers
 */
function calculateVolatility(values: number[]): number {
  if (values.length <= 1) return 0;
  
  const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
  const squaredDiffs = values.map(val => Math.pow(val - mean, 2));
  const variance = squaredDiffs.reduce((sum, val) => sum + val, 0) / values.length;
  
  return Math.sqrt(variance) / mean; // Coefficient of variation
}

/**
 * Format currency for display
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2
  }).format(amount);
}

/**
 * Validate trial balance using AI
 */
export async function validateTrialBalanceWithAI(
  accounts: TrialBalanceAccount[], 
  totalDebits: number, 
  totalCredits: number
): Promise<{
  isValid: boolean;
  issues: {
    id: string;
    accountId: string;
    description: string;
    severity: "warning" | "error";
  }[];
}> {
  const isBalanced = Math.abs(totalDebits - totalCredits) < 0.01;
  const issues = [];
  
  if (!isBalanced) {
    issues.push({
      id: 'balance-issue',
      accountId: '',
      description: `Trial balance is not balanced. Difference: ${Math.abs(totalDebits - totalCredits).toFixed(2)}`,
      severity: "error" as "warning" | "error"
    });
  }
  
  for (const account of accounts) {
    if (account.type === 'asset' && account.credit > account.debit) {
      issues.push({
        id: `unusual-balance-${account.id}`,
        accountId: account.id,
        description: `Asset account "${account.accountName}" has an unusual credit balance.`,
        severity: "warning" as "warning" | "error"
      });
    }
    
    if ((account.type === 'liability' || account.type === 'equity') && account.debit > account.credit) {
      issues.push({
        id: `unusual-balance-${account.id}`,
        accountId: account.id,
        description: `${account.type.charAt(0).toUpperCase() + account.type.slice(1)} account "${account.accountName}" has an unusual debit balance.`,
        severity: "warning" as "warning" | "error"
      });
    }
    
    if (account.type === 'revenue' && account.debit > account.credit) {
      issues.push({
        id: `unusual-balance-${account.id}`,
        accountId: account.id,
        description: `Revenue account "${account.accountName}" has an unusual debit balance.`,
        severity: "warning" as "warning" | "error"
      });
    }
    
    if (account.type === 'expense' && account.credit > account.debit) {
      issues.push({
        id: `unusual-balance-${account.id}`,
        accountId: account.id,
        description: `Expense account "${account.accountName}" has an unusual credit balance.`,
        severity: "warning" as "warning" | "error"
      });
    }
  }
  
  
  return {
    isValid: issues.length === 0,
    issues
  };
}

/**
 * Detect potential fraud issues in invoices
 */
export async function detectFraudIssues(invoices: Invoice[]): Promise<FraudDetectionResult[]> {
  const results: FraudDetectionResult[] = [];
  
  const invoiceMap = new Map<string, Invoice[]>();
  
  invoices.forEach(invoice => {
    const key = `${invoice.amount}-${invoice.vendorId || 'unknown'}`;
    if (!invoiceMap.has(key)) {
      invoiceMap.set(key, []);
    }
    invoiceMap.get(key)!.push(invoice);
  });
  
  invoiceMap.forEach((group, key) => {
    if (group.length > 1) {
      for (let i = 0; i < group.length; i++) {
        for (let j = i + 1; j < group.length; j++) {
          const invoice1 = group[i];
          const invoice2 = group[j];
          
          const daysDiff = Math.abs(
            (invoice1.date.getTime() - invoice2.date.getTime()) / (1000 * 60 * 60 * 24)
          );
          
          if (daysDiff < 7) {
            results.push({
              id: `duplicate-${invoice1.id}-${invoice2.id}`,
              invoiceId: invoice1.id,
              vendorName: invoice1.vendor?.name || 'Unknown Vendor',
              amount: Number(invoice1.amount),
              date: invoice1.date,
              issueType: 'duplicate',
              severity: 'high',
              description: `Potential duplicate invoice detected. Invoice ${invoice1.invoiceNumber || invoice1.id} and ${invoice2.invoiceNumber || invoice2.id} have the same amount and vendor, and are only ${daysDiff.toFixed(1)} days apart.`,
              confidence: 90,
              suggestedAction: 'Review both invoices to confirm they are for different purchases/services.'
            });
          }
        }
      }
    }
  });
  
  const amounts = invoices.map(invoice => Number(invoice.amount));
  const mean = amounts.reduce((sum, amount) => sum + amount, 0) / amounts.length;
  const stdDev = Math.sqrt(
    amounts.reduce((sum, amount) => sum + Math.pow(amount - mean, 2), 0) / amounts.length
  );
  
  invoices.forEach(invoice => {
    const amount = Number(invoice.amount);
    const zScore = Math.abs((amount - mean) / stdDev);
    
    if (zScore > 3) {
      results.push({
        id: `anomaly-${invoice.id}`,
        invoiceId: invoice.id,
        vendorName: invoice.vendor?.name || 'Unknown Vendor',
        amount: amount,
        date: invoice.date,
        issueType: 'anomaly',
        severity: 'medium',
        description: `Unusually ${amount > mean ? 'high' : 'low'} invoice amount detected. This amount is ${zScore.toFixed(1)} standard deviations from the mean.`,
        confidence: 75,
        suggestedAction: 'Verify this invoice amount is correct and authorized.'
      });
    }
  });
  
  
  return results;
}

/**
 * Assess financial risks based on invoice data
 */
export async function assessFinancialRisks(invoices: Invoice[]): Promise<FinancialRisk[]> {
  const risks: FinancialRisk[] = [];
  
  const vendorTotals = new Map<string, number>();
  let totalSpend = 0;
  
  invoices.forEach(invoice => {
    if (invoice.type === 'PURCHASE') {
      const amount = Number(invoice.amount);
      totalSpend += amount;
      
      const vendorId = invoice.vendorId || 'unknown';
      vendorTotals.set(vendorId, (vendorTotals.get(vendorId) || 0) + amount);
    }
  });
  
  vendorTotals.forEach((amount, vendorId) => {
    const percentage = (amount / totalSpend) * 100;
    
    if (percentage > 25) {
      const vendor = invoices.find(i => i.vendorId === vendorId)?.vendor;
      
      risks.push({
        id: `vendor-concentration-${vendorId}`,
        category: 'Vendor Concentration',
        description: `${vendor?.name || 'Unknown vendor'} accounts for ${percentage.toFixed(1)}% of total expenses.`,
        impact: 'medium',
        probability: 'high',
        mitigation: 'Consider diversifying suppliers to reduce dependency on a single vendor.'
      });
    }
  });
  
  const cashFlow = invoices.reduce((sum, invoice) => {
    return sum + (invoice.type === 'PAYMENT' ? Number(invoice.amount) : -Number(invoice.amount));
  }, 0);
  
  if (cashFlow < 0) {
    risks.push({
      id: 'negative-cash-flow',
      category: 'Cash Flow',
      description: 'Negative overall cash flow detected.',
      impact: 'high',
      probability: 'high',
      mitigation: 'Review expenses and consider strategies to increase revenue or reduce costs.'
    });
  }
  
  const overdueReceivables = invoices.filter(
    invoice => invoice.type === 'PAYMENT' && invoice.status === 'OVERDUE'
  );
  
  const overdueTotal = overdueReceivables.reduce(
    (sum, invoice) => sum + Number(invoice.amount), 0
  );
  
  if (overdueTotal > 0) {
    risks.push({
      id: 'overdue-receivables',
      category: 'Accounts Receivable',
      description: `${overdueReceivables.length} overdue invoices totaling ${formatCurrency(overdueTotal)}.`,
      impact: 'medium',
      probability: 'medium',
      mitigation: 'Implement more aggressive collection procedures and consider early payment incentives.'
    });
  }
  
  
  return risks;
}

/**
 * Calculate tax liabilities based on invoice data
 */
export async function calculateTaxLiabilities(invoices: Invoice[]): Promise<TaxLiability[]> {
  const liabilities: TaxLiability[] = [];
  
  const totalRevenue = invoices
    .filter(invoice => invoice.type === 'PAYMENT')
    .reduce((sum, invoice) => sum + Number(invoice.amount), 0);
  
  const totalExpenses = invoices
    .filter(invoice => invoice.type === 'PURCHASE')
    .reduce((sum, invoice) => sum + Number(invoice.amount), 0);
  
  const estimatedProfit = totalRevenue - totalExpenses;
  const estimatedIncomeTax = estimatedProfit > 0 ? estimatedProfit * 0.21 : 0; // Simplified corporate tax rate
  
  const now = new Date();
  const yearEnd = new Date(now.getFullYear(), 11, 31); // December 31
  
  if (estimatedIncomeTax > 0) {
    liabilities.push({
      id: 'income-tax',
      taxType: 'Corporate Income Tax',
      amount: estimatedIncomeTax,
      dueDate: yearEnd,
      status: 'upcoming',
      description: 'Estimated corporate income tax based on current profit.'
    });
  }
  
  const estimatedSalesTax = totalRevenue * 0.08; // Simplified sales tax rate
  
  const currentQuarter = Math.floor(now.getMonth() / 3);
  const quarterEnd = new Date(now.getFullYear(), (currentQuarter + 1) * 3, 0);
  
  if (estimatedSalesTax > 0) {
    liabilities.push({
      id: 'sales-tax',
      taxType: 'Sales Tax',
      amount: estimatedSalesTax,
      dueDate: quarterEnd,
      status: now > quarterEnd ? 'overdue' : 'upcoming',
      description: 'Estimated sales tax based on current revenue.'
    });
  }
  
  const estimatedPayrollTax = totalExpenses * 0.15; // Simplified payroll tax rate
  
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  
  if (estimatedPayrollTax > 0) {
    liabilities.push({
      id: 'payroll-tax',
      taxType: 'Payroll Tax',
      amount: estimatedPayrollTax,
      dueDate: monthEnd,
      status: now > monthEnd ? 'overdue' : 'upcoming',
      description: 'Estimated payroll tax based on current expenses.'
    });
  }
  
  return liabilities;
}

/**
 * Find the next tax due date
 */
export function findNextTaxDueDate(liabilities: TaxLiability[]): Date {
  const upcomingLiabilities = liabilities.filter(liability => liability.status === 'upcoming');
  
  if (upcomingLiabilities.length === 0) {
    const date = new Date();
    date.setMonth(date.getMonth() + 3);
    return date;
  }
  
  upcomingLiabilities.sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime());
  return upcomingLiabilities[0].dueDate;
}

/**
 * Calculate overall risk level based on financial risks
 */
export function calculateOverallRiskLevel(risks: FinancialRisk[]): "low" | "medium" | "high" {
  if (risks.length === 0) return "low";
  
  const highImpactCount = risks.filter(risk => risk.impact === 'high').length;
  const mediumImpactCount = risks.filter(risk => risk.impact === 'medium').length;
  
  if (highImpactCount > 0) return "high";
  if (mediumImpactCount > 1) return "medium";
  return "low";
}

/**
 * Generate recommendations based on financial risks
 */
export function generateFinancialRiskRecommendations(risks: FinancialRisk[]): string[] {
  const recommendations: string[] = [];
  
  risks.forEach(risk => {
    recommendations.push(risk.mitigation);
  });
  
  if (risks.length > 0) {
    recommendations.push("Regularly review financial statements to identify and address emerging risks.");
  }
  
  if (risks.some(risk => risk.category === 'Cash Flow')) {
    recommendations.push("Implement a cash flow forecasting system to anticipate and prepare for potential shortfalls.");
  }
  
  if (risks.some(risk => risk.category === 'Accounts Receivable')) {
    recommendations.push("Review credit policies and consider implementing stricter terms for customers with poor payment history.");
  }
  
  return recommendations;
}

/**
 * Generate tax recommendations
 */
export function generateTaxRecommendations(liabilities: TaxLiability[]): string[] {
  const recommendations: string[] = [];
  
  const overdueLiabilities = liabilities.filter(liability => liability.status === 'overdue');
  
  if (overdueLiabilities.length > 0) {
    recommendations.push("Address overdue tax liabilities immediately to avoid penalties and interest.");
  }
  
  recommendations.push("Maintain accurate records of all business transactions to ensure proper tax reporting.");
  recommendations.push("Consider quarterly tax planning to optimize tax positions and avoid surprises.");
  
  if (liabilities.some(liability => liability.taxType === 'Corporate Income Tax')) {
    recommendations.push("Review potential tax deductions and credits to minimize corporate income tax liability.");
  }
  
  if (liabilities.some(liability => liability.taxType === 'Sales Tax')) {
    recommendations.push("Ensure sales tax is properly collected and reported for all applicable transactions.");
  }
  
  if (liabilities.some(liability => liability.taxType === 'Payroll Tax')) {
    recommendations.push("Verify all employee classifications and payroll tax calculations to ensure compliance.");
  }
  
  return recommendations;
}

/**
 * Generate AI summary of financial data
 */
export async function generateAiSummary(
  invoices: Invoice[],
  fraudDetectionResults: FraudDetectionResult[],
  financialRisks: FinancialRisk[],
  taxLiabilities: TaxLiability[]
): Promise<string> {
  const totalRevenue = invoices
    .filter(invoice => invoice.type === 'PAYMENT')
    .reduce((sum, invoice) => sum + Number(invoice.amount), 0);
  
  const totalExpenses = invoices
    .filter(invoice => invoice.type === 'PURCHASE')
    .reduce((sum, invoice) => sum + Number(invoice.amount), 0);
  
  const netIncome = totalRevenue - totalExpenses;
  
  const overdueReceivables = invoices
    .filter(invoice => invoice.type === 'PAYMENT' && invoice.status === 'OVERDUE')
    .reduce((sum, invoice) => sum + Number(invoice.amount), 0);
  
  const pendingPayables = invoices
    .filter(invoice => invoice.type === 'PURCHASE' && invoice.status === 'PENDING')
    .reduce((sum, invoice) => sum + Number(invoice.amount), 0);
  
  
  let summary = `Financial Summary:\n\n`;
  
  summary += `Your business has generated ${formatCurrency(totalRevenue)} in revenue and incurred ${formatCurrency(totalExpenses)} in expenses, resulting in a ${netIncome >= 0 ? 'profit' : 'loss'} of ${formatCurrency(Math.abs(netIncome))}.\n\n`;
  
  if (overdueReceivables > 0) {
    summary += `You have ${formatCurrency(overdueReceivables)} in overdue receivables that require attention.\n`;
  }
  
  if (pendingPayables > 0) {
    summary += `You have ${formatCurrency(pendingPayables)} in pending payables to manage.\n\n`;
  }
  
  if (fraudDetectionResults.length > 0) {
    summary += `AI analysis has identified ${fraudDetectionResults.length} potential fraud issues that should be reviewed, with a potential impact of ${formatCurrency(fraudDetectionResults.reduce((sum, result) => sum + result.amount, 0))}.\n\n`;
  } else {
    summary += `No potential fraud issues were detected in your financial data.\n\n`;
  }
  
  if (financialRisks.length > 0) {
    const riskLevel = calculateOverallRiskLevel(financialRisks);
    summary += `Your overall financial risk level is ${riskLevel.toUpperCase()}. Key risks include ${financialRisks.map(risk => risk.category.toLowerCase()).join(', ')}.\n\n`;
  } else {
    summary += `No significant financial risks were identified at this time.\n\n`;
  }
  
  const totalTaxLiability = taxLiabilities.reduce((sum, liability) => sum + liability.amount, 0);
  summary += `You have an estimated ${formatCurrency(totalTaxLiability)} in tax liabilities, with the next payment due on ${findNextTaxDueDate(taxLiabilities).toLocaleDateString()}.\n\n`;
  
  summary += `Key Recommendations:\n`;
  summary += `1. ${netIncome < 0 ? 'Focus on increasing revenue or reducing expenses to improve profitability.' : 'Continue your current revenue and expense management strategies.'}\n`;
  
  if (overdueReceivables > 0) {
    summary += `2. Implement more aggressive collection procedures for overdue receivables.\n`;
  }
  
  if (fraudDetectionResults.length > 0) {
    summary += `3. Review the identified potential fraud issues to prevent financial losses.\n`;
  }
  
  if (financialRisks.some(risk => risk.impact === 'high')) {
    summary += `4. Address high-impact financial risks immediately to protect your business.\n`;
  }
  
  return summary;
}
