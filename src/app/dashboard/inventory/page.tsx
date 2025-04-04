import { Metadata } from "next";
import InventoryPage from "@/components/dashboard/pages/Inventory";

export const metadata: Metadata = {
  title: "Inventory Management | Bilix",
  description: "Manage your inventory items and track stock levels",
};

export default function InventoryDashboardPage() {
  return <InventoryPage />;
}
