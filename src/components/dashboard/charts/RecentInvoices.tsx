"use client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Clock, AlertCircle, XCircle } from "lucide-react";
import { Invoice, Vendor, Category } from "@prisma/client";
import Link from "next/link";

interface ExtendedInvoice extends Invoice {
  vendor?: Vendor | null;
  category?: Category | null;
}

interface RecentInvoicesProps {
  invoices: ExtendedInvoice[];
}

export default function RecentInvoices({ invoices }: RecentInvoicesProps) {
  const formatCurrency = (amount: number | null) => {
    if (amount === null) return "-";
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (date: Date | null) => {
    if (!date) return "-";
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "PAID":
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case "PENDING":
        return <Clock className="h-4 w-4 text-amber-500" />;
      case "OVERDUE":
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case "CANCELLED":
        return <XCircle className="h-4 w-4 text-gray-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PAID":
        return "bg-green-500/10 text-green-500";
      case "PENDING":
        return "bg-amber-500/10 text-amber-500";
      case "OVERDUE":
        return "bg-red-500/10 text-red-500";
      case "CANCELLED":
        return "bg-gray-500/10 text-gray-500";
      default:
        return "bg-gray-500/10 text-gray-500";
    }
  };

  // Function to get vendor initials for avatar
  const getVendorInitials = (vendorName: string | null) => {
    if (!vendorName) return "?";
    return vendorName
      .split(' ')
      .map(word => word[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();
  };

  return (
    <div className="space-y-4">
      {invoices.length === 0 ? (
        <div className="text-center py-10 text-muted-foreground">
          <p>No recent invoices found</p>
        </div>
      ) : (
        <div className="rounded-lg border">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground">Vendor</th>
                  <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground">Amount</th>
                  <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground">Status</th>
                  <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground">Date</th>
                  <th className="h-10 px-4 text-right align-middle font-medium text-muted-foreground">Category</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((invoice) => (
                  <tr key={invoice.id} className="border-b transition-colors hover:bg-muted/30">
                    <td className="p-4 align-middle">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9">
                          {invoice.vendor?.logoUrl ? (
                            <AvatarImage 
                              src={invoice.vendor.logoUrl} 
                              alt={invoice.vendor.name || 'Unknown'}
                            />
                          ) : null}
                          <AvatarFallback className="bg-primary/10 text-primary">
                            {getVendorInitials(invoice.vendorName || invoice.vendor?.name || null)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <Link 
                            href={`/dashboard/invoices/${invoice.id}`}
                            className="font-medium text-sm hover:underline"
                          >
                            {invoice.title || invoice.invoiceNumber || "Untitled Invoice"}
                          </Link>
                          <div className="text-xs text-muted-foreground">
                            {invoice.vendor?.name || invoice.vendorName || "Unknown vendor"}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 align-middle font-medium">
                      {formatCurrency(invoice.amount)}
                    </td>
                    <td className="p-4 align-middle">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(invoice.status)}
                        <Badge variant="secondary" className={getStatusColor(invoice.status)}>
                          {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1).toLowerCase()}
                        </Badge>
                      </div>
                    </td>
                    <td className="p-4 align-middle text-muted-foreground">
                      {formatDate(invoice.issueDate)}
                    </td>
                    <td className="p-4 align-middle text-right">
                      {invoice.category ? (
                        <Badge 
                          variant="outline" 
                          className="bg-muted/50"
                          style={{ 
                            color: invoice.category.color || undefined,
                            borderColor: invoice.category.color ? `${invoice.category.color}40` : undefined 
                          }}
                        >
                          {invoice.category.name}
                        </Badge>
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}