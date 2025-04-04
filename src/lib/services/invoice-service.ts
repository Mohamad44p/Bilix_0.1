import { Invoice, InvoiceStatus, Category as InvoiceCategory, InvoiceType, InvoiceLineItem } from '@/lib/types';

// API endpoints
const ENDPOINTS = {
  INVOICES: '/api/invoices',
  CATEGORIES: '/api/invoices/categories',
  TAGS: '/api/invoices/tags',
  BATCH: '/api/invoices/batch',
  LINE_ITEMS: '/api/invoices/line-items',
  INVENTORY: '/api/invoices/inventory',
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
  try {
    console.log(`Updating invoice ${id} with data:`, JSON.stringify(data, null, 2));

    // Normalize the status to uppercase if it exists
    if (data.status) {
      data.status = data.status.toUpperCase() as InvoiceStatus;
      console.log(`Normalized status to: ${data.status}`);
    }
    
    // Simplify the update payload to only include what we need to change
    const updateData: Record<string, any> = {};
    
    // Only include fields that are actually provided
    Object.keys(data).forEach(key => {
      if (data[key as keyof typeof data] !== undefined) {
        updateData[key] = data[key as keyof typeof data];
      }
    });
    
    console.log(`Simplified update data:`, JSON.stringify(updateData, null, 2));
    
    const response = await fetch(`${ENDPOINTS.INVOICES}/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updateData),
    });
    
    if (!response.ok) {
      let errorMessage = `Failed to update invoice with ID: ${id}`;
      let errorData;
      
      try {
        errorData = await response.json();
        console.error("API error response:", errorData);
        if (errorData && errorData.error) {
          errorMessage += ` - ${errorData.error}`;
        }
        if (errorData && errorData.details) {
          errorMessage += ` (${errorData.details})`;
        }
      } catch (parseError) {
        console.error("Could not parse error response:", parseError);
        errorMessage += ` - Status: ${response.status} ${response.statusText}`;
      }
      
      throw new Error(errorMessage);
    }
    
    const updatedInvoice = await response.json();
    console.log(`Successfully updated invoice ${id}`);
    return updatedInvoice;
  } catch (error) {
    console.error("Update invoice error:", error);
    throw error;
  }
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
  try {
    // Normalize operation name
    const normalizedOperation = operation.toLowerCase();
    
    // Validate invoiceIds
    if (!invoiceIds || invoiceIds.length === 0) {
      throw new Error('No invoice IDs provided for batch operation');
    }
    
    console.log(`Starting batch operation '${normalizedOperation}' on ${invoiceIds.length} invoices`);
    
    const response = await fetch(ENDPOINTS.BATCH, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        operation: normalizedOperation,
        invoiceIds,
        ...(additionalData || {}),
      }),
    });
    
    if (!response.ok) {
      let errorMessage = `Batch operation '${operation}' failed`;
      try {
        const errorData = await response.json();
        console.error("Batch API error:", errorData);
        if (errorData?.error) {
          errorMessage += `: ${errorData.error}`;
        } else {
          errorMessage += `: ${response.status} ${response.statusText}`;
        }
      } catch (parseError) {
        console.error("Could not parse batch error response");
        errorMessage += `: ${response.status} ${response.statusText}`;
      }
      
      throw new Error(errorMessage);
    }
    
    const result = await response.json();
    console.log(`Batch operation '${normalizedOperation}' completed:`, result);
    return result;
  } catch (error) {
    console.error(`Batch operation '${operation}' error:`, error);
    throw error;
  }
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

// Save an invoice line item
export async function saveInvoiceLineItem(invoiceId: string, lineItem: InvoiceLineItem): Promise<InvoiceLineItem> {
  const response = await fetch(`${ENDPOINTS.LINE_ITEMS}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      invoiceId,
      ...lineItem
    }),
  });
  
  if (!response.ok) {
    throw new Error(`Failed to save line item for invoice ID: ${invoiceId}`);
  }
  
  return response.json();
}

// Update an invoice line item
export async function updateInvoiceLineItem(id: string, data: Partial<InvoiceLineItem>): Promise<InvoiceLineItem> {
  const response = await fetch(`${ENDPOINTS.LINE_ITEMS}/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  
  if (!response.ok) {
    throw new Error(`Failed to update line item with ID: ${id}`);
  }
  
  return response.json();
}

// Delete an invoice line item
export async function deleteInvoiceLineItem(id: string): Promise<void> {
  const response = await fetch(`${ENDPOINTS.LINE_ITEMS}/${id}`, {
    method: 'DELETE',
  });
  
  if (!response.ok) {
    throw new Error(`Failed to delete line item with ID: ${id}`);
  }
}

export async function updateInventory(
  invoiceId: string, 
  invoiceType: InvoiceType,
  lineItems: InvoiceLineItem[]
): Promise<void> {
  const response = await fetch(ENDPOINTS.INVENTORY, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      invoiceId,
      invoiceType,
      lineItems
    }),
  });
  
  if (!response.ok) {
    let errorMessage = `Failed to update inventory for invoice ID: ${invoiceId}`;
    try {
      const errorData = await response.json();
      if (errorData?.error) {
        errorMessage += `: ${errorData.error}`;
      }
    } catch (parseError) {
      errorMessage += `: ${response.status} ${response.statusText}`;
    }
    
    throw new Error(errorMessage);
  }
}    