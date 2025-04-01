"use client";

import { useState } from "react";
import {
  Check,
  Clock,
  AlertCircle,
  Download,
  Eye,
  MoreHorizontal,
  Edit,
  Trash,
  Archive,
  CheckCircle,
  AlertTriangle,
  Receipt
} from "lucide-react";
import { Invoice, InvoiceStatus } from "@/lib/types";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
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
// import * as exportService from "@/lib/services/export-service";
import { useToast } from "@/components/ui/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface InvoiceTableProps {
  invoices: Invoice[];
  selectedInvoiceIds: string[];
  onToggleSelection: (invoiceId: string) => void;
  onSelectAll: (selected: boolean) => void;
  loading: boolean;
  onRefresh: () => void;
}

export function InvoiceTable({
  invoices,
  selectedInvoiceIds,
  onToggleSelection,
  onSelectAll,
  loading,
  onRefresh,
}: InvoiceTableProps) {
  const [previewInvoice, setPreviewInvoice] = useState<Invoice | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Invoice | null>(null);
  const [processing, setProcessing] = useState<{[key: string]: boolean}>({});
  const { toast } = useToast();
  
  const allSelected = invoices.length > 0 && selectedInvoiceIds.length === invoices.length;
  
  const handleStatusChange = async (invoice: Invoice, newStatus: string) => {
    setProcessing(prev => ({ ...prev, [invoice.id]: true }));
    
    try {
      await invoiceService.updateInvoice(invoice.id, { status: newStatus as InvoiceStatus });
      
      toast({
        title: "Status updated",
        description: `Invoice ${invoice.invoiceNumber || invoice.id} status changed to ${newStatus}`,
      });
      
      onRefresh();
    } catch (error) {
      console.error("Failed to update status:", error);
      toast({
        title: "Update failed",
        description: "Failed to update invoice status",
        variant: "destructive",
      });
    } finally {
      setProcessing(prev => ({ ...prev, [invoice.id]: false }));
    }
  };
  
  const handleDownload = async (invoice: Invoice) => {
    setProcessing(prev => ({ ...prev, [invoice.id]: true }));
    
    try {
      // Implement a simpler download approach using originalFileUrl
      if (invoice.originalFileUrl) {
        window.open(invoice.originalFileUrl, '_blank');
        
        toast({
          title: "Download initiated",
          description: "Your file is being downloaded",
        });
      } else {
        throw new Error("No file URL available");
      }
    } catch (error) {
      console.error("Download failed:", error);
      toast({
        title: "Download failed",
        description: "Failed to download invoice",
        variant: "destructive",
      });
    } finally {
      setProcessing(prev => ({ ...prev, [invoice.id]: false }));
    }
  };
  
  const handleDelete = async (invoice: Invoice) => {
    setProcessing(prev => ({ ...prev, [invoice.id]: true }));
    setConfirmDelete(null);
    
    try {
      await invoiceService.deleteInvoice(invoice.id);
      
      toast({
        title: "Invoice deleted",
        description: `Invoice ${invoice.invoiceNumber || invoice.id} has been deleted`,
      });
      
      onRefresh();
    } catch (error) {
      console.error("Delete failed:", error);
      toast({
        title: "Delete failed",
        description: "Failed to delete invoice",
        variant: "destructive",
      });
    } finally {
      setProcessing(prev => ({ ...prev, [invoice.id]: false }));
    }
  };
  
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

  // Render loading state
  if (loading && invoices.length === 0) {
    return (
      <div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[40px]">
                <Checkbox disabled />
              </TableHead>
              <TableHead>Invoice</TableHead>
              <TableHead>Vendor</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Category</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: 5 }).map((_, i) => (
              <TableRow key={i} className="animate-pulse">
                <TableCell>
                  <Checkbox disabled />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-5 w-28" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-5 w-24" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-5 w-20" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-5 w-16" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-6 w-20 rounded-full" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-5 w-16" />
                </TableCell>
                <TableCell className="flex justify-end">
                  <Skeleton className="h-8 w-8 rounded-full" />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  }

  // Render empty state
  if (invoices.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="flex justify-center">
          <Receipt className="h-12 w-12 text-muted-foreground mb-4" />
        </div>
        <h3 className="text-lg font-medium mb-2">No invoices found</h3>
        <p className="text-muted-foreground mb-6">
          No invoices match your current search or filters
        </p>
        <Button onClick={onRefresh} variant="outline">
          Refresh
        </Button>
      </div>
    );
  }

  return (
    <div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[40px]">
              <Checkbox 
                checked={allSelected}
                onCheckedChange={onSelectAll}
              />
            </TableHead>
            <TableHead>Invoice</TableHead>
            <TableHead>Vendor</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Category</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {invoices.map((invoice) => (
            <TableRow 
              key={invoice.id}
              className={cn({
                "bg-primary/5": selectedInvoiceIds.includes(invoice.id),
                "opacity-70": processing[invoice.id]
              })}
            >
              <TableCell>
                <Checkbox 
                  checked={selectedInvoiceIds.includes(invoice.id)}
                  onCheckedChange={() => onToggleSelection(invoice.id)}
                  disabled={processing[invoice.id]}
                />
              </TableCell>
              <TableCell>
                <div className="font-medium">
                  {invoice.invoiceNumber || `INV-${invoice.id.slice(0, 6)}`}
                </div>
                {invoice.description && (
                  <div className="text-sm text-muted-foreground line-clamp-1">
                    {invoice.description}
                  </div>
                )}
              </TableCell>
              <TableCell>
                <div className="font-medium">{invoice.vendor?.name || "Unknown"}</div>
                {invoice.vendor?.email && (
                  <div className="text-xs text-muted-foreground">
                    {invoice.vendor.email}
                  </div>
                )}
              </TableCell>
              <TableCell>
                <div>{formatDate(invoice.issueDate || new Date())}</div>
                {invoice.dueDate && (
                  <div className="text-xs text-muted-foreground">
                    Due: {formatDate(invoice.dueDate)}
                  </div>
                )}
              </TableCell>
              <TableCell className="font-medium">
                {formatCurrency(invoice.amount || 0)}
                {invoice.taxAmount && (
                  <div className="text-xs text-muted-foreground">
                    Tax: {formatCurrency(invoice.taxAmount)}
                  </div>
                )}
              </TableCell>
              <TableCell>
                {getStatusBadge(invoice.status)}
              </TableCell>
              <TableCell>
                {invoice.category ? (
                  <Badge variant="secondary">{invoice.category.name}</Badge>
                ) : (
                  <span className="text-muted-foreground text-sm">Uncategorized</span>
                )}
                {invoice.tags && invoice.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {invoice.tags.slice(0, 2).map((tag) => (
                      <Badge key={tag} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                    {invoice.tags.length > 2 && (
                      <Badge variant="outline" className="text-xs">
                        +{invoice.tags.length - 2}
                      </Badge>
                    )}
                  </div>
                )}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setPreviewInvoice(invoice)}
                    disabled={processing[invoice.id]}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDownload(invoice)}
                    disabled={processing[invoice.id]}
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" disabled={processing[invoice.id]}>
                        {processing[invoice.id] ? (
                          <span className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
                        ) : (
                          <MoreHorizontal className="h-4 w-4" />
                        )}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => setPreviewInvoice(invoice)}>
                        <Eye className="mr-2 h-4 w-4" /> Preview
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleDownload(invoice)}>
                        <Download className="mr-2 h-4 w-4" /> Download
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild className="cursor-default">
                        <span className="text-xs text-muted-foreground px-2 py-1.5">
                          Status
                        </span>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleStatusChange(invoice, 'paid')}>
                        <CheckCircle className="mr-2 h-4 w-4 text-green-500" /> Mark as Paid
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleStatusChange(invoice, 'pending')}>
                        <Clock className="mr-2 h-4 w-4 text-amber-500" /> Mark as Pending
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleStatusChange(invoice, 'overdue')}>
                        <AlertTriangle className="mr-2 h-4 w-4 text-red-500" /> Mark as Overdue
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Button variant="ghost" size="sm" className="w-full justify-start px-2" onClick={() => {/* Add Edit Handler */}}>
                          <Edit className="mr-2 h-4 w-4" /> Edit
                        </Button>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Button variant="ghost" size="sm" className="w-full justify-start px-2" onClick={() => handleStatusChange(invoice, 'archived')}>
                          <Archive className="mr-2 h-4 w-4" /> Archive
                        </Button>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Button variant="ghost" size="sm" className="w-full justify-start px-2 text-red-500 hover:text-red-500 hover:bg-red-50" onClick={() => setConfirmDelete(invoice)}>
                          <Trash className="mr-2 h-4 w-4" /> Delete
                        </Button>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      
      {/* Invoice Preview Dialog */}
      <Dialog open={!!previewInvoice} onOpenChange={(open) => !open && setPreviewInvoice(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-auto">
          {previewInvoice && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Receipt className="h-5 w-5" />
                  Invoice {previewInvoice.invoiceNumber || `#${previewInvoice.id.slice(0, 8)}`}
                </DialogTitle>
                <DialogDescription>
                  From {previewInvoice.vendor?.name || "Unknown Vendor"} • Issued {formatDate(previewInvoice.issueDate || new Date())}
                </DialogDescription>
              </DialogHeader>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Invoice Details</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 pt-0">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Invoice #:</span>
                      <span className="text-sm font-medium">{previewInvoice.invoiceNumber || `INV-${previewInvoice.id.slice(0, 6)}`}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Issue Date:</span>
                      <span className="text-sm">{formatDate(previewInvoice.issueDate || new Date())}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Due Date:</span>
                      <span className="text-sm">{previewInvoice.dueDate ? formatDate(previewInvoice.dueDate) : "N/A"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Status:</span>
                      <span className="text-sm">{getStatusBadge(previewInvoice.status)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Category:</span>
                      <span className="text-sm">
                        {previewInvoice.category ? (
                          <Badge variant="secondary">{previewInvoice.category.name}</Badge>
                        ) : (
                          <span className="text-sm text-muted-foreground">Uncategorized</span>
                        )}
                      </span>
                    </div>
                    {previewInvoice.tags && previewInvoice.tags.length > 0 && (
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Tags:</span>
                        <div className="flex flex-wrap gap-1 justify-end">
                          {previewInvoice.tags.map((tag) => (
                            <Badge key={tag} variant="outline" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Vendor Details</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 pt-0">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Vendor:</span>
                      <span className="text-sm font-medium">{previewInvoice.vendor?.name || "Unknown"}</span>
                    </div>
                    {previewInvoice.vendor?.email && (
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Email:</span>
                        <span className="text-sm">{previewInvoice.vendor.email}</span>
                      </div>
                    )}
                    {previewInvoice.vendor?.phone && (
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Phone:</span>
                        <span className="text-sm">{previewInvoice.vendor.phone}</span>
                      </div>
                    )}
                    {previewInvoice.vendor?.address && (
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Address:</span>
                        <span className="text-sm">{previewInvoice.vendor.address}</span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              <div className="border rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Description</TableHead>
                      <TableHead className="text-right">Quantity</TableHead>
                      <TableHead className="text-right">Unit Price</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(previewInvoice.extractedData?.items as { 
                      description: string; 
                      quantity: number; 
                      unitPrice: number; 
                      totalPrice: number;
                    }[] || []).length > 0 ? (
                      (previewInvoice.extractedData?.items as { 
                        description: string; 
                        quantity: number; 
                        unitPrice: number; 
                        totalPrice: number;
                      }[]).map((item, index) => (
                        <TableRow key={index}>
                          <TableCell>{item.description}</TableCell>
                          <TableCell className="text-right">{item.quantity}</TableCell>
                          <TableCell className="text-right">{formatCurrency(item.unitPrice)}</TableCell>
                          <TableCell className="text-right">{formatCurrency(item.totalPrice)}</TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center text-muted-foreground">
                          No line items available
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>

                <div className="p-4 border-t">
                  <div className="flex justify-between mb-2">
                    <span className="text-muted-foreground">Subtotal:</span>
                    <span>{formatCurrency((previewInvoice.amount || 0) - (previewInvoice.taxAmount || 0))}</span>
                  </div>
                  {previewInvoice.taxAmount && (
                    <div className="flex justify-between mb-2">
                      <span className="text-muted-foreground">Tax:</span>
                      <span>{formatCurrency(previewInvoice.taxAmount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold">
                    <span>Total:</span>
                    <span>{formatCurrency(previewInvoice.amount || 0)}</span>
                  </div>
                </div>
              </div>

              {previewInvoice.notes && (
                <div className="mt-4">
                  <h4 className="text-sm font-medium mb-2">Notes</h4>
                  <p className="text-sm text-muted-foreground">{previewInvoice.notes}</p>
                </div>
              )}

              <DialogFooter className="flex gap-2 mt-4">
                <Button variant="outline" onClick={() => setPreviewInvoice(null)}>
                  Close
                </Button>
                <Button variant="outline" onClick={() => handleDownload(previewInvoice)}>
                  <Download className="mr-2 h-4 w-4" /> Download
                </Button>
                <Button onClick={() => {
                  setPreviewInvoice(null);
                  handleStatusChange(
                    previewInvoice, 
                    previewInvoice.status.toUpperCase() === 'PAID' ? 'PENDING' : 'PAID'
                  );
                }}>
                  {previewInvoice.status.toUpperCase() === 'PAID' ? (
                    <>
                      <Clock className="mr-2 h-4 w-4" /> Mark as Pending
                    </>
                  ) : (
                    <>
                      <CheckCircle className="mr-2 h-4 w-4" /> Mark as Paid
                    </>
                  )}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
      <Dialog open={!!confirmDelete} onOpenChange={(open) => !open && setConfirmDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete invoice {confirmDelete?.invoiceNumber || `#${confirmDelete?.id.slice(0, 8)}`}?
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4 flex gap-2">
            <Button variant="outline" onClick={() => setConfirmDelete(null)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={() => confirmDelete && handleDelete(confirmDelete)}
              disabled={confirmDelete ? processing[confirmDelete.id] : false}
            >
              {confirmDelete && processing[confirmDelete.id] ? (
                <span className="animate-spin h-4 w-4 mr-2 border-2 border-current border-t-transparent rounded-full" />
              ) : null}
              Delete Invoice
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 