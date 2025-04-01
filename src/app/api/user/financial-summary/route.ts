import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import db from "@/db/db";
import { InvoiceStatus } from "@prisma/client";

export async function GET() {
  try {
    // Get authenticated Clerk user
    const user = await currentUser();
    
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user from database
    const dbUser = await db.user.findUnique({
      where: { clerkId: user.id },
    });

    if (!dbUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get current date info for period calculations
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    const currentDay = now.getDate();

    // Calculate period date ranges
    const firstDayThisMonth = new Date(currentYear, currentMonth, 1);
    const lastDayThisMonth = new Date(currentYear, currentMonth + 1, 0, 23, 59, 59);
    
    const firstDayLastMonth = new Date(currentYear, currentMonth - 1, 1);
    const lastDayLastMonth = new Date(currentYear, currentMonth, 0, 23, 59, 59);
    
    const firstDayThisYear = new Date(currentYear, 0, 1);
    const lastDayThisYear = new Date(currentYear, 11, 31, 23, 59, 59);

    // Get invoices for different time periods
    const [allInvoices, thisMonthInvoices, lastMonthInvoices, thisYearInvoices] = await Promise.all([
      // All invoices
      db.invoice.findMany({
        where: {
          userId: dbUser.id,
        },
        include: {
          vendor: {
            select: {
              name: true,
            },
          },
          category: {
            select: {
              name: true,
              color: true,
            },
          },
        },
        orderBy: {
          issueDate: 'desc',
        },
      }),
      
      // This month's invoices
      db.invoice.findMany({
        where: {
          userId: dbUser.id,
          issueDate: {
            gte: firstDayThisMonth,
            lte: lastDayThisMonth,
          },
        },
      }),
      
      // Last month's invoices
      db.invoice.findMany({
        where: {
          userId: dbUser.id,
          issueDate: {
            gte: firstDayLastMonth,
            lte: lastDayLastMonth,
          },
        },
      }),
      
      // This year's invoices
      db.invoice.findMany({
        where: {
          userId: dbUser.id,
          issueDate: {
            gte: firstDayThisYear,
            lte: lastDayThisYear,
          },
        },
      }),
    ]);

    // Calculate basic stats
    const totalAmount = allInvoices.reduce((sum, invoice) => sum + (invoice.amount || 0), 0);
    const thisMonthAmount = thisMonthInvoices.reduce((sum, invoice) => sum + (invoice.amount || 0), 0);
    const lastMonthAmount = lastMonthInvoices.reduce((sum, invoice) => sum + (invoice.amount || 0), 0);
    const thisYearAmount = thisYearInvoices.reduce((sum, invoice) => sum + (invoice.amount || 0), 0);
    
    // Calculate percentage change month-over-month
    const monthOverMonthChange = lastMonthAmount > 0 
      ? ((thisMonthAmount - lastMonthAmount) / lastMonthAmount) * 100 
      : 0;

    // Get overdue invoices
    const overdueInvoices = allInvoices.filter(invoice => 
      invoice.status === InvoiceStatus.OVERDUE
    );
    
    const overdueAmount = overdueInvoices.reduce((sum, invoice) => sum + (invoice.amount || 0), 0);

    // Get invoices due in the next 7 days
    const oneWeekFromNow = new Date(now);
    oneWeekFromNow.setDate(currentDay + 7);
    
    const upcomingDueInvoices = allInvoices.filter(invoice => 
      invoice.status === InvoiceStatus.PENDING && 
      invoice.dueDate && 
      invoice.dueDate > now && 
      invoice.dueDate <= oneWeekFromNow
    );
    
    const upcomingDueAmount = upcomingDueInvoices.reduce((sum, invoice) => sum + (invoice.amount || 0), 0);

    // Get top vendors by amount
    const vendorSummary = allInvoices.reduce((acc, invoice) => {
      if (!invoice.vendor || !invoice.amount) return acc;
      
      const vendorName = invoice.vendor.name;
      
      if (!acc[vendorName]) {
        acc[vendorName] = {
          name: vendorName,
          amount: 0,
          count: 0,
        };
      }
      
      acc[vendorName].amount += invoice.amount;
      acc[vendorName].count += 1;
      
      return acc;
    }, {} as Record<string, { name: string; amount: number; count: number }>);
    
    const topVendors = Object.values(vendorSummary)
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);

    // Get category breakdown
    const categoryBreakdown = allInvoices.reduce((acc, invoice) => {
      if (!invoice.category || !invoice.amount) return acc;
      
      const categoryName = invoice.category.name;
      
      if (!acc[categoryName]) {
        acc[categoryName] = {
          name: categoryName,
          color: invoice.category.color || "#cccccc",
          amount: 0,
          count: 0,
        };
      }
      
      acc[categoryName].amount += invoice.amount;
      acc[categoryName].count += 1;
      
      return acc;
    }, {} as Record<string, { name: string; color: string; amount: number; count: number }>);

    // Assemble the financial summary
    const financialSummary = {
      overview: {
        totalInvoices: allInvoices.length,
        totalAmount,
        thisMonthAmount,
        lastMonthAmount,
        thisYearAmount,
        monthOverMonthChange,
      },
      status: {
        paid: {
          count: allInvoices.filter(i => i.status === InvoiceStatus.PAID).length,
          amount: allInvoices.filter(i => i.status === InvoiceStatus.PAID)
            .reduce((sum, i) => sum + (i.amount || 0), 0),
        },
        pending: {
          count: allInvoices.filter(i => i.status === InvoiceStatus.PENDING).length,
          amount: allInvoices.filter(i => i.status === InvoiceStatus.PENDING)
            .reduce((sum, i) => sum + (i.amount || 0), 0),
        },
        overdue: {
          count: overdueInvoices.length,
          amount: overdueAmount,
        },
      },
      upcoming: {
        dueThisWeek: {
          count: upcomingDueInvoices.length,
          amount: upcomingDueAmount,
          invoices: upcomingDueInvoices.map(i => ({
            id: i.id,
            invoiceNumber: i.invoiceNumber,
            amount: i.amount,
            dueDate: i.dueDate,
            vendorName: i.vendor?.name,
          })),
        },
      },
      topVendors,
      categoryBreakdown: Object.values(categoryBreakdown)
        .sort((a, b) => b.amount - a.amount),
    };

    return NextResponse.json(financialSummary);
  } catch (error: unknown) {
    console.error("Error fetching financial summary:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
} 