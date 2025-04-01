"use server";

import db from "@/db/db";
import { auth } from "@clerk/nextjs/server";
import { 
  InvoiceStatus, 
} from "@prisma/client";

// Types for dashboard data
export type DashboardStats = {
  totalInvoices: number;
  totalAmount: number;
  outstandingAmount: number;
  paidAmount: number;
  cashFlow: number;
  invoiceChangePercent: number;
  outstandingChangePercent: number;
  cashFlowChangePercent: number;
};

export type FinancialAlert = {
  type: "warning" | "danger" | "info";
  title: string;
  description: string;
  actionText: string;
  actionLink: string;
};

export type TimeframeOption = "7d" | "30d" | "90d" | "1y";

/**
 * Get dashboard statistics for the current user
 */
export async function getDashboardStats(timeframe: TimeframeOption = "30d"): Promise<DashboardStats> {
  const authData = await auth();
  const userId = authData.userId;
  
  if (!userId) {
    throw new Error("User not authenticated");
  }

  // Calculate date range based on timeframe
  const currentDate = new Date();
  const startDate = new Date();
  
  switch (timeframe) {
    case "7d":
      startDate.setDate(currentDate.getDate() - 7);
      break;
    case "30d":
      startDate.setDate(currentDate.getDate() - 30);
      break;
    case "90d":
      startDate.setDate(currentDate.getDate() - 90);
      break;
    case "1y":
      startDate.setFullYear(currentDate.getFullYear() - 1);
      break;
  }

  // Get previous period for comparison
  const previousStartDate = new Date(startDate);
  
  switch (timeframe) {
    case "7d":
      previousStartDate.setDate(previousStartDate.getDate() - 7);
      break;
    case "30d":
      previousStartDate.setDate(previousStartDate.getDate() - 30);
      break;
    case "90d":
      previousStartDate.setDate(previousStartDate.getDate() - 90);
      break;
    case "1y":
      previousStartDate.setFullYear(previousStartDate.getFullYear() - 1);
      break;
  }

  // Get current period invoices
  const currentPeriodInvoices = await db.invoice.findMany({
    where: {
      userId: { equals: userId },
      createdAt: {
        gte: startDate,
        lte: currentDate
      }
    }
  });

  // Get previous period invoices for comparison
  const previousPeriodInvoices = await db.invoice.findMany({
    where: {
      userId: { equals: userId },
      createdAt: {
        gte: previousStartDate,
        lt: startDate
      }
    }
  });

  // Calculate totals for current period
  const totalAmount = currentPeriodInvoices.reduce((sum, invoice) => 
    sum + (invoice.amount || 0), 0);
  
  const outstandingInvoices = currentPeriodInvoices.filter(
    invoice => invoice.status === InvoiceStatus.PENDING || invoice.status === InvoiceStatus.OVERDUE
  );
  
  const outstandingAmount = outstandingInvoices.reduce((sum, invoice) => 
    sum + (invoice.amount || 0), 0);
  
  const paidAmount = currentPeriodInvoices
    .filter(invoice => invoice.status === InvoiceStatus.PAID)
    .reduce((sum, invoice) => sum + (invoice.amount || 0), 0);

  // Calculate totals for previous period for comparison
  const prevTotalAmount = previousPeriodInvoices.reduce((sum, invoice) => 
    sum + (invoice.amount || 0), 0);
  
  const prevOutstandingAmount = previousPeriodInvoices
    .filter(invoice => invoice.status === InvoiceStatus.PENDING || invoice.status === InvoiceStatus.OVERDUE)
    .reduce((sum, invoice) => sum + (invoice.amount || 0), 0);
  
  const prevPaidAmount = previousPeriodInvoices
    .filter(invoice => invoice.status === InvoiceStatus.PAID)
    .reduce((sum, invoice) => sum + (invoice.amount || 0), 0);

  // Calculate percentages
  const invoiceChangePercent = prevTotalAmount === 0 
    ? 100 
    : ((totalAmount - prevTotalAmount) / prevTotalAmount) * 100;
  
  const outstandingChangePercent = prevOutstandingAmount === 0 
    ? 0 
    : ((outstandingAmount - prevOutstandingAmount) / prevOutstandingAmount) * 100;
  
  const cashFlow = paidAmount - outstandingAmount;
  const prevCashFlow = prevPaidAmount - prevOutstandingAmount;
  
  const cashFlowChangePercent = prevCashFlow === 0 
    ? (cashFlow > 0 ? 100 : -100) 
    : ((cashFlow - prevCashFlow) / Math.abs(prevCashFlow)) * 100;

  return {
    totalInvoices: currentPeriodInvoices.length,
    totalAmount,
    outstandingAmount,
    paidAmount,
    cashFlow,
    invoiceChangePercent,
    outstandingChangePercent,
    cashFlowChangePercent
  };
}

