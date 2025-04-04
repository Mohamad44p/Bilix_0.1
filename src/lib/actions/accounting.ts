"use server";

import { auth, currentUser } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { OpenAI } from "openai";
import { 
  calculatePaymentProbability,
  assessCashFlowRisk,
  validateTrialBalanceWithAI,
  detectFraudIssues,
  assessFinancialRisks,
  calculateTaxLiabilities,
  generateAiSummary
} from "@/lib/services/accounting-service";
import { TrialBalanceAccount } from "@/components/dashboard/accounting/TrialBalance";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Get general ledger entries
 */
export async function getGeneralLedger() {
  const session = await auth();
  const user = await currentUser();
  const userId = user?.id || session?.userId;
  const orgId = session?.orgId;
  
  if (!userId) {
    throw new Error("Unauthorized");
  }
  
  try {
    const invoices = await db.invoice.findMany({
      where: {
        userId: userId,
        ...(orgId && { organizationId: orgId }),
      },
      include: {
        vendor: true,
        category: true,
      },
      orderBy: {
        issueDate: "desc",
      },
    });
    
    const ledgerEntries = invoices.map((invoice: any) => {
      const isPayment = invoice.invoiceType === "PAYMENT";
      
      return {
        id: invoice.id,
        date: invoice.issueDate || invoice.createdAt,
        description: invoice.title || (isPayment ? "Payment received" : "Purchase made"),
        reference: invoice.invoiceNumber || invoice.id.substring(0, 8),
        account: isPayment ? "Accounts Receivable" : "Accounts Payable",
        counterAccount: isPayment ? "Revenue" : invoice.category?.name || "Expenses",
        debit: isPayment ? 0 : Number(invoice.amount || 0),
        credit: isPayment ? Number(invoice.amount || 0) : 0,
        balance: 0, // Will be calculated below
        entity: isPayment ? "Customer" : invoice.vendor?.name || invoice.vendorName || "Unknown Vendor",
      };
    });
    
    let balance = 0;
    for (let i = ledgerEntries.length - 1; i >= 0; i--) {
      balance += ledgerEntries[i].credit - ledgerEntries[i].debit;
      ledgerEntries[i].balance = balance;
    }
    
    return ledgerEntries;
  } catch (error) {
    console.error("Error fetching general ledger:", error);
    throw new Error("Failed to fetch general ledger");
  }
}

/**
 * Get profit and loss data
 */
