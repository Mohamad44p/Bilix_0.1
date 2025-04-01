import Dashboard from "@/components/dashboard/pages/Dashboard";
import { syncUserWithDatabase } from "@/lib/actions/user";
import { getUserInvoices } from "@/lib/actions/invoice";
import { 
  getDashboardStats, 
  getFinancialAlerts,
  getRevenueOverview,
  getCashFlowProjection,
  getRecentInvoices,
  type TimeframeOption
} from "@/lib/actions/dashboard";
import { Metadata } from "next";
import { Invoice } from "@prisma/client";

export const metadata: Metadata = {
  title: "Dashboard | Bilix",
  description: "View your financial overview, invoices and insights",
};

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: { timeframe?: TimeframeOption };
}) {
  // Default timeframe is 30d if not specified
  const timeframe = (searchParams.timeframe || "30d") as TimeframeOption;
  
  // Make sure user exists in database
  await syncUserWithDatabase();
  
  // Fetch all the dashboard data in parallel
  const [
    invoices,
    dashboardStats,
    financialAlerts,
    revenueOverviewData,
    cashFlowProjectionData,
    recentInvoices
  ] = await Promise.all([
    getUserInvoices(),
    getDashboardStats(timeframe),
    getFinancialAlerts(),
    getRevenueOverview(timeframe),
    getCashFlowProjection(),
    getRecentInvoices(5)
  ]);
  
  return (
    <Dashboard 
      timeframe={timeframe}
      invoices={invoices as Invoice[]}
      dashboardStats={dashboardStats}
      financialAlerts={financialAlerts}
      revenueOverviewData={revenueOverviewData}
      cashFlowProjectionData={cashFlowProjectionData}
      recentInvoices={recentInvoices}
    />
  );
}
