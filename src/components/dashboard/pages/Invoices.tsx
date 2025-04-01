"use client";

import { useState } from "react";
import { 
  Download, RefreshCw
} from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { useInvoices } from "@/hooks/useInvoices";
import { InvoiceTable } from "@/components/dashboard/invoices/InvoiceTable";
import { SmartSearch } from "@/components/dashboard/invoices/SmartSearch";
import { BatchOperations } from "@/components/dashboard/invoices/BatchOperations";
import { AdvancedFilters } from "@/components/dashboard/invoices/AdvancedFilters";
import { AutoProcessor } from "@/components/dashboard/invoices/AutoProcessor";
import { AddInvoiceForm } from "@/components/dashboard/invoices/AddInvoiceForm";
import { InvoiceStatus, Invoice } from "@/lib/types";
import { ExportModal, ExportOptions } from "@/components/dashboard/invoices/ExportModal";
import * as invoiceService from "@/lib/services/invoice-service";
import * as exportService from "@/lib/services/export-service";
import { InvoiceFormData } from "@/components/dashboard/invoices/AddInvoiceForm";

const Invoices = () => {
  const [showAutoProcessor, setShowAutoProcessor] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  
  // Use the invoices hook to manage invoice data and operations
  const {
    invoices,
    loading,
    total,
    page,
    setPage,
    limit,
    search,
    setSearch,
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
  } = useInvoices({
    enableAutoRefresh: false,
  });
  
  // Handle regular search
  const handleSearch = (query: string) => {
    setSearch(query);
    setNaturalLanguageQuery("");
    setPage(1);
  };
  
  // Handle AI-powered natural language search
  const handleNaturalLanguageSearch = (query: string) => {
    setNaturalLanguageQuery(query);
    setSearch("");
    setPage(1);
  };
  
  // Handle manual invoice creation
  const handleAddInvoice = async (formData: InvoiceFormData) => {
    try {
      // Convert string dates to Date objects if needed
      const invoiceData: Partial<Invoice> = {
        ...formData,
        issueDate: formData.issueDate ? new Date(formData.issueDate) : undefined,
        dueDate: formData.dueDate ? new Date(formData.dueDate) : undefined,
      };
      
      await invoiceService.createInvoice(invoiceData as Omit<Invoice, 'id'>);
      refresh();
    } catch (error) {
      console.error("Failed to create invoice:", error);
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
  };

  // Handle batch operations
  const handleBatchApprove = async () => {
    await processBatch("approve");
  };
  
  const handleBatchDelete = async () => {
    await processBatch("delete");
  };
  
  const handleBatchExport = async (options: ExportOptions) => {
    try {
      const result = await exportService.exportInvoices(selectedInvoiceIds, options);
      exportService.downloadFile(result.fileUrl, result.fileName);
    } catch (error) {
      console.error("Export failed:", error);
    }
  };
  
  const handleBatchArchive = async () => {
    await processBatch("archive");
  };
  
  const handleBatchTag = async (tags: string[]) => {
    await processBatch("tag", { tags });
  };

  // Handle "Export" button in the header
  const handleExportClick = () => {
    setShowExportModal(true);
  };
  
  // Calculate pagination data
  const totalPages = Math.ceil(total / limit);
  const startItem = total === 0 ? 0 : (page - 1) * limit + 1;
  const endItem = Math.min(page * limit, total);

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
          <Button onClick={() => setShowAutoProcessor(!showAutoProcessor)}>
            {showAutoProcessor ? "Hide AI Features" : "Show AI Features"}
          </Button>
          <AddInvoiceForm 
            categories={availableCategories}
            onSubmit={handleAddInvoice}
          />
        </div>
      </div>

      {/* AI Auto-processing section */}
      {showAutoProcessor && (
        <div className="mb-6">
          <AutoProcessor onComplete={refresh} />
        </div>
      )}

      <Card className="mb-6">
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-2 w-full sm:max-w-md">
              <div className="relative w-full">
                <SmartSearch
                  onSearch={handleSearch}
                  onNaturalLanguageSearch={handleNaturalLanguageSearch}
                  initialValue={search || naturalLanguageQuery}
                />
              </div>
              <Button 
                variant="outline" 
                size="icon" 
                className="flex-shrink-0"
                onClick={refresh}
                disabled={loading}
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              </Button>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-2">
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
              
              <Button variant="outline" onClick={handleExportClick}>
                <Download className="mr-2 h-4 w-4" /> Export
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
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