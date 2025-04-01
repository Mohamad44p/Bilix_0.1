import { useState } from "react";
import {
  Check,
  Clock,
  AlertCircle,
  Download,
  Eye,
  MoreHorizontal,
} from "lucide-react";
import { Invoice } from "@/lib/types";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
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
import * as invoiceService from "@/lib/services/invoice-service";
import * as exportService from "@/lib/services/export-service";
import { useToast } from "@/components/ui/use-toast";
import { Dialog, DialogContent } from "@/components/ui/dialog";

interface InvoiceTableProps {
  invoices: Invoice[];
  selectedInvoiceIds: string[];
  onToggleSelection: (invoiceId: string) => void;
  onSelectAll: () => void;
  loading?: boolean;
  onRefresh?: () => void;
}

export function InvoiceTable({
  invoices,
  selectedInvoiceIds,
  onToggleSelection,
  onSelectAll,
  loading = false,
  onRefresh,
}: InvoiceTableProps) {
  const { toast } = useToast();
  const [previewInvoice, setPreviewInvoice] = useState<Invoice | null>(null);
  
  const allSelected = 
    invoices.length > 0 && selectedInvoiceIds.length === invoices.length;
  const someSelected = 
    selectedInvoiceIds.length > 0 && selectedInvoiceIds.length < invoices.length;

  const getStatusBadge = (status: string) => {
    switch (status.toUpperCase()) {
      case "PAID":
        return (
          <Badge
            variant="outline"
            className="bg-green-50 text-green-700 border-green-200 dark:bg-green-950/30 dark:text-green-400 dark:border-green-900"
          >
            <div className="flex items-center gap-1">
              <Check className="h-3 w-3" />
              <span>Paid</span>
            </div>
          </Badge>
        );
      case "PENDING":
        return (
          <Badge
            variant="outline"
            className="bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-900"
          >
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              <span>Pending</span>
            </div>
          </Badge>
        );
      case "OVERDUE":
        return (
          <Badge
            variant="outline"
            className="bg-red-50 text-red-700 border-red-200 dark:bg-red-950/30 dark:text-red-400 dark:border-red-900"
          >
            <div className="flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />
              <span>Overdue</span>
            </div>
          </Badge>
        );
      default:
        return (
          <Badge variant="outline">
            <span className="capitalize">{status.toLowerCase()}</span>
          </Badge>
        );
    }
  };

  const getVendorLogo = (invoice: Invoice) => {
    // Get vendor logo or generate placeholder
    if (invoice.vendor?.logoUrl) {
      return invoice.vendor.logoUrl;
    }
    
    // Generate a placeholder using the vendor name
    const vendorName = invoice.vendorName || invoice.vendor?.name || "Unknown";
    return `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(vendorName)}`;
  };
  
  const handleViewInvoice = (invoice: Invoice) => {
    setPreviewInvoice(invoice);
  };
  
  const handleDownloadInvoice = async (invoice: Invoice) => {
    try {
      toast({
        title: "Invoice download started",
        description: `Downloading invoice ${invoice.invoiceNumber || invoice.id}`,
      });

      // Create export options using Excel format since PDF is not implemented yet
      const exportOptions = {
        format: 'excel' as const, // Use Excel since PDF is not implemented yet
        fields: [
          'invoiceNumber', 'vendorName', 'amount', 'currency', 
          'status', 'issueDate', 'dueDate', 'category', 'tags', 'notes'
        ],
        includeAll: false, // Only export this specific invoice
      };

      // Export the single invoice
      const result = await exportService.exportSingleInvoice(
        invoice.id, 
        exportOptions
      );
      
      // Trigger download using the export service helper
      if (result && result.fileUrl) {
        const fileName = result.fileName || `Invoice-${invoice.invoiceNumber || invoice.id}.xlsx`;
        exportService.downloadFile(result.fileUrl, fileName);
        
        toast({
          title: "Download complete",
          description: `Invoice ${invoice.invoiceNumber || invoice.id} has been downloaded as Excel spreadsheet`,
        });
      }
    } catch (err) {
      console.error("Download failed:", err);
      toast({
        title: "Download failed",
        description: "There was an error downloading the invoice. PDF format is not supported yet.",
        variant: "destructive",
      });
    }
  };
  
  const handleMarkAsPaid = async (invoice: Invoice) => {
    try {
      await invoiceService.updateInvoice(invoice.id, { status: 'PAID' });
      toast({
        title: "Invoice marked as paid",
        description: `Invoice ${invoice.invoiceNumber || invoice.id} has been marked as paid`,
      });
      if (onRefresh) onRefresh();
    } catch {
      toast({
        title: "Error",
        description: "Failed to update invoice status",
        variant: "destructive",
      });
    }
  };

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[40px]">
                <Checkbox
                  checked={allSelected}
                  data-state={someSelected ? "indeterminate" : undefined}
                  onCheckedChange={onSelectAll}
                  aria-label="Select all invoices"
                />
              </TableHead>
              <TableHead className="w-[250px]">Invoice</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Category</TableHead>
              <TableHead className="hidden md:table-cell">Date</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center">
                  <div className="flex justify-center items-center space-x-2">
                    <div className="animate-spin h-5 w-5 border-t-2 border-b-2 border-primary rounded-full"></div>
                    <span>Loading invoices...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : invoices.length > 0 ? (
              invoices.map((invoice) => (
                <TableRow key={invoice.id} className={selectedInvoiceIds.includes(invoice.id) ? "bg-muted/50" : ""}>
                  <TableCell>
                    <Checkbox
                      checked={selectedInvoiceIds.includes(invoice.id)}
                      onCheckedChange={() => onToggleSelection(invoice.id)}
                      aria-label={`Select invoice ${invoice.invoiceNumber || invoice.id}`}
                    />
                  </TableCell>
                  <TableCell className="font-medium">
                    <div className="flex items-center space-x-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={getVendorLogo(invoice)} alt={invoice.vendorName || "Vendor"} />
                        <AvatarFallback>
                          {(invoice.vendorName || "?").substring(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium">{invoice.vendorName || "Unknown Vendor"}</p>
                        <p className="text-xs text-muted-foreground">
                          {invoice.invoiceNumber || invoice.id.substring(0, 8)}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {invoice.amount
                      ? formatCurrency(invoice.amount, invoice.currency || "USD")
                      : "-"}
                  </TableCell>
                  <TableCell>{getStatusBadge(invoice.status)}</TableCell>
                  <TableCell>
                    {invoice.category?.name || invoice.categoryId || "-"}
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <div className="flex flex-col">
                      <span className="text-xs">
                        Issued: {invoice.issueDate ? formatDate(invoice.issueDate) : "-"}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        Due: {invoice.dueDate ? formatDate(invoice.dueDate) : "-"}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end space-x-1">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8"
                        onClick={() => handleViewInvoice(invoice)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8"
                        onClick={() => handleDownloadInvoice(invoice)}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem onClick={() => handleViewInvoice(invoice)}>
                            <Eye className="mr-2 h-4 w-4" /> View details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDownloadInvoice(invoice)}>
                            <Download className="mr-2 h-4 w-4" /> Download Excel
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            onClick={() => handleMarkAsPaid(invoice)}
                            disabled={invoice.status === 'PAID'}
                          >
                            <Check className="mr-2 h-4 w-4" /> Mark as paid
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center">
                  No invoices found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      
      {/* Invoice Preview Dialog */}
      <Dialog open={!!previewInvoice} onOpenChange={(open) => !open && setPreviewInvoice(null)}>
        <DialogContent className="max-w-3xl">
          {previewInvoice && (
            <div className="p-4">
              <h2 className="text-xl font-bold mb-4">Invoice Details</h2>
              
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <p className="text-sm text-muted-foreground">Vendor</p>
                  <p className="font-medium">{previewInvoice.vendorName || "Unknown"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Invoice Number</p>
                  <p className="font-medium">{previewInvoice.invoiceNumber || "-"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Amount</p>
                  <p className="font-medium">
                    {previewInvoice.amount
                      ? formatCurrency(previewInvoice.amount, previewInvoice.currency || "USD")
                      : "-"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <div className="mt-1">{getStatusBadge(previewInvoice.status)}</div>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Issue Date</p>
                  <p className="font-medium">
                    {previewInvoice.issueDate ? formatDate(previewInvoice.issueDate) : "-"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Due Date</p>
                  <p className="font-medium">
                    {previewInvoice.dueDate ? formatDate(previewInvoice.dueDate) : "-"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Category</p>
                  <p className="font-medium">{previewInvoice.category?.name || "-"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Tags</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {previewInvoice.tags && previewInvoice.tags.length > 0 ? (
                      previewInvoice.tags.map((tag, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-muted-foreground">No tags</span>
                    )}
                  </div>
                </div>
              </div>

              {previewInvoice.notes && (
                <div className="mb-6">
                  <p className="text-sm text-muted-foreground mb-1">Notes</p>
                  <p className="text-sm bg-muted/50 p-3 rounded-md">{previewInvoice.notes}</p>
                </div>
              )}
              
              <div className="flex justify-between mt-6">
                <Button 
                  variant="outline" 
                  onClick={() => handleDownloadInvoice(previewInvoice)}
                >
                  <Download className="mr-2 h-4 w-4" /> Download Excel
                </Button>
                {previewInvoice.status !== 'PAID' && (
                  <Button 
                    onClick={() => {
                      handleMarkAsPaid(previewInvoice);
                      setPreviewInvoice(null);
                    }}
                  >
                    <Check className="mr-2 h-4 w-4" /> Mark as Paid
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
} 