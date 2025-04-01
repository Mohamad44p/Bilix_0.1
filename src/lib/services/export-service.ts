import { ExportOptions } from "@/components/dashboard/invoices/ExportModal";

// API endpoints
const ENDPOINTS = {
  EXPORT: '/api/invoices/export',
};

/**
 * Export invoices to Excel or PDF
 */
export async function exportInvoices(
  invoiceIds: string[],
  options: ExportOptions
): Promise<{ fileUrl: string; fileName: string; format: string }> {
  try {
    const formData = new FormData();
    
    // Add basic options
    formData.append('format', options.format);
    formData.append('fields', JSON.stringify(options.fields));
    formData.append('includeAll', String(options.includeAll));
    
    // Add folder name if provided
    if (options.folderName) {
      formData.append('folderName', options.folderName);
    }
    
    // Add date range if provided
    if (options.dateFrom) {
      formData.append('dateFrom', options.dateFrom);
    }
    if (options.dateTo) {
      formData.append('dateTo', options.dateTo);
    }
    
    // Add invoice IDs if not including all
    if (!options.includeAll) {
      invoiceIds.forEach(id => {
        formData.append('invoiceIds', id);
      });
    }
    
    const response = await fetch(ENDPOINTS.EXPORT, {
      method: 'POST',
      body: formData,
    });
    
    if (!response.ok) {
      throw new Error('Failed to export invoices');
    }
    
    return response.json();
  } catch (error) {
    console.error('Export error:', error);
    throw error;
  }
}

/**
 * Get export history
 */
export async function getExportHistory(folder?: string): Promise<{ 
  exports: Array<{
    id: string;
    fileName: string;
    fileUrl: string;
    format: string;
    createdAt: string;
    count: number;
    folder: string | null;
  }>;
  folders: string[];
}> {
  try {
    const url = new URL(ENDPOINTS.EXPORT, window.location.origin);
    
    if (folder) {
      url.searchParams.append('folder', folder);
    }
    
    const response = await fetch(url.toString());
    
    if (!response.ok) {
      throw new Error('Failed to fetch export history');
    }
    
    return response.json();
  } catch (error) {
    console.error('Error fetching export history:', error);
    throw error;
  }
}

/**
 * Download a file from a URL
 */
export function downloadFile(url: string, fileName: string): void {
  // Create a temporary anchor element
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName || 'download';
  
  // Append to the body temporarily
  document.body.appendChild(link);
  
  // Trigger the download
  link.click();
  
  // Clean up
  document.body.removeChild(link);
}

/**
 * Export a single invoice
 */
export async function exportSingleInvoice(
  invoiceId: string,
  options: {
    format: 'pdf' | 'excel';
    fields: string[];
    folderName?: string;
  }
): Promise<{ fileUrl: string; fileName: string; format: string }> {
  try {
    const formData = new FormData();
    
    // Add basic options
    formData.append('format', options.format);
    formData.append('fields', JSON.stringify(options.fields));
    formData.append('includeAll', 'false');
    formData.append('invoiceIds', invoiceId);
    
    // Add folder name if provided
    if (options.folderName) {
      formData.append('folderName', options.folderName);
    }
    
    const response = await fetch(ENDPOINTS.EXPORT, {
      method: 'POST',
      body: formData,
    });
    
    if (!response.ok) {
      throw new Error('Failed to export invoice');
    }
    
    return response.json();
  } catch (error) {
    console.error('Export error:', error);
    throw error;
  }
} 