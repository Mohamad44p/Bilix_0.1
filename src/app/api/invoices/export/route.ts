import { NextRequest, NextResponse } from 'next/server';
import { put } from '@vercel/blob';
import { nanoid } from 'nanoid';
import ExcelJS from 'exceljs';
import { formatDate, formatCurrency } from '@/lib/utils';
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
  console.log(`Processing folder name: "${name}"`);
  
  // If it's undefined, null, or empty string, return empty string
  if (!name || name === 'undefined' || name === 'null' || name.trim() === '') {
    console.log('Empty or invalid folder name, returning empty string');
    return '';
  }
  
  // Replace special characters and spaces with underscores
  const sanitized = name.trim().replace(/[^a-zA-Z0-9]/g, '_');
  console.log(`Sanitized to: "${sanitized}"`);
  
  // Add trailing slash for folder format if not empty
  const result = sanitized ? `${sanitized}/` : '';
  console.log(`Final folder path: "${result}"`);
  
  return result;
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
    
    console.log('Raw folderName from request:', rawFolderName);
    const sanitizedFolderName = sanitizeFolderName(rawFolderName);
    console.log('Final sanitizedFolderName:', sanitizedFolderName);
    
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
    const timestamp = new Date().toISOString().replace(/:/g, '-').split('.')[0];
    const baseFileName = `invoices_export_${timestamp}_${exportId}`;
    // Use .html extension for PDF format to ensure browser can open it correctly
    const fileExtension = format === 'pdf' ? 'html' : 'xlsx';
    
    // Ensure the folder structure is correct
    let fileName = '';
    if (sanitizedFolderName) {
      fileName = `${sanitizedFolderName}${baseFileName}.${fileExtension}`;
      console.log(`Creating export with folder: ${sanitizedFolderName}, format: ${format}, extension: ${fileExtension}`);
    } else {
      fileName = `${baseFileName}.${fileExtension}`;
      console.log(`Creating export without folder, format: ${format}, extension: ${fileExtension}`);
    }
    
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
      // PDF Generation
      console.log("Generating PDF export");
      
      // Create enhanced HTML content that's printer-friendly
      const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8" />
        <title>Invoice Export - ${sanitizedFolderName ? `Folder: ${sanitizedFolderName.replace('/', '')}` : 'No Folder'}</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.5;
            color: #333;
            margin: 0;
            padding: 20px;
          }
          @media print {
            body {
              padding: 10px;
              margin: 0;
            }
            .no-print {
              display: none !important;
            }
            table {
              width: 100%;
              page-break-inside: auto;
            }
            tr {
              page-break-inside: avoid;
              page-break-after: auto;
            }
            thead {
              display: table-header-group;
            }
            tfoot {
              display: table-footer-group;
            }
          }
          .no-print {
            margin-bottom: 20px;
          }
          .print-tips {
            background-color: #e6f2ff;
            border: 1px solid #b3d9ff;
            padding: 10px;
            margin: 20px 0;
            border-radius: 4px;
          }
          .print-button {
            background-color: #2563eb;
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 4px;
            cursor: pointer;
            font-weight: bold;
            font-size: 14px;
          }
          .print-button:hover {
            background-color: #1d4ed8;
          }
          h1 {
            font-size: 24px;
            margin-bottom: 10px;
            color: #2563eb;
            text-align: center;
          }
          h2 {
            font-size: 16px;
            color: #4b5563;
            margin-top: 0;
            text-align: center;
            margin-bottom: 20px;
          }
          .meta {
            margin-bottom: 20px;
            font-size: 14px;
            color: #666;
            text-align: center;
            background-color: #f8fafc;
            padding: 10px;
            border-radius: 4px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 30px;
            font-size: 14px;
          }
          th {
            background-color: #f1f5f9;
            text-align: left;
            padding: 12px;
            font-weight: 600;
            border-bottom: 2px solid #cbd5e1;
          }
          td {
            padding: 12px;
            border-bottom: 1px solid #e2e8f0;
          }
          tr:nth-child(even) {
            background-color: #f8fafc;
          }
          .total-row {
            font-weight: bold;
            background-color: #f1f5f9;
          }
          .footer {
            font-size: 12px;
            color: #64748b;
            text-align: center;
            margin-top: 30px;
            border-top: 1px solid #e2e8f0;
            padding-top: 20px;
          }
          .header-logo {
            text-align: center;
            margin-bottom: 20px;
          }
        </style>
      </head>
      <body>
        <div class="header-logo">
          <svg width="120" height="40" viewBox="0 0 120 40" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M20 5L30 20L20 35L10 20L20 5Z" fill="#2563EB" />
            <path d="M40 15H80V25H40V15Z" fill="#2563EB" />
            <path d="M90 15H110V25H90V15Z" fill="#2563EB" />
          </svg>
        </div>
        <h1>Invoice Export Report</h1>
        <h2>${sanitizedFolderName ? `Folder: ${sanitizedFolderName.replace('/', '')}` : ''}</h2>
        
        <div class="no-print">
          <button class="print-button" onclick="window.print()">Print / Save as PDF</button>
          
          <div class="print-tips">
            <strong>Printing Tips:</strong>
            <ul>
              <li>Click the button above or press Ctrl+P (⌘+P on Mac) to print</li>
              <li>Select "Save as PDF" as the destination to save as a PDF file</li>
              <li>Set "Scale" to "Fit to page" for better layout</li>
              <li>Disable "Headers and footers" for a cleaner look</li>
              <li>Choose "Color" for best results</li>
            </ul>
          </div>
        </div>
        
        <div class="meta">
          <div>Export Date: ${new Date().toLocaleDateString()}</div>
          <div>Total Invoices: ${invoices.length}</div>
          <div>Generated On: ${new Date().toLocaleString()}</div>
        </div>
        <table>
          <thead>
            <tr>
              ${fields.map(field => {
                const fieldNames: Record<string, string> = {
                  invoiceNumber: 'Invoice Number',
                  vendorName: 'Vendor',
                  amount: 'Amount',
                  currency: 'Currency',
                  status: 'Status',
                  issueDate: 'Issue Date',
                  dueDate: 'Due Date',
                  category: 'Category',
                  tags: 'Tags',
                  notes: 'Notes',
                };
                return `<th>${fieldNames[field] || field}</th>`;
              }).join('')}
            </tr>
          </thead>
          <tbody>
            ${invoices.map(invoice => `
              <tr>
                ${fields.map(field => {
                  let value = '';
                  switch (field) {
                    case 'amount':
                      value = formatCurrency(invoice.amount || 0, invoice.currency || 'USD');
                      break;
                    case 'issueDate':
                      value = invoice.issueDate ? formatDate(invoice.issueDate) : '';
                      break;
                    case 'dueDate':
                      value = invoice.dueDate ? formatDate(invoice.dueDate) : '';
                      break;
                    case 'category':
                      value = invoice.category?.name || '';
                      break;
                    case 'tags':
                      value = (invoice.tags || []).join(', ');
                      break;
                    case 'status':
                      value = invoice.status || '';
                      break;
                    default:
                      value = (invoice[field as keyof typeof invoice] as string) || '';
                  }
                  return `<td>${value}</td>`;
                }).join('')}
              </tr>
            `).join('')}
          </tbody>
        </table>
        <div class="footer">
          <p>Generated by Bilix Invoice Management System</p>
          <p>This report can be saved as a PDF by using your browser's print function (Ctrl+P or ⌘+P)</p>
        </div>
        <script>
          // Auto-print dialog on page load after a short delay
          window.addEventListener('load', function() {
            setTimeout(function() {
              // Show print dialog automatically
              window.print();
            }, 1000);
          });
        </script>
      </body>
      </html>
      `;
      
      // Use HTML MIME type instead of PDF since we're not generating a real PDF
      fileContent = Buffer.from(htmlContent);
      mimeType = 'text/html';

      console.log("HTML report generated successfully");
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
    
    console.log(`Export saved to database with folderName: ${exportRecord.folderName || 'none'}`);
    
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