export async function getProfitLoss(period: "month" | "quarter" | "year") {
  const session = await auth();
  const user = await currentUser();
  const userId = user?.id || session?.userId;
  const orgId = session?.orgId;
  
  if (!userId) {
    throw new Error("Unauthorized");
  }
  
  try {
    const now = new Date();
    const startDate = new Date();
    
    if (period === "month") {
      startDate.setMonth(now.getMonth() - 1);
    } else if (period === "quarter") {
      startDate.setMonth(now.getMonth() - 3);
    } else {
      startDate.setFullYear(now.getFullYear() - 1);
    }
    
    const invoices = await db.invoice.findMany({
      where: {
        userId: userId,
        ...(orgId && { organizationId: orgId }),
        issueDate: {
          gte: startDate,
        },
      },
      include: {
        category: true,
      },
      orderBy: {
        issueDate: "asc",
      },
    });
    
    const revenueByCategory: Record<string, number> = {};
    const expensesByCategory: Record<string, number> = {};
    let totalRevenue = 0;
    let totalExpenses = 0;
    
    invoices.forEach((invoice: any) => {
      const amount = Number(invoice.amount || 0);
      
      if (invoice.invoiceType === "PAYMENT") {
        const category = invoice.category?.name || "Uncategorized Revenue";
        revenueByCategory[category] = (revenueByCategory[category] || 0) + amount;
        totalRevenue += amount;
      } else {
        const category = invoice.category?.name || "Uncategorized Expenses";
        expensesByCategory[category] = (expensesByCategory[category] || 0) + amount;
        totalExpenses += amount;
      }
    });
    
    const netIncome = totalRevenue - totalExpenses;
    
    const monthlyData = [];
    const months = period === "month" ? 1 : period === "quarter" ? 3 : 12;
    
    for (let i = 0; i < months; i++) {
      const monthDate = new Date(startDate);
      monthDate.setMonth(startDate.getMonth() + i);
      
      const monthName = monthDate.toLocaleString('default', { month: 'short' });
      const monthYear = monthDate.getFullYear();
      
      const monthInvoices = invoices.filter((invoice: any) => {
        if (!invoice.issueDate) return false;
        const invoiceDate = new Date(invoice.issueDate);
        return invoiceDate.getMonth() === monthDate.getMonth() && 
               invoiceDate.getFullYear() === monthDate.getFullYear();
      });
      
      let monthRevenue = 0;
      let monthExpenses = 0;
      
      monthInvoices.forEach((invoice: any) => {
        const amount = Number(invoice.amount || 0);
        if (invoice.invoiceType === "PAYMENT") {
          monthRevenue += amount;
        } else {
          monthExpenses += amount;
        }
      });
      
      monthlyData.push({
        month: `${monthName} ${monthYear}`,
        revenue: monthRevenue,
        expenses: monthExpenses,
        profit: monthRevenue - monthExpenses,
      });
    }
    
    const revenueCategories = Object.entries(revenueByCategory).map(([name, value]) => ({
      name,
      value,
    }));
    
    const expenseCategories = Object.entries(expensesByCategory).map(([name, value]) => ({
      name,
      value,
    }));
    
    const previousStartDate = new Date(startDate);
    if (period === "month") {
      previousStartDate.setMonth(previousStartDate.getMonth() - 1);
    } else if (period === "quarter") {
      previousStartDate.setMonth(previousStartDate.getMonth() - 3);
    } else {
      previousStartDate.setFullYear(previousStartDate.getFullYear() - 1);
    }
    
    const previousInvoices = await db.invoice.findMany({
      where: {
        userId: userId,
        ...(orgId && { organizationId: orgId }),
        issueDate: {
          gte: previousStartDate,
          lt: startDate,
        },
      },
    });
    
    let previousRevenue = 0;
    let previousExpenses = 0;
    
    previousInvoices.forEach((invoice: any) => {
      const amount = Number(invoice.amount || 0);
      if (invoice.invoiceType === "PAYMENT") {
        previousRevenue += amount;
      } else {
        previousExpenses += amount;
      }
    });
    
    const previousNetIncome = previousRevenue - previousExpenses;
    
    const revenueChange = previousRevenue === 0 ? 100 : ((totalRevenue - previousRevenue) / previousRevenue) * 100;
    const expensesChange = previousExpenses === 0 ? 100 : ((totalExpenses - previousExpenses) / previousExpenses) * 100;
    const netIncomeChange = previousNetIncome === 0 ? 100 : ((netIncome - previousNetIncome) / Math.abs(previousNetIncome)) * 100;
    
    return {
      totalRevenue,
      totalExpenses,
      netIncome,
      revenueCategories,
      expenseCategories,
      monthlyData,
      period,
      startDate,
      endDate: now,
      previousPeriod: {
        totalRevenue: previousRevenue,
        totalExpenses: previousExpenses,
        netIncome: previousNetIncome,
      },
      changes: {
        revenueChange,
        expensesChange,
        netIncomeChange,
      },
    };
  } catch (error) {
    console.error("Error fetching profit and loss data:", error);
    throw new Error("Failed to fetch profit and loss data");
  }
}

/**
 * Get balance sheet data
 */
