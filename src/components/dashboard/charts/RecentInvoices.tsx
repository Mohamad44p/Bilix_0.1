"use client";
import { useState } from "react";
import { 
  ArrowDown, ArrowUp, Check, Clock, Eye, MoreHorizontal, FileText, 
  AlertCircle, Download
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

// Mock data for recent invoices
const invoices = [
  {
    id: "INV-2023-001",
    amount: 2499.99,
    status: "paid",
    vendor: {
      name: "Acme Corp",
      logo: "https://api.dicebear.com/7.x/identicon/svg?seed=Acme",
    },
    date: "Jul 28, 2023",
    dueDate: "Aug 15, 2023",
  },
  {
    id: "INV-2023-002",
    amount: 1250.00,
    status: "pending",
    vendor: {
      name: "Globex Inc",
      logo: "https://api.dicebear.com/7.x/identicon/svg?seed=Globex",
    },
    date: "Jul 25, 2023",
    dueDate: "Aug 10, 2023",
  },
  {
    id: "INV-2023-003",
    amount: 3750.50,
    status: "overdue",
    vendor: {
      name: "Initech LLC",
      logo: "https://api.dicebear.com/7.x/identicon/svg?seed=Initech",
    },
    date: "Jul 20, 2023",
    dueDate: "Aug 03, 2023",
  },
  {
    id: "INV-2023-004",
    amount: 850.25,
    status: "paid",
    vendor: {
      name: "Umbrella Corp",
      logo: "https://api.dicebear.com/7.x/identicon/svg?seed=Umbrella",
    },
    date: "Jul 18, 2023",
    dueDate: "Aug 01, 2023",
  },
  {
    id: "INV-2023-005",
    amount: 5250.75,
    status: "pending",
    vendor: {
      name: "Stark Industries",
      logo: "https://api.dicebear.com/7.x/identicon/svg?seed=Stark",
    },
    date: "Jul 15, 2023",
    dueDate: "Jul 30, 2023",
  },
];

const RecentInvoices = () => {
  const [sortField, setSortField] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[250px]" onClick={() => handleSort("id")}>
              <div className="flex items-center gap-1 cursor-pointer">
                Invoice
                {sortField === "id" && (
                  sortDirection === "asc" ? (
                    <ArrowUp className="h-3 w-3" />
                  ) : (
                    <ArrowDown className="h-3 w-3" />
                  )
                )}
              </div>
            </TableHead>
            <TableHead onClick={() => handleSort("amount")}>
              <div className="flex items-center gap-1 cursor-pointer">
                Amount
                {sortField === "amount" && (
                  sortDirection === "asc" ? (
                    <ArrowUp className="h-3 w-3" />
                  ) : (
                    <ArrowDown className="h-3 w-3" />
                  )
                )}
              </div>
            </TableHead>
            <TableHead onClick={() => handleSort("status")}>
              <div className="flex items-center gap-1 cursor-pointer">
                Status
                {sortField === "status" && (
                  sortDirection === "asc" ? (
                    <ArrowUp className="h-3 w-3" />
                  ) : (
                    <ArrowDown className="h-3 w-3" />
                  )
                )}
              </div>
            </TableHead>
            <TableHead className="hidden md:table-cell" onClick={() => handleSort("date")}>
              <div className="flex items-center gap-1 cursor-pointer">
                Date
                {sortField === "date" && (
                  sortDirection === "asc" ? (
                    <ArrowUp className="h-3 w-3" />
                  ) : (
                    <ArrowDown className="h-3 w-3" />
                  )
                )}
              </div>
            </TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {invoices.map((invoice) => (
            <TableRow key={invoice.id}>
              <TableCell className="font-medium">
                <div className="flex items-center space-x-3">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={invoice.vendor.logo} alt={invoice.vendor.name} />
                    <AvatarFallback>{invoice.vendor.name.substring(0, 2)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium">{invoice.vendor.name}</p>
                    <p className="text-xs text-muted-foreground">{invoice.id}</p>
                  </div>
                </div>
              </TableCell>
              <TableCell>${invoice.amount.toLocaleString()}</TableCell>
              <TableCell>
                <Badge
                  variant="outline"
                  className={
                    invoice.status === "paid"
                      ? "bg-green-50 text-green-700 border-green-200 dark:bg-green-950/30 dark:text-green-400 dark:border-green-900"
                      : invoice.status === "pending"
                      ? "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-900"
                      : "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/30 dark:text-red-400 dark:border-red-900"
                  }
                >
                  <div className="flex items-center gap-1">
                    {invoice.status === "paid" ? (
                      <Check className="h-3 w-3" />
                    ) : invoice.status === "pending" ? (
                      <Clock className="h-3 w-3" />
                    ) : (
                      <AlertCircle className="h-3 w-3" />
                    )}
                    <span className="capitalize">{invoice.status}</span>
                  </div>
                </Badge>
              </TableCell>
              <TableCell className="hidden md:table-cell">
                <div className="flex flex-col">
                  <span className="text-xs">Issued: {invoice.date}</span>
                  <span className="text-xs text-muted-foreground">Due: {invoice.dueDate}</span>
                </div>
              </TableCell>
              <TableCell className="text-right">
                <div className="flex items-center justify-end space-x-1">
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <Download className="h-4 w-4" />
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuItem>
                        <FileText className="mr-2 h-4 w-4" /> View details
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Download className="mr-2 h-4 w-4" /> Download PDF
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem>
                        <Check className="mr-2 h-4 w-4" /> Mark as paid
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default RecentInvoices;