/**
 * Get financial alerts for the dashboard
 */
export async function getFinancialAlerts(): Promise<FinancialAlert[]> {
  const authData = await auth();
  const userId = authData.userId;
  
  if (!userId) {
    throw new Error("User not authenticated");
  }

  const alerts: FinancialAlert[] = [];

  // Get overdue invoices
  const overdueInvoices = await db.invoice.findMany({
    where: {
      userId,
      status: InvoiceStatus.OVERDUE
    }
  });

  if (overdueInvoices.length > 0) {
    const totalOverdue = overdueInvoices.reduce((sum, invoice) => 
      sum + (invoice.amount || 0), 0);
    
    alerts.push({
      type: "danger",
      title: "Overdue Invoices",
      description: `${overdueInvoices.length} invoices totaling $${totalOverdue.toFixed(2)} are overdue.`,
      actionText: "View invoices",
      actionLink: "/dashboard/invoices?filter=overdue"
    });
  }

  // Check for upcoming payments (due within 7 days)
  const nextWeek = new Date();
  nextWeek.setDate(nextWeek.getDate() + 7);
  
  const upcomingInvoices = await db.invoice.findMany({
    where: {
      userId,
      status: InvoiceStatus.PENDING,
      dueDate: {
        lte: nextWeek,
        gte: new Date()
      }
    }
  });

  if (upcomingInvoices.length > 0) {
    const totalUpcoming = upcomingInvoices.reduce((sum, invoice) => 
      sum + (invoice.amount || 0), 0);
    
    alerts.push({
      type: "warning",
      title: "Upcoming Payments",
      description: `${upcomingInvoices.length} invoices totaling $${totalUpcoming.toFixed(2)} are due within 7 days.`,
      actionText: "View upcoming",
      actionLink: "/dashboard/invoices?filter=upcoming"
    });
  }

  // Check for unusual expenses (this is just an example - would need more sophisticated logic in production)
  const unusualExpenses = await db.invoice.findMany({
    where: {
      userId,
      amount: {
        gt: 1000 // Example threshold
      },
      createdAt: {
        gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
      }
    },
    orderBy: {
      amount: 'desc'
    },
    take: 1
  });

  if (unusualExpenses.length > 0 && unusualExpenses[0].amount && unusualExpenses[0].amount > 3000) {
    alerts.push({
      type: "info",
      title: "Unusual Expense",
      description: `Detected unusual expense to "${unusualExpenses[0].vendorName || 'Unknown'}" for $${unusualExpenses[0].amount.toFixed(2)}.`,
      actionText: "Review expense",
      actionLink: `/dashboard/invoices/${unusualExpenses[0].id}`
    });
  }

  return alerts;
}

/**
 * Get revenue overview data for charts
 */
