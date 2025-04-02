import { useState, useEffect, useCallback } from 'react';
import { Invoice, InvoiceStatus } from '@/lib/types';
import * as invoiceService from '@/lib/services/invoice-service';

interface UseInvoicesOptions {
  initialStatus?: InvoiceStatus;
  initialSearch?: string;
  initialCategory?: string;
  initialPage?: number;
  initialLimit?: number;
  initialTags?: string[];
  initialDateRange?: { start: string; end: string };
  enableAutoRefresh?: boolean;
}

interface InvoiceQueryParams {
  status?: InvoiceStatus;
  search?: string;
  category?: string;
  page: number;
  limit: number;
  tags?: string[];
  dateRange?: {
    start: string;
    end: string;
  };
  naturalLanguageQuery?: string;
}

export function useInvoices({
  initialStatus,
  initialSearch = '',
  initialCategory,
  initialPage = 1,
  initialLimit = 10,
  initialTags = [],
  initialDateRange,
  enableAutoRefresh = false,
}: UseInvoicesOptions = {}) {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [total, setTotal] = useState(0);
  
  // Filters and pagination state
  const [status, setStatus] = useState<InvoiceStatus | undefined>(initialStatus);
  const [search, setSearch] = useState(initialSearch);
  const [naturalLanguageQuery, setNaturalLanguageQuery] = useState('');
  const [category, setCategory] = useState(initialCategory);
  const [page, setPage] = useState(initialPage);
  const [limit, setLimit] = useState(initialLimit);
  const [tags, setTags] = useState(initialTags);
  const [dateRange, setDateRange] = useState(initialDateRange);
  
  // Selected invoices for batch operations
  const [selectedInvoiceIds, setSelectedInvoiceIds] = useState<string[]>([]);
  
  // Batch operation states
  const [batchLoading, setBatchLoading] = useState(false);
  const [batchError, setBatchError] = useState<Error | null>(null);
  
  // Categories and tags for filtering
  const [availableCategories, setAvailableCategories] = useState<string[]>([]);
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [filterSuggestions, setFilterSuggestions] = useState<Array<{
    category?: string;
    status?: InvoiceStatus;
    tags?: string[];
    dateRange?: { start: string; end: string };
  }>>([]);

  // Fetch invoices
  const fetchInvoices = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const params: InvoiceQueryParams = {
        status,
        search: search || undefined,
        category: category || undefined,
        page,
        limit,
        tags: tags.length > 0 ? tags : undefined,
        dateRange: dateRange ? {
          start: dateRange.start,
          end: dateRange.end,
        } : undefined,
        naturalLanguageQuery: naturalLanguageQuery || undefined,
      };
      
      // Only include the search parameter if not using natural language query
      if (naturalLanguageQuery && params.search) {
        params.search = undefined;
      }
      
      // Log the query parameters for debugging
      console.log('Fetching invoices with params:', params);
      
      const { data, total } = await invoiceService.getInvoices(params);
      setInvoices(data);
      setTotal(total);
    } catch (err) {
      console.error('Error fetching invoices:', err);
      setError(err instanceof Error ? err : new Error('An unknown error occurred'));
    } finally {
      setLoading(false);
    }
  }, [status, search, category, page, limit, tags, dateRange, naturalLanguageQuery]);

  // Fetch available categories and tags
  const fetchMetadata = useCallback(async () => {
    try {
      const [categories, tags] = await Promise.all([
        invoiceService.getCategories(),
        invoiceService.getTags(),
      ]);
      
      setAvailableCategories(categories.map(c => c.name));
      setAvailableTags(tags);
      
      // Simple filter suggestions based on available data
      // In a real system, this would be more sophisticated and personalized
      setFilterSuggestions([
        { status: 'OVERDUE' },
        { category: categories[0]?.name },
        { tags: [tags[0], tags[1]].filter(Boolean) },
        { dateRange: { start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], end: new Date().toISOString().split('T')[0] } },
      ]);
    } catch (err) {
      console.error('Failed to fetch metadata:', err);
    }
  }, []);

  // Auto-categorize invoice
  const autoCategorizeInvoice = useCallback(async (file: File | string, metadata?: Partial<Invoice>) => {
    try {
      return await invoiceService.autoCategorizeInvoice(file, metadata);
    } catch (err) {
      throw err instanceof Error ? err : new Error('Failed to auto-categorize invoice');
    }
  }, []);

  // Process batch operations
  const processBatch = useCallback(async (operation: 'approve' | 'delete' | 'export' | 'archive' | 'tag', additionalData?: Record<string, unknown>) => {
    if (selectedInvoiceIds.length === 0) {
      return;
    }
    
    setBatchLoading(true);
    setBatchError(null);
    
    try {
      const result = await invoiceService.batchProcessInvoices(
        operation,
        selectedInvoiceIds,
        additionalData
      );
      
      // Refresh invoices after batch operation
      await fetchInvoices();
      
      return result;
    } catch (err) {
      setBatchError(err instanceof Error ? err : new Error('Batch operation failed'));
      throw err;
    } finally {
      setBatchLoading(false);
    }
  }, [selectedInvoiceIds, fetchInvoices]);

  // Toggle selection of an invoice
  const toggleInvoiceSelection = useCallback((invoiceId: string) => {
    setSelectedInvoiceIds(prevSelected => {
      if (prevSelected.includes(invoiceId)) {
        return prevSelected.filter(id => id !== invoiceId);
      } else {
        return [...prevSelected, invoiceId];
      }
    });
  }, []);

  // Select all invoices on the current page
  const selectAllInvoices = useCallback(() => {
    if (selectedInvoiceIds.length === invoices.length) {
      setSelectedInvoiceIds([]);
    } else {
      setSelectedInvoiceIds(invoices.map(invoice => invoice.id));
    }
  }, [invoices, selectedInvoiceIds.length]);

  // Enhance natural language processing for advanced queries
  const processNaturalLanguageQuery = useCallback(async (query: string) => {
    if (!query.trim()) return;
    
    console.log("Processing natural language query:", query);
    setLoading(true);
    
    try {
      // Examples of queries that can be handled:
      // - "Show me invoices less than $1000"
      // - "Find all overdue invoices from last month"
      // - "Which vendors did I pay the most in December?"
      // - "Invoices from Amazon over $500 this year"
      
      // The actual API call will handle the parsing and return appropriate results
      const { data, total } = await invoiceService.getInvoices({
        naturalLanguageQuery: query,
        page,
        limit,
      });
      
      setInvoices(data);
      setTotal(total);
      
      // When using AI search, we clear other filters to avoid confusion
      // but don't update the UI state to maintain the filters for when switching back
      console.log(`AI search returned ${data.length} results out of ${total} total matches`);
      
    } catch (error) {
      console.error("Error processing natural language query:", error);
      setError(error instanceof Error ? error : new Error('Failed to process natural language query'));
    } finally {
      setLoading(false);
    }
  }, [page, limit]);

  // Update the effect to use the natural language processor when needed
  useEffect(() => {
    if (naturalLanguageQuery) {
      processNaturalLanguageQuery(naturalLanguageQuery);
    } else {
      fetchInvoices();
    }
  }, [naturalLanguageQuery, fetchInvoices, processNaturalLanguageQuery]);

  // Effect to fetch metadata on initial load
  useEffect(() => {
    fetchMetadata();
  }, [fetchMetadata]);

  // Set up auto-refresh if enabled
  useEffect(() => {
    if (!enableAutoRefresh) return;
    
    const interval = setInterval(() => {
      fetchInvoices();
    }, 30000); // Refresh every 30 seconds
    
    return () => clearInterval(interval);
  }, [enableAutoRefresh, fetchInvoices]);

  return {
    // Data and loading states
    invoices,
    loading,
    error,
    total,
    
    // Pagination and filtering
    page,
    setPage,
    limit,
    setLimit,
    status,
    setStatus,
    search,
    setSearch,
    category,
    setCategory,
    tags,
    setTags,
    dateRange,
    setDateRange,
    naturalLanguageQuery,
    setNaturalLanguageQuery,
    
    // Batch operations
    selectedInvoiceIds,
    toggleInvoiceSelection,
    selectAllInvoices,
    processBatch,
    batchLoading,
    batchError,
    
    // Metadata
    availableCategories,
    availableTags,
    filterSuggestions,
    
    // Actions
    refresh: fetchInvoices,
    autoCategorizeInvoice,
    
    // Expose the new natural language processor
    processNaturalLanguageQuery,
  };
} 