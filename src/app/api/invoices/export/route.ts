import { NextRequest, NextResponse } from 'next/server';
import { put } from '@vercel/blob';
import { nanoid } from 'nanoid';
import ExcelJS from 'exceljs';
import { formatDate } from '@/lib/utils';
import { auth } from '@clerk/nextjs/server';
import db from '@/db/db';

// Define interfaces for type safety
interface InvoiceWithRelations {
  id: string;
  userId: string;
  vendorName?: string | null;
  invoiceNumber?: string | null;
  amount?: number | null;
  currency?: string | null;
  status: string;
  issueDate?: Date | null;
  dueDate?: Date | null;
  notes?: string | null;
  category?: {
    id: string;
    name: string;
  } | null;
  tags?: string[];
}

interface DateRangeQuery {
  dateFrom?: string;
  dateTo?: string;
}

/**
 * Sanitize a string for use as a folder name
 */
function sanitizeFolderName(name: string): string {
  // Replace special characters and spaces with underscores
  const sanitized = name.replace(/[^a-zA-Z0-9]/g, '_');
  
  // Add trailing slash for folder format
  return sanitized ? `${sanitized}/` : '';
}

/**
 * GET: Fetch export history
 */
export async function GET() {
  try {
    // Authenticate the user
    const { userId: clerkUserId } = await auth();
    
    if (!clerkUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Get user from database
    const dbUser = await db.user.findUnique({
      where: { clerkId: clerkUserId },
      select: {
        id: true,
        organizations: {
          select: { id: true },
        },
      },
    });
    
    if (!dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    // Fetch export history
    const exports = await db.exportHistory.findMany({
      where: {
        userId: dbUser.id,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
    
    // Fetch all unique folder names
    const folders = await db.exportHistory.findMany({
      where: {
        userId: dbUser.id,
        folderName: {
          not: null
        }
      },
      select: {
        folderName: true
      },
      distinct: ['folderName']
    });
    
    return NextResponse.json({
      exports: exports.map(exp => ({
        id: exp.id,
        fileName: exp.fileName,
        fileUrl: exp.fileUrl,
        format: exp.format,
        createdAt: exp.createdAt.toISOString(),
        count: exp.count,
        folder: exp.folderName
      })),
      folders: folders.map(f => f.folderName).filter(Boolean)
    });
  } catch (error) {
    console.error("Error fetching export history:", error);
    return NextResponse.json({ error: 'Failed to fetch export history' }, { status: 500 });
  }
}

/**
 * POST: Create a new export
 */
export async function POST(req: NextRequest) {
  try {
    // Authenticate the user
    const { userId: clerkUserId } = await auth();
    
    if (!clerkUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Get user from database
    const dbUser = await db.user.findUnique({
      where: { clerkId: clerkUserId },
      select: {
        id: true,
        organizations: {
          select: { id: true },
        },
      },
    });
    
    if (!dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    // Parse form data
    const formData = await req.formData();
    const format = formData.get('format') as 'pdf' | 'excel' || 'excel';
    const fields = JSON.parse(formData.get('fields') as string || '[]');
    const includeAll = formData.get('includeAll') === 'true';
    const dateFrom = formData.get('dateFrom') as string || undefined;
    const dateTo = formData.get('dateTo') as string || undefined;
    const invoiceIds = formData.getAll('invoiceIds') as string[];
    const rawFolderName = formData.get('folderName') as string || '';
    const sanitizedFolderName = sanitizeFolderName(rawFolderName);
    
    // Build query for invoices
    const dateQuery: DateRangeQuery = {};
    
    if (dateFrom) {
      dateQuery.dateFrom = dateFrom;
    }
    
    if (dateTo) {
      dateQuery.dateTo = dateTo;
    }
    
    // Fetch invoices
    let invoices: InvoiceWithRelations[] = [];
    
    if (includeAll) {
      // Fetch all invoices with date filtering
      const dateFilter: Record<string, Record<string, Date>> = {};
      
      if (dateFrom) {
        dateFilter.issueDate = {
          ...dateFilter.issueDate,
          gte: new Date(dateFrom),
        };
      }
      
      if (dateTo) {
        dateFilter.issueDate = {
          ...dateFilter.issueDate,
          lte: new Date(dateTo),
        };
      }
      
      invoices = await db.invoice.findMany({
        where: {
          userId: dbUser.id,
          ...dateFilter,
        },
        include: {
          category: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });
    } else {
      // Fetch only selected invoices
      if (invoiceIds.length === 0) {
        return NextResponse.json({ error: 'No invoices selected' }, { status: 400 });
      }
      
      invoices = await db.invoice.findMany({
        where: {
          userId: dbUser.id,
          id: {
            in: invoiceIds,
          },
        },
        include: {
          category: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });
    }
    
    // Create export file (Excel or PDF)
    const exportId = nanoid();
    let fileContent: Buffer;
    let mimeType: string;
    
    // Create unique filename with folder structure if provided
    const timestamp = new Date().toISOString().split('T')[0];
    const fileName = `${sanitizedFolderName}invoices_export_${timestamp}_${exportId}.${format === 'pdf' ? 'pdf' : 'xlsx'}`;
    
    if (format === 'excel') {
      // Create Excel workbook
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Invoices');
      
      // Define columns based on fields
      const columns = fields.map((field: string) => {
        const columnMap: Record<string, { header: string; key: string }> = {
          invoiceNumber: { header: 'Invoice Number', key: 'invoiceNumber' },
          vendorName: { header: 'Vendor', key: 'vendorName' },
          amount: { header: 'Amount', key: 'amount' },
          currency: { header: 'Currency', key: 'currency' },
          status: { header: 'Status', key: 'status' },
          issueDate: { header: 'Issue Date', key: 'issueDate' },
          dueDate: { header: 'Due Date', key: 'dueDate' },
          category: { header: 'Category', key: 'category' },
          tags: { header: 'Tags', key: 'tags' },
          notes: { header: 'Notes', key: 'notes' },
        };
        
        return columnMap[field];
      });
      
      worksheet.columns = columns;
      
      // Add data rows
      invoices.forEach(invoice => {
        const row: Record<string, string | number | null> = {};
        
        fields.forEach((field: string) => {
          switch (field) {
            case 'amount':
              row[field] = invoice.amount || 0;
              break;
            case 'issueDate':
              row[field] = invoice.issueDate ? formatDate(invoice.issueDate) : '';
              break;
            case 'dueDate':
              row[field] = invoice.dueDate ? formatDate(invoice.dueDate) : '';
              break;
            case 'category':
              row[field] = invoice.category?.name || '';
              break;
            case 'tags':
              row[field] = (invoice.tags || []).join(', ');
              break;
            default:
              row[field] = invoice[field as keyof typeof invoice] as string || '';
          }
        });
        
        worksheet.addRow(row);
      });
      
      // Style the header row
      const headerRow = worksheet.getRow(1);
      headerRow.font = { bold: true };
      
      // Generate Excel file
      fileContent = await workbook.xlsx.writeBuffer() as unknown as Buffer;
      mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    } else {
      // PDF generation would go here in a real implementation
      // For now, we'll just return an error since we're focusing on Excel
      return NextResponse.json({ error: 'PDF export not yet implemented' }, { status: 501 });
    }
    
    // Upload to Vercel Blob
    const blob = await put(fileName, fileContent, {
      contentType: mimeType,
      access: 'public',
    });
    
    // Save export history to database
    const exportRecord = await db.exportHistory.create({
      data: {
        exportId,
        format,
        fileUrl: blob.url,
        fileName,
        count: invoices.length,
        userId: dbUser.id,
        organizationId: dbUser.organizations[0]?.id,
        folderName: sanitizedFolderName ? sanitizedFolderName.slice(0, -1) : null, // Remove trailing slash
      },
    });
    
    return NextResponse.json({
      fileUrl: blob.url,
      fileName,
      format,
      exportId: exportRecord.id,
    });
  } catch (error) {
    console.error("Error creating export:", error);
    return NextResponse.json({ error: 'Failed to create export' }, { status: 500 });
  }
} 