import { NextResponse } from "next/server";
import db from "@/db/db";
import { Invoice, InvoiceStatus, Category, Vendor } from "@prisma/client";
import { currentUser } from "@clerk/nextjs/server";

type InvoiceSummary = {
  total: number;
  count: number;
  paid: { count: number; amount: number };
  pending: { count: number; amount: number };
  overdue: { count: number; amount: number };
};

type InvoiceWithRelations = Invoice & {
  category?: Category | null;
  vendor?: Vendor | null;
};

export async function POST(request: Request) {
  try {
    // Get authenticated user
    const user = await currentUser();
    
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get the query from the request body
    const body = await request.json();
    const { query } = body;

    if (!query) {
      return NextResponse.json(
        { error: "Query is required" },
        { status: 400 }
      );
    }

    // Get user from database
    const dbUser = await db.user.findUnique({
      where: { clerkId: user.id },
    });

    if (!dbUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Process the query to determine what data to return
    const lowerQuery = query.toLowerCase();
    
    // Default time periods
    const now = new Date();
    const firstDayCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDayLastMonth = new Date(firstDayCurrentMonth.getTime() - 1);
    const firstDayLastMonth = new Date(lastDayLastMonth.getFullYear(), lastDayLastMonth.getMonth(), 1);
    
    // Q1 dates (January 1 to March 31 of current year)
    const q1Start = new Date(now.getFullYear(), 0, 1); // January 1
    const q1End = new Date(now.getFullYear(), 2, 31, 23, 59, 59); // March 31

    try {
      // LAST MONTH INVOICES
      if (lowerQuery.includes("last month") || lowerQuery.includes("recent invoices")) {
        const invoices = await db.invoice.findMany({
          where: {
            userId: dbUser.id,
            issueDate: {
              gte: firstDayLastMonth,
              lte: lastDayLastMonth,
            },
          },
          include: {
            category: true,
            vendor: true,
          },
          orderBy: {
            issueDate: 'desc',
          },
        });

        // Calculate summary
        const summary: InvoiceSummary = {
          total: 0,
          count: invoices.length,
          paid: { count: 0, amount: 0 },
          pending: { count: 0, amount: 0 },
          overdue: { count: 0, amount: 0 },
        };

        invoices.forEach(invoice => {
          const amount = invoice.amount || 0;
          summary.total += amount;
          
          if (invoice.status === InvoiceStatus.PAID) {
            summary.paid.count++;
            summary.paid.amount += amount;
          } else if (invoice.status === InvoiceStatus.PENDING) {
            summary.pending.count++;
            summary.pending.amount += amount;
          } else if (invoice.status === InvoiceStatus.OVERDUE) {
            summary.overdue.count++;
            summary.overdue.amount += amount;
          }
        });

        return NextResponse.json({
          summary,
          invoices,
        });
      } 
      
      // VENDOR CHARGED MOST
      else if (
        lowerQuery.includes("vendor") && 
        (lowerQuery.includes("most") || lowerQuery.includes("top") || lowerQuery.includes("highest"))
      ) {
        // Get all invoices with vendors
        const invoices = await db.invoice.findMany({
          where: {
            userId: dbUser.id,
            NOT: {
              vendorId: null,
            }
          },
          include: {
            vendor: true,
          },
        });

        // Group invoices by vendor and calculate totals
        const vendorTotals = invoices.reduce((acc, invoice) => {
          if (!invoice.vendor || !invoice.amount) return acc;
          
          const vendorId = invoice.vendor.id;
          if (!acc[vendorId]) {
            acc[vendorId] = {
              vendor: invoice.vendor,
              total: 0,
              invoiceCount: 0,
              recentInvoices: [],
            };
          }
          
          acc[vendorId].total += invoice.amount;
          acc[vendorId].invoiceCount++;
          acc[vendorId].recentInvoices.push(invoice);
          
          return acc;
        }, {} as Record<string, { 
          vendor: Vendor; 
          total: number; 
          invoiceCount: number; 
          recentInvoices: InvoiceWithRelations[] 
        }>);

        // Find the vendor with the highest total
        const vendorEntries = Object.values(vendorTotals);
        if (vendorEntries.length === 0) {
          return NextResponse.json({
            message: "No vendor data found",
          });
        }

        const topVendor = vendorEntries.reduce((max, curr) => 
          curr.total > max.total ? curr : max, vendorEntries[0]);

        // Calculate total expenses to get percentage
        const totalExpenses = invoices.reduce((sum, invoice) => 
          sum + (invoice.amount || 0), 0);
        
        const percentageOfExpenses = totalExpenses > 0 
          ? Math.round((topVendor.total / totalExpenses) * 100) 
          : 0;

        // Sort recent invoices by date and limit to 5
        const recentInvoices = topVendor.recentInvoices
          .sort((a, b) => {
            return (b.issueDate?.getTime() || 0) - (a.issueDate?.getTime() || 0);
          })
          .slice(0, 5);

        return NextResponse.json({
          vendor: topVendor.vendor.name,
          total: topVendor.total,
          invoiceCount: topVendor.invoiceCount,
          percentageOfExpenses,
          recentInvoices,
        });
      } 
      
      // FINANCIAL REPORT Q1
      else if (
        lowerQuery.includes("financial report") || 
        lowerQuery.includes("q1") || 
        lowerQuery.includes("quarter")
      ) {
        // Get Q1 invoices
        const q1Invoices = await db.invoice.findMany({
          where: {
            userId: dbUser.id,
            issueDate: {
              gte: q1Start,
              lte: q1End,
            },
          },
          include: {
            category: true,
          },
        });

        // Calculate total expenses
        const totalExpenses = q1Invoices.reduce((sum, invoice) => 
          sum + (invoice.amount || 0), 0);

        // Get previous year's Q1 invoices for comparison
        const prevYearQ1Start = new Date(q1Start.getFullYear() - 1, 0, 1);
        const prevYearQ1End = new Date(q1End.getFullYear() - 1, 2, 31, 23, 59, 59);
        
        const prevYearQ1Invoices = await db.invoice.findMany({
          where: {
            userId: dbUser.id,
            issueDate: {
              gte: prevYearQ1Start,
              lte: prevYearQ1End,
            },
          },
        });

        const prevYearExpenses = prevYearQ1Invoices.reduce((sum, invoice) => 
          sum + (invoice.amount || 0), 0);

        // Calculate percentage change
        const expensePercentChange = prevYearExpenses > 0 
          ? Math.round(((totalExpenses - prevYearExpenses) / prevYearExpenses) * 100) 
          : 0;

        // Group by category and find top expenses
        const categoryTotals = q1Invoices.reduce((acc, invoice) => {
          if (!invoice.category || !invoice.amount) return acc;
          
          const categoryId = invoice.category.id;
          if (!acc[categoryId]) {
            acc[categoryId] = {
              category: invoice.category.name,
              amount: 0,
            };
          }
          
          acc[categoryId].amount += invoice.amount;
          return acc;
        }, {} as Record<string, { category: string; amount: number }>);

        // Sort categories by amount and get top ones
        const topExpenseCategories = Object.values(categoryTotals)
          .sort((a, b) => b.amount - a.amount)
          .slice(0, 5);

        // Simplified revenue calculation (in a real app, you'd have a revenue model)
        // For now, let's assume revenue is 1.5x expenses for demonstration
        const totalRevenue = totalExpenses * 1.5;
        const prevYearRevenue = prevYearExpenses * 1.5;
        const revenuePercentChange = prevYearRevenue > 0 
          ? Math.round(((totalRevenue - prevYearRevenue) / prevYearRevenue) * 100) 
          : 0;

        // Calculate net profit
        const netProfit = totalRevenue - totalExpenses;
        const prevYearNetProfit = prevYearRevenue - prevYearExpenses;
        const netProfitPercentChange = prevYearNetProfit > 0 
          ? Math.round(((netProfit - prevYearNetProfit) / prevYearNetProfit) * 100) 
          : 0;

        return NextResponse.json({
          revenue: { total: totalRevenue, percentChange: revenuePercentChange },
          expenses: { total: totalExpenses, percentChange: expensePercentChange },
          netProfit: { total: netProfit, percentChange: netProfitPercentChange },
          topExpenseCategories,
        });
      } 
      
      // PREDICT EXPENSES
      else if (
        lowerQuery.includes("predict") || 
        lowerQuery.includes("forecast") || 
        lowerQuery.includes("next month")
      ) {
        // Get last 6 months of invoices for prediction
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
        
        const recentInvoices = await db.invoice.findMany({
          where: {
            userId: dbUser.id,
            issueDate: {
              gte: sixMonthsAgo,
            },
          },
          include: {
            vendor: true,
          },
          orderBy: {
            issueDate: 'desc',
          },
        });

        // Calculate average monthly expenses
        const monthlyTotals: number[] = [];
        const currentMonth = new Date();
        
        for (let i = 0; i < 6; i++) {
          const month = currentMonth.getMonth() - i;
          const year = currentMonth.getFullYear() + Math.floor(month / 12);
          const normalizedMonth = ((month % 12) + 12) % 12; // Handle negative months
          
          const startOfMonth = new Date(year, normalizedMonth, 1);
          const endOfMonth = new Date(year, normalizedMonth + 1, 0, 23, 59, 59);
          
          const monthInvoices = recentInvoices.filter(invoice => 
            invoice.issueDate && 
            invoice.issueDate >= startOfMonth && 
            invoice.issueDate <= endOfMonth
          );
          
          const monthTotal = monthInvoices.reduce((sum, invoice) => 
            sum + (invoice.amount || 0), 0);
          
          monthlyTotals.push(monthTotal);
        }
        
        // Calculate average and standard deviation
        const average = monthlyTotals.reduce((sum, val) => sum + val, 0) / monthlyTotals.length;
        const variance = monthlyTotals.reduce((sum, val) => sum + Math.pow(val - average, 2), 0) / monthlyTotals.length;
        const stdDev = Math.sqrt(variance);
        
        // Predict next month's expenses with a range
        const predictedMin = Math.round(average - stdDev);
        const predictedMax = Math.round(average + stdDev);
        
        // Calculate percentage change from last month
        const lastMonthExpenses = monthlyTotals[0];
        const percentageChange = lastMonthExpenses > 0 
          ? Math.round(((average - lastMonthExpenses) / lastMonthExpenses) * 100) 
          : 0;

        // Find upcoming significant expenses
        const nextMonth = new Date();
        nextMonth.setMonth(nextMonth.getMonth() + 1);
        
        // Look for annual or quarterly patterns
        const significantExpenses = [];
        
        // Check for recurring annual expenses (same month last year)
        const sameMonthLastYear = new Date(nextMonth.getFullYear() - 1, nextMonth.getMonth(), 1);
        const endOfSameMonthLastYear = new Date(sameMonthLastYear.getFullYear(), sameMonthLastYear.getMonth() + 1, 0, 23, 59, 59);
        
        const lastYearInvoices = await db.invoice.findMany({
          where: {
            userId: dbUser.id,
            issueDate: {
              gte: sameMonthLastYear,
              lte: endOfSameMonthLastYear,
            },
            amount: {
              gt: average * 0.2, // Only significant expenses (> 20% of monthly average)
            }
          },
          include: {
            vendor: true,
          },
        });
        
        for (const invoice of lastYearInvoices) {
          if (invoice.vendor && invoice.amount) {
            significantExpenses.push({
              description: `Annual payment to ${invoice.vendor.name}`,
              amount: invoice.amount,
            });
          }
        }
        
        // Add regular monthly expenses estimate
        significantExpenses.push({
          description: "Regular monthly expenses",
          amount: Math.round(average * 0.7), // Estimate 70% of average is regular expenses
        });

        return NextResponse.json({
          prediction: { min: predictedMin, max: predictedMax },
          percentageChange,
          significantExpenses,
        });
      }
      
      // DUPLICATE INVOICES
      else if (
        lowerQuery.includes("duplicate") || 
        lowerQuery.includes("same invoice")
      ) {
        const invoices = await db.invoice.findMany({
          where: {
            userId: dbUser.id,
          },
          include: {
            vendor: true,
          },
          orderBy: {
            issueDate: 'desc',
          },
        });

        // Find potential duplicates (similar amount, same vendor, close dates)
        const potentialDuplicates = [];
        const processed = new Set<string>();
        
        for (let i = 0; i < invoices.length; i++) {
          const invoice1 = invoices[i];
          if (processed.has(invoice1.id) || !invoice1.amount || !invoice1.vendor) continue;
          
          for (let j = i + 1; j < invoices.length; j++) {
            const invoice2 = invoices[j];
            if (processed.has(invoice2.id) || !invoice2.amount || !invoice2.vendor) continue;
            
            // Check if same vendor
            if (invoice1.vendorId !== invoice2.vendorId) continue;
            
            // Check if similar amount (within 1% difference)
            const amountDiff = Math.abs(invoice1.amount - invoice2.amount);
            const percentDiff = amountDiff / invoice1.amount;
            if (percentDiff > 0.01) continue; // More than 1% different
            
            // Check if issued within 30 days of each other
            const dateDiff = Math.abs(
              (invoice1.issueDate?.getTime() || 0) - 
              (invoice2.issueDate?.getTime() || 0)
            );
            if (dateDiff > 30 * 24 * 60 * 60 * 1000) continue; // More than 30 days apart
            
            // Found potential duplicate
            potentialDuplicates.push({
              original: invoice1,
              duplicate: invoice2,
            });
            
            processed.add(invoice1.id);
            processed.add(invoice2.id);
            break;
          }
        }

        return NextResponse.json({
          potentialDuplicates,
        });
      }

      // Default response if no specific query matches
      return NextResponse.json({ 
        message: "No specific data found for query. Try asking about recent invoices, vendors, financial reports, expense predictions, or duplicate invoices." 
      });
      
    } catch (dbError) {
      console.error("Database query error:", dbError);
      return NextResponse.json(
        { error: "Error querying database" },
        { status: 500 }
      );
    }
    
  } catch (error: unknown) {
    console.error("Error processing invoice query:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
    
    return NextResponse.json(
      { error: errorMessage || "Error processing your request" },
      { status: 500 }
    );
  }
} 