export async function getBalanceSheet() {
  const session = await auth();
  const user = await currentUser();
  const userId = user?.id || session?.userId;
  const orgId = session?.orgId;
  
  if (!userId) {
    throw new Error("Unauthorized");
  }
  
  try {
    const invoices = await db.invoice.findMany({
      where: {
        userId: userId,
        ...(orgId && { organizationId: orgId }),
      },
      include: {
        vendor: true,
      },
      orderBy: {
        issueDate: "asc",
      },
    });
    
    const cashAndEquivalents = invoices.reduce((total: number, invoice: any) => {
      if (invoice.invoiceType === "PAYMENT" && invoice.status === "PAID") {
        return total + Number(invoice.amount || 0);
      } else if (invoice.invoiceType === "PURCHASE" && invoice.status === "PAID") {
        return total - Number(invoice.amount || 0);
      }
      return total;
    }, 0);
    
    const accountsReceivable = invoices.reduce((total: number, invoice: any) => {
      if (invoice.invoiceType === "PAYMENT" && invoice.status !== "PAID") {
        return total + Number(invoice.amount || 0);
      }
      return total;
    }, 0);
    
    const inventory = 0; // Would need additional data for inventory
    const prepaidExpenses = 0; // Would need additional data for prepaid expenses
    
    const totalCurrentAssets = cashAndEquivalents + accountsReceivable + inventory + prepaidExpenses;
    
    const fixedAssets = 0; // Would need additional data for fixed assets
    const totalAssets = totalCurrentAssets + fixedAssets;
    
    const accountsPayable = invoices.reduce((total: number, invoice: any) => {
      if (invoice.invoiceType === "PURCHASE" && invoice.status !== "PAID") {
        return total + Number(invoice.amount || 0);
      }
      return total;
    }, 0);
    
    const shortTermDebt = 0; // Would need additional data for short-term debt
    const totalCurrentLiabilities = accountsPayable + shortTermDebt;
    
    const longTermDebt = 0; // Would need additional data for long-term debt
    const totalLiabilities = totalCurrentLiabilities + longTermDebt;
    
    const equity = totalAssets - totalLiabilities;
    
    const now = new Date();
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(now.getMonth() - 1);
    
    const previousInvoices = await db.invoice.findMany({
      where: {
        userId: userId,
        ...(orgId && { organizationId: orgId }),
        issueDate: {
          lt: oneMonthAgo,
        },
      },
    });
    
    const previousCashAndEquivalents = previousInvoices.reduce((total: number, invoice: any) => {
      if (invoice.invoiceType === "PAYMENT" && invoice.status === "PAID") {
        return total + Number(invoice.amount || 0);
      } else if (invoice.invoiceType === "PURCHASE" && invoice.status === "PAID") {
        return total - Number(invoice.amount || 0);
      }
      return total;
    }, 0);
    
    const previousAccountsReceivable = previousInvoices.reduce((total: number, invoice: any) => {
      if (invoice.invoiceType === "PAYMENT" && invoice.status !== "PAID") {
        return total + Number(invoice.amount || 0);
      }
      return total;
    }, 0);
    
    const previousTotalCurrentAssets = previousCashAndEquivalents + previousAccountsReceivable;
    
    const previousAccountsPayable = previousInvoices.reduce((total: number, invoice: any) => {
      if (invoice.invoiceType === "PURCHASE" && invoice.status !== "PAID") {
        return total + Number(invoice.amount || 0);
      }
      return total;
    }, 0);
    
    const previousTotalCurrentLiabilities = previousAccountsPayable;
    
    const previousTotalAssets = previousTotalCurrentAssets;
    const previousTotalLiabilities = previousTotalCurrentLiabilities;
    const previousEquity = previousTotalAssets - previousTotalLiabilities;
    
    const assetsChange = previousTotalAssets === 0 ? 100 : ((totalAssets - previousTotalAssets) / previousTotalAssets) * 100;
    const liabilitiesChange = previousTotalLiabilities === 0 ? 100 : ((totalLiabilities - previousTotalLiabilities) / previousTotalLiabilities) * 100;
    const equityChange = previousEquity === 0 ? 100 : ((equity - previousEquity) / Math.abs(previousEquity)) * 100;
    
    return {
      asOfDate: now,
      assets: {
        currentAssets: {
          cashAndEquivalents,
          accountsReceivable,
          inventory,
          prepaidExpenses,
          total: totalCurrentAssets,
        },
        fixedAssets: {
          propertyAndEquipment: 0,
          accumulatedDepreciation: 0,
          total: fixedAssets,
        },
        totalAssets,
      },
      liabilities: {
        currentLiabilities: {
          accountsPayable,
          shortTermDebt,
          total: totalCurrentLiabilities,
        },
        longTermLiabilities: {
          longTermDebt,
          total: longTermDebt,
        },
        totalLiabilities,
      },
      equity: {
        ownersEquity: equity,
        retainedEarnings: 0,
        total: equity,
      },
      changes: {
        assetsChange,
        liabilitiesChange,
        equityChange,
      },
      previousPeriod: {
        totalAssets: previousTotalAssets,
        totalLiabilities: previousTotalLiabilities,
        equity: previousEquity,
      },
    };
  } catch (error) {
    console.error("Error fetching balance sheet data:", error);
    throw new Error("Failed to fetch balance sheet data");
  }
}

