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
    console.log('Starting export with options:', JSON.stringify(options));
    const formData = new FormData();
    
    // Add basic options
    formData.append('format', options.format);
    formData.append('fields', JSON.stringify(options.fields));
    formData.append('includeAll', String(options.includeAll));
    
    // Add folder name if provided, ensuring it's a string
    if (options.folderName) {
      console.log(`Adding folder name to export: "${options.folderName}"`);
      formData.append('folderName', options.folderName);
    } else {
      console.log('No folder name provided for export');
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
    
    console.log('Sending export request to server...');
    const response = await fetch(ENDPOINTS.EXPORT, {
      method: 'POST',
      body: formData,
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Export API error:', errorData);
      throw new Error(errorData.error || 'Failed to export invoices');
    }
    
    const result = await response.json();
    console.log('Export successful, received result:', result);
    return result;
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
  try {
    // Check if the URL is valid
    if (!url) {
      console.error("Download error: Invalid URL");
      throw new Error("Invalid download URL");
    }
    
    console.log(`Downloading file from ${url} as ${fileName}`);
    
    // Detect file type
    const isPdf = fileName.toLowerCase().endsWith('.pdf');
    const isHtml = fileName.toLowerCase().endsWith('.html');
    const isExcel = fileName.toLowerCase().endsWith('.xlsx') || fileName.toLowerCase().endsWith('.xls');
    
    // For HTML reports (PDF export), just open in a new tab
    if (isHtml) {
      console.log('HTML report detected, opening in new tab for PDF printing');
      window.open(url, '_blank');
      return;
    }
    
    // Create a temporary anchor element
    const link = document.createElement('a');
    
    // Handle both relative and absolute URLs
    if (url.startsWith('http')) {
      link.href = url;
    } else {
      // For relative URLs, ensure they're properly formatted
      link.href = url.startsWith('/') ? url : `/${url}`;
    }
    
    link.download = fileName || 'export-download';
    
    // For PDFs on some browsers, opening in a new tab might be more reliable
    if (isPdf) {
      console.log('PDF file detected, using optimal download method');
      link.target = '_blank';
    } else {
      link.target = '_self';
    }
    
    // Append to the body temporarily
    document.body.appendChild(link);
    
    // Trigger the download
    link.click();
    
    // Small delay before cleanup
    setTimeout(() => {
      // Clean up
      document.body.removeChild(link);
      
      // For Excel files, no additional handling needed
      if (isExcel) {
        console.log('Excel download initiated');
      }
      
      // For PDF files, we might need a fallback on some browsers
      if (isPdf) {
        console.log('PDF download initiated');
      }
    }, 100);
    
    return true;
  } catch (error) {
    console.error("Download file error:", error);
    
    // Fallback - open in new tab
    try {
      console.log('Using fallback download method');
      window.open(url, '_blank');
    } catch (fallbackError) {
      console.error("Fallback download failed:", fallbackError);
      throw error;
    }
  }
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