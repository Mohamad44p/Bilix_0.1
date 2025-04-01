import Dashboard from "@/components/dashboard/pages/Dashboard";
import React from "react";
import { syncUserWithDatabase } from "@/lib/actions/user";
import { getUserInvoices } from "@/lib/actions/invoice";

export default async function DashboardPage() {
  await syncUserWithDatabase();
  
  const invoices = await getUserInvoices();
  
  return <Dashboard invoices={invoices} />;
}