/**
 * Get trial balance data
 */
export async function getTrialBalance() {
  const session = await auth();
  const user = await currentUser();
  const userId = user?.id || session?.userId;
  const orgId = session?.orgId;
  
  if (!userId) {
    throw new Error("Unauthorized");
  }
  
  try {
    const invoices = await db.invoice.findMany({
      where: {
        userId: userId,
        ...(orgId && { organizationId: orgId }),
      },
      include: {
        category: true,
      },
    });
    
    const accounts = [
      { id: "cash", accountNumber: "1000", accountName: "Cash", type: "asset", debit: 0, credit: 0 },
      { id: "accounts-receivable", accountNumber: "1100", accountName: "Accounts Receivable", type: "asset", debit: 0, credit: 0 },
      { id: "inventory", accountNumber: "1200", accountName: "Inventory", type: "asset", debit: 0, credit: 0 },
      { id: "accounts-payable", accountNumber: "2000", accountName: "Accounts Payable", type: "liability", debit: 0, credit: 0 },
      { id: "loans-payable", accountNumber: "2100", accountName: "Loans Payable", type: "liability", debit: 0, credit: 0 },
      { id: "owners-equity", accountNumber: "3000", accountName: "Owner's Equity", type: "equity", debit: 0, credit: 0 },
      { id: "revenue", accountNumber: "4000", accountName: "Revenue", type: "revenue", debit: 0, credit: 0 },
    ];
    
    const categories = new Set<string>();
    invoices.forEach((invoice: any) => {
      if (invoice.invoiceType === "PURCHASE" && invoice.category?.name) {
        categories.add(invoice.category.name);
      }
    });
    
    let accountNumber = 5000;
    categories.forEach((category) => {
      accounts.push({
        id: `expense-${category.toLowerCase().replace(/\s+/g, "-")}`,
        accountNumber: accountNumber.toString(),
        accountName: category,
        type: "expense",
        debit: 0,
        credit: 0,
      });
      accountNumber += 100;
    });
    
    invoices.forEach((invoice: any) => {
      const amount = Number(invoice.amount || 0);
      
      if (invoice.invoiceType === "PAYMENT") {
        if (invoice.status === "PAID") {
          const cashAccount = accounts.find((a) => a.id === "cash");
          if (cashAccount) cashAccount.debit += amount;
          
          const revenueAccount = accounts.find((a) => a.id === "revenue");
          if (revenueAccount) revenueAccount.credit += amount;
        } else {
          const arAccount = accounts.find((a) => a.id === "accounts-receivable");
          if (arAccount) arAccount.debit += amount;
          
          const revenueAccount = accounts.find((a) => a.id === "revenue");
          if (revenueAccount) revenueAccount.credit += amount;
        }
      } else {
        const categoryName = invoice.category?.name || "Uncategorized";
        const expenseAccountId = `expense-${categoryName.toLowerCase().replace(/\s+/g, "-")}`;
        
        if (invoice.status === "PAID") {
          const expenseAccount = accounts.find((a) => a.id === expenseAccountId);
          if (expenseAccount) {
            expenseAccount.debit += amount;
          } else {
            const firstExpenseAccount = accounts.find((a) => a.type === "expense");
            if (firstExpenseAccount) firstExpenseAccount.debit += amount;
          }
          
          const cashAccount = accounts.find((a) => a.id === "cash");
          if (cashAccount) cashAccount.credit += amount;
        } else {
          const expenseAccount = accounts.find((a) => a.id === expenseAccountId);
          if (expenseAccount) {
            expenseAccount.debit += amount;
          } else {
            const firstExpenseAccount = accounts.find((a) => a.type === "expense");
            if (firstExpenseAccount) firstExpenseAccount.debit += amount;
          }
          
          const apAccount = accounts.find((a) => a.id === "accounts-payable");
          if (apAccount) apAccount.credit += amount;
        }
      }
    });
    
    const totalDebits = accounts.reduce((sum, account) => sum + account.debit, 0);
    const totalCredits = accounts.reduce((sum, account) => sum + account.credit, 0);
    const isBalanced = Math.abs(totalDebits - totalCredits) < 0.01;
    
    const aiValidation = await validateTrialBalanceWithAI(accounts as TrialBalanceAccount[], totalDebits, totalCredits);
    
    return {
      accounts,
      totalDebits,
      totalCredits,
      isBalanced,
      asOfDate: new Date(),
      aiValidation,
    };
  } catch (error) {
    console.error("Error fetching trial balance data:", error);
    throw new Error("Failed to fetch trial balance data");
  }
}

