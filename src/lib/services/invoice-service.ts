import { Invoice, InvoiceStatus, InvoiceCategory } from '@/lib/types';

// API endpoints
const ENDPOINTS = {
  INVOICES: '/api/invoices',
  CATEGORIES: '/api/invoices/categories',
  TAGS: '/api/invoices/tags',
  BATCH: '/api/invoices/batch',
};

// Get all invoices with optional filtering
export async function getInvoices(params?: { 
  status?: InvoiceStatus, 
  search?: string, 
  category?: string,
  page?: number,
  limit?: number,
  tags?: string[],
  dateRange?: { start: string, end: string },
  naturalLanguageQuery?: string
}): Promise<{ data: Invoice[], total: number }> {
  const queryParams = new URLSearchParams();
  
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        if (key === 'tags' && Array.isArray(value)) {
          value.forEach(tag => queryParams.append('tags', tag));
        } else if (key === 'dateRange' && typeof value === 'object' && !Array.isArray(value) && 'start' in value && 'end' in value) {
          queryParams.append('startDate', value.start);
          queryParams.append('endDate', value.end);
        } else {
          queryParams.append(key, String(value));
        }
      }
    });
  }

  const response = await fetch(`${ENDPOINTS.INVOICES}?${queryParams.toString()}`);
  
  if (!response.ok) {
    throw new Error('Failed to fetch invoices');
  }
  
  const responseData = await response.json();
  
  // Handle the API response format which returns { invoices, pagination }
  return { 
    data: responseData.invoices || [], 
    total: responseData.pagination?.total || 0 
  };
}

// Get a single invoice by ID
export async function getInvoiceById(id: string): Promise<Invoice> {
  const response = await fetch(`${ENDPOINTS.INVOICES}/${id}`);
  
  if (!response.ok) {
    throw new Error(`Failed to fetch invoice with ID: ${id}`);
  }
  
  return response.json();
}

// Create a new invoice
export async function createInvoice(invoice: Omit<Invoice, 'id'>): Promise<Invoice> {
  const response = await fetch(ENDPOINTS.INVOICES, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(invoice),
  });
  
  if (!response.ok) {
    throw new Error('Failed to create invoice');
  }
  
  return response.json();
}

// Update an existing invoice
export async function updateInvoice(id: string, data: Partial<Invoice>): Promise<Invoice> {
  const response = await fetch(`${ENDPOINTS.INVOICES}/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  
  if (!response.ok) {
    throw new Error(`Failed to update invoice with ID: ${id}`);
  }
  
  return response.json();
}

// Delete an invoice
export async function deleteInvoice(id: string): Promise<void> {
  const response = await fetch(`${ENDPOINTS.INVOICES}/${id}`, {
    method: 'DELETE',
  });
  
  if (!response.ok) {
    throw new Error(`Failed to delete invoice with ID: ${id}`);
  }
}

// Batch operations
export async function batchProcessInvoices(
  operation: 'approve' | 'delete' | 'export' | 'archive' | 'tag',
  invoiceIds: string[],
  additionalData?: Record<string, unknown>
): Promise<{ success: boolean, processedIds: string[], failedIds: string[] }> {
  const response = await fetch(ENDPOINTS.BATCH, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      operation,
      invoiceIds,
      ...additionalData,
    }),
  });
  
  if (!response.ok) {
    throw new Error('Failed to process batch operation');
  }
  
  return response.json();
}

// Auto-categorize invoice
export async function autoCategorizeInvoice(
  fileData: File | string, 
  existingInvoiceData?: Partial<Invoice>
): Promise<{ 
  categories: InvoiceCategory[], 
  tags: string[], 
  isDuplicate: boolean,
  duplicateOf?: string,
  extractedData: Partial<Invoice>
}> {
  const formData = new FormData();
  
  if (typeof fileData === 'string') {
    formData.append('fileUrl', fileData);
  } else {
    formData.append('file', fileData);
  }
  
  if (existingInvoiceData) {
    formData.append('metadata', JSON.stringify(existingInvoiceData));
  }
  
  const response = await fetch(`${ENDPOINTS.INVOICES}/auto-categorize`, {
    method: 'POST',
    body: formData,
  });
  
  if (!response.ok) {
    throw new Error('Failed to auto-categorize invoice');
  }
  
  return response.json();
}

// Get available categories
export async function getCategories(): Promise<InvoiceCategory[]> {
  const response = await fetch(ENDPOINTS.CATEGORIES);
  
  if (!response.ok) {
    throw new Error('Failed to fetch categories');
  }
  
  return response.json();
}

// Get available tags
export async function getTags(): Promise<string[]> {
  const response = await fetch(ENDPOINTS.TAGS);
  
  if (!response.ok) {
    throw new Error('Failed to fetch tags');
  }
  
  return response.json();
} 