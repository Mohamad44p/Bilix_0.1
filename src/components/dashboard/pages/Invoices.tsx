"use client";

import { useState } from "react";
import { 
  Download, RefreshCw, RotateCw, Search, Filter, X, Sparkles
} from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { useInvoices } from "@/hooks/useInvoices";
import { InvoiceTable } from "@/components/dashboard/invoices/InvoiceTable";
import { BatchOperations } from "@/components/dashboard/invoices/BatchOperations";
import { AdvancedFilters } from "@/components/dashboard/invoices/AdvancedFilters";
import { AddInvoiceForm } from "@/components/dashboard/invoices/AddInvoiceForm";
import { InvoiceStatus, Invoice } from "@/lib/types";
import { ExportModal, ExportOptions } from "@/components/dashboard/invoices/ExportModal";
import * as invoiceService from "@/lib/services/invoice-service";
import * as exportService from "@/lib/services/export-service";
import { InvoiceFormData } from "@/components/dashboard/invoices/AddInvoiceForm";
import { useToast } from "@/components/ui/use-toast";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const Invoices = () => {
  const [showExportModal, setShowExportModal] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isAISearchMode, setIsAISearchMode] = useState(false);
  const { toast } = useToast();
  
  // Use the invoices hook to manage invoice data and operations
  const {
    invoices,
    loading,
    total,
    page,
    setPage,
    limit,
    status,
    setStatus,
    category,
    setCategory,
    tags,
    setTags,
    dateRange,
    setDateRange,
    naturalLanguageQuery,
    setNaturalLanguageQuery,
    selectedInvoiceIds,
    toggleInvoiceSelection,
    selectAllInvoices,
    processBatch,
    batchLoading,
    batchError,
    availableCategories,
    availableTags,
    filterSuggestions,
    refresh,
    setSearch,
  } = useInvoices({
    enableAutoRefresh: autoRefresh,
  });

  // Handle manual invoice creation
  const handleAddInvoice = async (formData: InvoiceFormData) => {
    try {
      // Convert string dates to Date objects if needed
      const invoiceData: Partial<Invoice> = {
        ...formData,
        issueDate: formData.issueDate ? new Date(formData.issueDate) : undefined,
        dueDate: formData.dueDate ? new Date(formData.dueDate) : undefined,
      };
      
      const newInvoice = await invoiceService.createInvoice(invoiceData as Omit<Invoice, 'id'>);
      
      toast({
        title: "Invoice created",
        description: `Invoice ${newInvoice.invoiceNumber || 'created'} successfully`,
      });
      
      refresh();
    } catch (error) {
      console.error("Failed to create invoice:", error);
      toast({
        title: "Error",
        description: "Failed to create invoice. Please try again.",
        variant: "destructive",
      });
    }
  };
  
  // Handle filter changes
  const handleFilterChange = (filters: {
    status?: InvoiceStatus;
    category?: string;
    tags?: string[];
    dateRange?: { start: string; end: string };
  }) => {
    if (filters.status !== undefined) setStatus(filters.status);
    if (filters.category !== undefined) setCategory(filters.category);
    if (filters.tags !== undefined) setTags(filters.tags);
    if (filters.dateRange !== undefined) setDateRange(filters.dateRange);
    setPage(1);
    
    // Show toast for applied filters
    const appliedFilters = [];
    if (filters.status) appliedFilters.push(`Status: ${filters.status}`);
    if (filters.category) appliedFilters.push(`Category: ${filters.category}`);
    if (filters.tags && filters.tags.length) appliedFilters.push(`Tags: ${filters.tags.join(', ')}`);
    if (filters.dateRange) appliedFilters.push(`Date Range: ${filters.dateRange.start} to ${filters.dateRange.end}`);
    
    if (appliedFilters.length > 0) {
      toast({
        title: "Filters applied",
        description: appliedFilters.join(', '),
      });
    }
  };

  // Handle batch operations
  const handleBatchApprove = async () => {
    if (selectedInvoiceIds.length === 0) {
      toast({
        title: "No invoices selected",
        description: "Please select at least one invoice to approve.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      await processBatch("approve");
      toast({
        title: "Invoices approved",
        description: `${selectedInvoiceIds.length} invoices marked as paid.`,
      });
    } catch (error) {
      console.error("Batch approve failed:", error);
      toast({
        title: "Operation failed",
        description: "Failed to approve invoices. Please try again.",
        variant: "destructive",
      });
    }
  };
  
  const handleBatchDelete = async () => {
    if (selectedInvoiceIds.length === 0) {
      toast({
        title: "No invoices selected",
        description: "Please select at least one invoice to delete.",
        variant: "destructive",
      });
      return;
    }
    
    if (!confirm(`Are you sure you want to delete ${selectedInvoiceIds.length} invoices? This action cannot be undone.`)) {
      return;
    }
    
    try {
      await processBatch("delete");
      toast({
        title: "Invoices deleted",
        description: `${selectedInvoiceIds.length} invoices have been deleted.`,
      });
    } catch (error) {
      console.error("Batch delete failed:", error);
      toast({
        title: "Operation failed",
        description: "Failed to delete invoices. Please try again.",
        variant: "destructive",
      });
    }
  };
  
  const handleBatchExport = async (options: ExportOptions) => {
    if (selectedInvoiceIds.length === 0 && !options.includeAll) {
      toast({
        title: "No invoices selected",
        description: "Please select invoices to export or choose 'Export All'.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      const result = await exportService.exportInvoices(
        options.includeAll ? [] : selectedInvoiceIds, 
        options
      );
      
      if (result.fileUrl) {
        // Trigger download
        exportService.downloadFile(result.fileUrl, result.fileName || 'invoices-export.xlsx');
        
        toast({
          title: "Export complete",
          description: `${options.includeAll ? 'All invoices' : selectedInvoiceIds.length + ' invoices'} exported successfully.`,
        });
      }
    } catch (error) {
      console.error("Export failed:", error);
      toast({
        title: "Export failed",
        description: "Failed to export invoices. Please try again.",
        variant: "destructive",
      });
    }
  };
  
  const handleBatchArchive = async () => {
    if (selectedInvoiceIds.length === 0) {
      toast({
        title: "No invoices selected",
        description: "Please select at least one invoice to archive.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      await processBatch("archive");
      toast({
        title: "Invoices archived",
        description: `${selectedInvoiceIds.length} invoices have been archived.`,
      });
    } catch (error) {
      console.error("Batch archive failed:", error);
      toast({
        title: "Operation failed",
        description: "Failed to archive invoices. Please try again.",
        variant: "destructive",
      });
    }
  };
  
  const handleBatchTag = async (tags: string[]) => {
    if (selectedInvoiceIds.length === 0) {
      toast({
        title: "No invoices selected",
        description: "Please select at least one invoice to tag.",
        variant: "destructive",
      });
      return;
    }
    
    if (tags.length === 0) {
      toast({
        title: "No tags specified",
        description: "Please specify at least one tag to add.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      await processBatch("tag", { tags });
      toast({
        title: "Tags added",
        description: `Tags added to ${selectedInvoiceIds.length} invoices.`,
      });
    } catch (error) {
      console.error("Batch tag failed:", error);
      toast({
        title: "Operation failed",
        description: "Failed to add tags. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Handle "Export" button in the header
  const handleExportClick = () => {
    setShowExportModal(true);
  };
  
  // Add toggle function for auto-refresh
  const toggleAutoRefresh = () => {
    setAutoRefresh(prev => !prev);
    toast({
      title: autoRefresh ? "Auto-refresh disabled" : "Auto-refresh enabled",
      description: autoRefresh 
        ? "Manual refresh required" 
        : "Invoices will update automatically every 30 seconds",
    });
  };
  
  // Calculate pagination data
  const totalPages = Math.ceil(total / limit);
  const startItem = total === 0 ? 0 : (page - 1) * limit + 1;
  const endItem = Math.min(page * limit, total);
  
  // Check if any filters are active
  const hasActiveFilters = !!status || !!category || (tags && tags.length > 0) || !!dateRange;

  return (
    <DashboardLayout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Invoices</h1>
          <p className="text-muted-foreground">
            View and manage all your invoices in one place
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={toggleAutoRefresh} className="relative">
            <RotateCw className={`h-4 w-4 mr-2 ${autoRefresh ? 'text-green-500' : ''}`} />
            {autoRefresh ? "Auto-syncing" : "Manual-sync"}
            {autoRefresh && (
              <span className="absolute top-0 right-0 h-2 w-2 rounded-full bg-green-500 animate-pulse"></span>
            )}
          </Button>
          <AddInvoiceForm 
            categories={availableCategories}
            onSubmit={handleAddInvoice}
          />
        </div>
      </div>

      <Card className="mb-6">
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-2 w-full sm:max-w-md relative">
              <div className="relative w-full">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder={isAISearchMode 
                    ? "Try 'Show overdue invoices from last month' or 'Find Amazon bills over $100'"
                    : "Search invoices by number, vendor or amount..."}
                  className="pl-9 pr-9"
                  value={isAISearchMode ? naturalLanguageQuery : searchQuery}
                  onChange={(e) => {
                    const query = e.target.value;
                    if (isAISearchMode) {
                      setNaturalLanguageQuery(query);
                      setSearch("");
                    } else {
                      setSearchQuery(query);
                      setSearch(query);
                      setNaturalLanguageQuery("");
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      refresh();
                    }
                  }}
                />
                {((isAISearchMode && naturalLanguageQuery) || (!isAISearchMode && searchQuery)) && (
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="absolute right-1 top-1 h-7 w-7"
                    onClick={() => {
                      if (isAISearchMode) {
                        setNaturalLanguageQuery("");
                      } else {
                        setSearchQuery("");
                        setSearch("");
                      }
                      refresh();
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant={isAISearchMode ? "default" : "ghost"}
                      size="icon"
                      className="flex-shrink-0"
                      onClick={() => {
                        console.log("Toggle clicked! Current AI mode:", isAISearchMode);
                        const newMode = !isAISearchMode;
                        setIsAISearchMode(newMode);
                        
                        if (newMode) {
                          console.log("Switching to AI mode");
                          toast({
                            title: "AI search activated",
                            description: "Try natural language queries like 'invoices from last month'"
                          });
                          
                          if (searchQuery) {
                            setNaturalLanguageQuery(searchQuery);
                            setSearchQuery("");
                          }
                          
                          setSearch("");
                        } else {
                          console.log("Switching from AI mode");
                          toast({
                            title: "Regular search activated",
                            description: "Using keyword-based search"
                          });
                          
                          if (naturalLanguageQuery) {
                            setSearchQuery(naturalLanguageQuery);
                            setSearch(naturalLanguageQuery);
                            setNaturalLanguageQuery("");
                          }
                        }
                      }}
                    >
                      <Sparkles className={`h-4 w-4 ${isAISearchMode ? 'text-primary-foreground' : 'text-muted-foreground'}`} />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{isAISearchMode ? "Switch to Regular Search" : "Enable AI Search"}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <Button 
                variant="outline" 
                size="icon" 
                className="flex-shrink-0"
                onClick={() => {
                  if (isAISearchMode) {
                    refresh();
                  } else if (searchQuery) {
                    refresh();
                  } else {
                    refresh();
                  }
                }}
                disabled={loading}
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              </Button>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-2">
              <Button variant={showAdvancedFilters ? "default" : "outline"} onClick={() => setShowAdvancedFilters(!showAdvancedFilters)} className="sm:w-auto">
                <Filter className="mr-2 h-4 w-4" />
                Filters
                {hasActiveFilters && <Badge className="ml-2">{status || category || (tags && tags.length) || (dateRange ? "Date" : "")}</Badge>}
              </Button>
              
              <Button variant="outline" onClick={handleExportClick}>
                <Download className="mr-2 h-4 w-4" /> Export
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Show advanced filters if enabled */}
          {showAdvancedFilters && (
            <div className="mb-4">
              <AdvancedFilters
                onFilterChange={handleFilterChange}
                availableCategories={availableCategories}
                availableTags={availableTags}
                filterSuggestions={filterSuggestions}
                activeFilters={{
                  status,
                  category,
                  tags,
                  dateRange,
                }}
              />
            </div>
          )}
        
          {/* Batch operations UI */}
          {selectedInvoiceIds.length > 0 && (
            <div className="mb-4">
              <BatchOperations
                selectedCount={selectedInvoiceIds.length}
                onBatchApprove={handleBatchApprove}
                onBatchDelete={handleBatchDelete}
                onBatchExport={handleBatchExport}
                onBatchArchive={handleBatchArchive}
                onBatchTag={handleBatchTag}
                isLoading={batchLoading}
                hasError={!!batchError}
                errorMessage={batchError?.message}
              />
            </div>
          )}
          
          {/* Invoices table */}
          <InvoiceTable
            invoices={invoices}
            selectedInvoiceIds={selectedInvoiceIds}
            onToggleSelection={toggleInvoiceSelection}
            onSelectAll={selectAllInvoices}
            loading={loading}
            onRefresh={refresh}
          />
          
          {/* Pagination */}
          {total > 0 && (
            <div className="flex items-center justify-between pt-4">
              <div className="text-sm text-muted-foreground">
                Showing <span className="font-medium">{startItem}</span> to{" "}
                <span className="font-medium">{endItem}</span>{" "}
                of <span className="font-medium">{total}</span> invoices
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page === 1 || loading}
                >
                  Previous
                </Button>
                <div className="text-sm font-medium">
                  Page {page} of {totalPages || 1}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(Math.min(totalPages, page + 1))}
                  disabled={page === totalPages || loading || totalPages === 0}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
          
          {/* Export Modal */}
          <ExportModal
            open={showExportModal}
            onClose={() => setShowExportModal(false)}
            onExport={handleBatchExport}
            selectedCount={selectedInvoiceIds.length}
          />
        </CardContent>
      </Card>
    </DashboardLayout>
  );
};

export default Invoices;