/**
 * Get cash flow projection data
 */
export async function getCashFlowProjection(period: "30days" | "60days" | "90days") {
  const session = await auth();
  const user = await currentUser();
  const userId = user?.id || session?.userId;
  const orgId = session?.orgId;
  
  if (!userId) {
    throw new Error("Unauthorized");
  }
  
  try {
    const days = period === "30days" ? 30 : period === "60days" ? 60 : 90;
    
    const invoices = await db.invoice.findMany({
      where: {
        userId: userId,
        ...(orgId && { organizationId: orgId }),
      },
      include: {
        vendor: true,
      },
      orderBy: {
        issueDate: "desc",
      },
    });
    
    const currentBalance = invoices.reduce((total: number, invoice: any) => {
      if (invoice.status === "PAID") {
        if (invoice.invoiceType === "PAYMENT") {
          return total + Number(invoice.amount || 0);
        } else {
          return total - Number(invoice.amount || 0);
        }
      }
      return total;
    }, 0);
    
    type SourceItem = {
      id: string;
      name: string;
      amount: number;
      probability: number;
    };
    
    const predictions: Array<{
      date: Date;
      inflow: number;
      outflow: number;
      netFlow: number;
      balance: number;
      inflowSources: SourceItem[];
      outflowSources: SourceItem[];
    }> = [];
    
    const now = new Date();
    let runningBalance = currentBalance;
    
    for (let i = 0; i < days; i++) {
      const date = new Date(now);
      date.setDate(now.getDate() + i);
      
      const dueInvoices = invoices.filter((invoice: any) => {
        if (!invoice.dueDate) return false;
        const dueDate = new Date(invoice.dueDate);
        return dueDate.toDateString() === date.toDateString() && invoice.status !== "PAID";
      });
      
      const inflowSources: SourceItem[] = [];
      const outflowSources: SourceItem[] = [];
      
      dueInvoices.forEach((invoice: any) => {
        const amount = Number(invoice.amount || 0);
        const probability = calculatePaymentProbability(invoice);
        
        if (invoice.invoiceType === "PAYMENT") {
          inflowSources.push({
            id: invoice.id,
            name: "Customer",
            amount,
            probability,
          });
        } else {
          outflowSources.push({
            id: invoice.id,
            name: invoice.vendor?.name || invoice.vendorName || "Unknown Vendor",
            amount,
            probability: 1, // Assume 100% probability for outflows
          });
        }
      });
      
      const inflow = inflowSources.reduce((sum, source) => sum + source.amount * source.probability, 0);
      const outflow = outflowSources.reduce((sum, source) => sum + source.amount, 0);
      const netFlow = inflow - outflow;
      
      runningBalance += netFlow;
      
      predictions.push({
        date,
        inflow,
        outflow,
        netFlow,
        balance: runningBalance,
        inflowSources,
        outflowSources,
      });
    }
    
    const balances = predictions.map((p) => p.balance);
    const lowestProjectedBalance = Math.min(...balances, currentBalance);
    const highestProjectedBalance = Math.max(...balances, currentBalance);
    
    const riskAssessment = assessCashFlowRisk(predictions, currentBalance);
    
    return {
      predictions,
      currentBalance,
      projectedEndBalance: predictions[predictions.length - 1].balance,
      lowestProjectedBalance,
      highestProjectedBalance,
      riskAssessment,
    };
  } catch (error) {
    console.error("Error fetching cash flow projection data:", error);
    throw new Error("Failed to fetch cash flow projection data");
  }
}