export async function getRevenueOverview(
  timeframe: TimeframeOption = "30d", 
  type: "revenue" | "expenses" | "combined" = "combined"
) {
  const authData = await auth();
  const userId = authData.userId;
  
  if (!userId) {
    throw new Error("User not authenticated");
  }

  // Calculate date range based on timeframe
  const endDate = new Date();
  const startDate = new Date();
  
  switch (timeframe) {
    case "7d":
      startDate.setDate(endDate.getDate() - 7);
      break;
    case "30d":
      startDate.setDate(endDate.getDate() - 30);
      break;
    case "90d":
      startDate.setDate(endDate.getDate() - 90);
      break;
    case "1y":
      startDate.setFullYear(endDate.getFullYear() - 1);
      break;
  }

  // Get invoices for the period
  const invoices = await db.invoice.findMany({
    where: {
      userId,
      createdAt: {
        gte: startDate,
        lte: endDate
      }
    },
    include: {
      category: true
    }
  });

  // Process data based on type
  const chartData: any = [];

  // This is simplified - you would need to aggregate by time periods
  // based on the timeframe selected
  if (type === "revenue" || type === "combined") {
    const revenueData = invoices
      .filter(invoice => invoice.status === InvoiceStatus.PAID)
      .reduce((data, invoice) => {
        // Group by month/week/day depending on timeframe
        const date = new Date(invoice.createdAt);
        let key: string;
        
        if (timeframe === "7d" || timeframe === "30d") {
          // Daily for shorter timeframes
          key = date.toISOString().split('T')[0];
        } else if (timeframe === "90d") {
          // Weekly for 90d
          const weekNumber = Math.ceil((date.getDate() + 
            (new Date(date.getFullYear(), date.getMonth(), 1).getDay())) / 7);
          key = `${date.getFullYear()}-${date.getMonth() + 1}-W${weekNumber}`;
        } else {
          // Monthly for 1y
          key = `${date.getFullYear()}-${date.getMonth() + 1}`;
        }
        
        if (!data[key]) {
          data[key] = 0;
        }
        data[key] += invoice.amount || 0;
        return data;
      }, {} as Record<string, number>);
    
    chartData.push({
      name: "Revenue",
      data: Object.entries(revenueData).map(([date, value]) => ({
        x: date,
        y: value
      }))
    });
  }

  if (type === "expenses" || type === "combined") {
    const expensesData = invoices
      .reduce((data, invoice) => {
        const date = new Date(invoice.createdAt);
        let key: string;
        
        if (timeframe === "7d" || timeframe === "30d") {
          key = date.toISOString().split('T')[0];
        } else if (timeframe === "90d") {
          const weekNumber = Math.ceil((date.getDate() + 
            (new Date(date.getFullYear(), date.getMonth(), 1).getDay())) / 7);
          key = `${date.getFullYear()}-${date.getMonth() + 1}-W${weekNumber}`;
        } else {
          key = `${date.getFullYear()}-${date.getMonth() + 1}`;
        }
        
        if (!data[key]) {
          data[key] = 0;
        }
        
        // We're treating all unpaid invoices as "expenses" for this simplified example
        // You would need to refine this based on your actual data model
        if (invoice.status !== InvoiceStatus.PAID) {
          data[key] += invoice.amount || 0;
        }
        
        return data;
      }, {} as Record<string, number>);
    
    chartData.push({
      name: "Expenses",
      data: Object.entries(expensesData).map(([date, value]) => ({
        x: date,
        y: value
      }))
    });
  }

  return chartData;
}

/**
 * Get cash flow projection data
 */
export async function getCashFlowProjection() {
  const authData = await auth();
  const userId = authData.userId;
  
  if (!userId) {
    throw new Error("User not authenticated");
  }

  // Get all pending invoices
  const pendingInvoices = await db.invoice.findMany({
    where: {
      userId,
      status: InvoiceStatus.PENDING
    },
    orderBy: {
      dueDate: 'asc'
    }
  });

  // Create 3-month projection
  const now = new Date();
  const threeMonthsLater = new Date();
  threeMonthsLater.setMonth(now.getMonth() + 3);
  
  // Create monthly projection buckets
  const monthlyProjection: Record<string, { income: number; expenses: number }> = {};
  
  // Initialize the three months
  for (let i = 0; i < 3; i++) {
    const projectionMonth = new Date();
    projectionMonth.setMonth(now.getMonth() + i);
    const monthKey = `${projectionMonth.getFullYear()}-${projectionMonth.getMonth() + 1}`;
    
    monthlyProjection[monthKey] = {
      income: 0,
      expenses: 0
    };
  }
  
  // Distribute pending invoices into the projection
  pendingInvoices.forEach(invoice => {
    if (invoice.dueDate && invoice.amount) {
      const dueMonth = `${invoice.dueDate.getFullYear()}-${invoice.dueDate.getMonth() + 1}`;
      
      if (monthlyProjection[dueMonth]) {
        monthlyProjection[dueMonth].income += invoice.amount;
      }
    }
  });
  
  // Format for chart consumption
  const chartData = [
    {
      name: "Projected Income",
      data: Object.entries(monthlyProjection).map(([month, data]) => ({
        x: month,
        y: data.income
      }))
    },
    {
      name: "Projected Expenses",
      data: Object.entries(monthlyProjection).map(([month, data]) => ({
        x: month,
        y: data.expenses
      }))
    }
  ];
  
  return chartData;
}

/**
 * Get recent invoices for the dashboard
 */
export async function getRecentInvoices(limit: number = 5) {
  const authData = await auth();
  const userId = authData.userId;
  
  if (!userId) {
    throw new Error("User not authenticated");
  }

  const recentInvoices = await db.invoice.findMany({
    where: {
      userId
    },
    orderBy: {
      createdAt: 'desc'
    },
    take: limit,
    include: {
      vendor: true,
      category: true
    }
  });

  return recentInvoices;
} 