/**
 * Get AI financial insights
 */
export async function getAiFinancialInsights() {
  const session = await auth();
  const user = await currentUser();
  const userId = user?.id || session?.userId;
  const orgId = session?.orgId;
  
  if (!userId) {
    throw new Error("Unauthorized");
  }
  
  try {
    const invoices = await db.invoice.findMany({
      where: {
        userId: userId,
        ...(orgId && { organizationId: orgId }),
      },
      include: {
        vendor: true,
        category: true,
        // lineItems: {
        //   include: {
        //     attributes: true
        //   }
        // }
      },
    });
    
    const fraudDetectionResults = await detectFraudIssues(invoices);
    
    const financialRisks = await assessFinancialRisks(invoices);
    
    const taxLiabilities = await calculateTaxLiabilities(invoices);
    
    const aiSummary = await generateAiSummary(
      invoices,
      fraudDetectionResults,
      financialRisks,
      taxLiabilities
    );
    
    return {
      fraudDetection: {
        results: fraudDetectionResults,
        lastUpdated: new Date(),
        totalIssuesFound: fraudDetectionResults.length,
        potentialSavings: fraudDetectionResults.reduce((sum, result) => sum + result.amount, 0),
      },
      financialRisks: {
        risks: financialRisks,
        overallRiskLevel: financialRisks.some((risk) => risk.impact === "high")
          ? "high"
          : financialRisks.some((risk) => risk.impact === "medium")
          ? "medium"
          : "low",
        recommendations: financialRisks.map((risk) => risk.mitigation),
      },
      taxLiabilities: {
        liabilities: taxLiabilities,
        totalDue: taxLiabilities.reduce((sum, liability) => sum + liability.amount, 0),
        nextDueDate: taxLiabilities.length > 0
          ? taxLiabilities.reduce((earliest, liability) => {
              return liability.dueDate < earliest ? liability.dueDate : earliest;
            }, new Date(9999, 11, 31))
          : new Date(),
        recommendations: [
          "Ensure all tax filings are submitted on time to avoid penalties.",
          "Consider setting aside funds for upcoming tax payments.",
          "Review potential tax deductions to minimize tax liability.",
        ],
      },
      aiSummary,
    };
  } catch (error) {
    console.error("Error fetching AI financial insights:", error);
    throw new Error("Failed to fetch AI financial insights");
  }
}
