"use server";

import { auth, currentUser } from "@clerk/nextjs/server";
import db from "@/db/db";
import { revalidatePath } from "next/cache";
import { put } from "@vercel/blob";
import { nanoid } from "nanoid";
import { getCurrentDbUser } from "./user";
import { InvoiceFieldConfig, InvoiceStatus } from "../types";
import { InvoiceStatus as PrismaInvoiceStatus } from "@prisma/client";
import { processInvoiceWithOCR } from '../services/ocr-service';

// Map Prisma InvoiceStatus to application InvoiceStatus
function mapInvoiceStatus(status: PrismaInvoiceStatus): InvoiceStatus {
  switch (status) {
    case "PENDING": return "PENDING";
    case "PAID": return "PAID";
    case "OVERDUE": return "OVERDUE";
    case "CANCELLED": return "CANCELLED";
    default: return "PENDING";
  }
}

/**
 * Upload a file to Vercel Blob and create an invoice record
 */
export async function uploadInvoice(formData: FormData) {
  try {
    // Make sure user is authenticated
    const clerkUser = await currentUser();
    if (!clerkUser) {
      throw new Error("Unauthorized");
    }

    // Get the user from our database
    const user = await getCurrentDbUser();
    if (!user) {
      throw new Error("User not found in database");
    }

    // Get the file from the form data
    const file = formData.get("file") as File;
    if (!file) {
      throw new Error("No file provided");
    }

    // Generate a unique ID for the file
    const uniqueId = nanoid();
    const fileName = `${uniqueId}-${file.name}`;

    // Upload the file to Vercel Blob
    const { url } = await put(fileName, file, {
      access: "public",
    });

    // Create the initial invoice record in the database
    const invoice = await db.invoice.create({
      data: {
        originalFileUrl: url,
        status: "PENDING",
        userId: user.id,
        organizationId: user.organizations[0]?.id, // Assign to first organization if exists
      },
    });

    // Process the invoice with OCR
    await processInvoiceOCR(invoice.id, url);

    revalidatePath("/dashboard");
    return invoice;
  } catch (error) {
    console.error("Error uploading invoice:", error);
    throw error;
  }
}

/**
 * Process an invoice with OCR
 */
export async function processInvoiceOCR(
  invoiceId: string, 
  fileUrl: string, 
  organizationData?: {
    name?: string;
    industry?: string;
    size?: string;
    invoiceVolume?: string;
  },
  aiSettings?: {
    customInstructions?: string;
    confidenceThreshold?: number;
    preferredCategories?: string[];
    sampleInvoiceUrls?: string[];
  }
) {
  try {
    // Get custom fields configuration (optional)
    const customFields: InvoiceFieldConfig[] = [
      // Define any custom fields here
    ];

    // Process the invoice using OCR
    const result = await processInvoiceWithOCR(
      fileUrl, 
      customFields,
      organizationData,
      aiSettings
    );

    // Get the current user from Clerk
    const { userId } = await auth();
    
    if (!userId) {
      throw new Error("Unauthorized: User not authenticated");
    }

    // Get our database user
    const user = await db.user.findUnique({
      where: { clerkId: userId }
    });

    if (!user) {
      throw new Error("User not found in database");
    }

    // Update the invoice with extracted data
    await db.invoice.update({
      where: { id: invoiceId },
      data: {
        invoiceNumber: result.extractedData.invoiceNumber,
        vendorName: result.extractedData.vendorName,
        issueDate: result.extractedData.issueDate ? new Date(result.extractedData.issueDate) : undefined,
        dueDate: result.extractedData.dueDate ? new Date(result.extractedData.dueDate) : undefined,
        amount: typeof result.extractedData.amount === 'number' ? result.extractedData.amount : undefined,
        currency: result.extractedData.currency,
        // Use JSON.stringify for JSON fields
        extractedData: JSON.stringify(result.extractedData),
        // Now we can use the invoiceType field
        invoiceType: result.extractedData.invoiceType || 'PURCHASE',
      },
    });

    return result;
  } catch (error) {
    console.error("OCR processing error:", error);
    throw error;
  }
}

/**
 * Get all invoices for the current user
 */
export async function getUserInvoices() {
  try {
    const user = await getCurrentDbUser();
    if (!user) {
      return [];
    }

    const invoices = await db.invoice.findMany({
      where: {
        userId: user.id,
      },
      include: {
        category: true,
        vendor: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Map the Prisma InvoiceStatus to application InvoiceStatus and fix extractedData type
    return invoices.map(invoice => ({
      ...invoice,
      status: mapInvoiceStatus(invoice.status as PrismaInvoiceStatus),
      extractedData: invoice.extractedData === null ? undefined : invoice.extractedData as Record<string, unknown>
    }));
  } catch (error) {
    console.error("Error getting user invoices:", error);
    return [];
  }
}

/**
 * Get invoice by ID
 */
export async function getInvoiceById(id: string) {
  try {
    const user = await getCurrentDbUser();
    if (!user) {
      return null;
    }

    const invoice = await db.invoice.findUnique({
      where: {
        id,
        userId: user.id, // Ensure the invoice belongs to the user
      },
      include: {
        category: true,
        vendor: true,
      },
    });

    return invoice;
  } catch (error) {
    console.error("Error getting invoice:", error);
    return null;
  }
}

/**
 * Update an invoice with a category and vendor
 */
export async function updateInvoiceCategory(
  invoiceId: string, 
  categoryName: string,
  isNewCategory: boolean
) {
  try {
    const user = await getCurrentDbUser();
    if (!user) {
      throw new Error("User not found in database");
    }

    let category;
    
    if (isNewCategory) {
      // Create a new category
      category = await db.category.create({
        data: {
          name: categoryName,
          userId: user.id,
          organizationId: user.organizations[0]?.id || null,
        },
      });
    } else {
      // Find existing category - check for case-insensitive match
      category = await db.category.findFirst({
        where: {
          name: {
            contains: categoryName,
            mode: 'insensitive'
          },
          userId: user.id,
        },
      });

      if (!category) {
        // If no category found, create a new one
        category = await db.category.create({
          data: {
            name: categoryName,
            userId: user.id,
            organizationId: user.organizations[0]?.id || null,
          },
        });
      }
    }

    // Update the invoice with the category
    const updatedInvoice = await db.invoice.update({
      where: {
        id: invoiceId,
        userId: user.id,
      },
      data: {
        categoryId: category.id,
      },
      include: {
        category: true,
      },
    });

    revalidatePath("/dashboard");
    return updatedInvoice;
  } catch (error) {
    console.error("Error updating invoice category:", error);
    throw error;
  }
}

/**
 * Update an invoice with a vendor
 */
export async function updateInvoiceVendor(
  invoiceId: string, 
  vendorName: string,
  isNewVendor: boolean,
  vendorDetails?: {
    email?: string;
    phone?: string;
    website?: string;
    address?: string;
  }
) {
  try {
    const user = await getCurrentDbUser();
    if (!user) {
      throw new Error("User not found in database");
    }

    let vendor;
    
    if (isNewVendor) {
      // Create a new vendor
      vendor = await db.vendor.create({
        data: {
          name: vendorName,
          email: vendorDetails?.email || null,
          phone: vendorDetails?.phone || null,
          website: vendorDetails?.website || null,
          address: vendorDetails?.address || null,
          userId: user.id,
          organizationId: user.organizations[0]?.id || null,
        },
      });
    } else {
      // Find existing vendor - check for case-insensitive match
      vendor = await db.vendor.findFirst({
        where: {
          name: {
            contains: vendorName,
            mode: 'insensitive'
          },
          userId: user.id,
        },
      });

      if (!vendor) {
        // If no vendor found, create a new one
        vendor = await db.vendor.create({
          data: {
            name: vendorName,
            userId: user.id,
            organizationId: user.organizations[0]?.id || null,
          },
        });
      }
    }

    // Update the invoice with the vendor
    const updatedInvoice = await db.invoice.update({
      where: {
        id: invoiceId,
        userId: user.id,
      },
      data: {
        vendorId: vendor.id,
      },
      include: {
        vendor: true,
      },
    });

    revalidatePath("/dashboard");
    return updatedInvoice;
  } catch (error) {
    console.error("Error updating invoice vendor:", error);
    throw error;
  }
}

/**
 * Get all categories for the current user
 */
export async function getUserCategories() {
  try {
    const user = await getCurrentDbUser();
    if (!user) {
      return [];
    }

    const categories = await db.category.findMany({
      where: {
        userId: user.id,
      },
      orderBy: {
        name: "asc",
      },
    });

    return categories;
  } catch (error) {
    console.error("Error getting user categories:", error);
    return [];
  }
}

/**
 * Get all vendors for the current user
 */
export async function getUserVendors() {
  try {
    const user = await getCurrentDbUser();
    if (!user) {
      return [];
    }

    const vendors = await db.vendor.findMany({
      where: {
        userId: user.id,
      },
      orderBy: {
        name: "asc",
      },
    });

    return vendors;
  } catch (error) {
    console.error("Error getting user vendors:", error);
    return [];
  }
}

/**
 * Update the invoice type after user confirmation
 */
export async function updateInvoiceType(invoiceId: string, confirmedType: 'PURCHASE' | 'PAYMENT') {
  try {
    // Get the current user from Clerk
    const { userId } = await auth();
    
    if (!userId) {
      throw new Error('You must be signed in to update an invoice');
    }
    
    // Get user from database
    const user = await db.user.findUnique({
      where: { clerkId: userId },
    });

    if (!user) {
      throw new Error('User not found');
    }

    // First get the current invoice and its extractedData
    const currentInvoice = await db.invoice.findUnique({
      where: { id: invoiceId },
      select: { extractedData: true }
    });

    if (!currentInvoice) {
      throw new Error('Invoice not found');
    }

    // Parse the current extractedData
    let extractedData = {};
    if (currentInvoice.extractedData) {
      try {
        if (typeof currentInvoice.extractedData === 'string') {
          extractedData = JSON.parse(currentInvoice.extractedData);
        } else {
          extractedData = currentInvoice.extractedData;
        }
      } catch (e) {
        console.error('Error parsing extractedData:', e);
      }
    }

    // Update the extractedData with the new invoiceType
    const updatedExtractedData = {
      ...extractedData,
      invoiceType: confirmedType
    };

    // Update the invoice with the new invoiceType and extractedData
    const updatedInvoice = await db.invoice.update({
      where: {
        id: invoiceId,
        userId: user.id, // Ensure the invoice belongs to the user
      },
      data: {
        invoiceType: confirmedType,
        extractedData: JSON.stringify(updatedExtractedData)
      },
    });

    // Store this as a learning sample for the AI
    await storeInvoiceTypeConfirmation(invoiceId, confirmedType);

    return updatedInvoice;
  } catch (error) {
    console.error('Error updating invoice type:', error);
    throw new Error('Failed to update invoice type');
  }
}

/**
 * Store the invoice type confirmation for AI learning
 */
async function storeInvoiceTypeConfirmation(invoiceId: string, confirmedType: 'PURCHASE' | 'PAYMENT') {
  try {
    const { userId } = await auth();
    
    if (!userId) return;

    const user = await db.user.findUnique({
      where: { clerkId: userId },
    });

    if (!user) return;

    // Get the invoice
    const invoice = await db.invoice.findUnique({
      where: { id: invoiceId },
      select: {
        id: true,
        vendorName: true,
        extractedData: true,
        originalFileUrl: true,
      }
    });

    if (!invoice) return;

    // Parse extracted data
    let detectedType: string | undefined = undefined;
    
    if (invoice.extractedData) {
      try {
        if (typeof invoice.extractedData === 'string') {
          const parsedData = JSON.parse(invoice.extractedData);
          detectedType = parsedData?.invoiceType;
        } else if (typeof invoice.extractedData === 'object') {
          // Handle as JSON object
          const jsonData = invoice.extractedData as Record<string, unknown>;
          if (jsonData && typeof jsonData === 'object' && 'invoiceType' in jsonData) {
            detectedType = String(jsonData.invoiceType);
          }
        }
      } catch (e) {
        console.error('Error parsing extractedData:', e);
      }
    }

    // Only learn if the AI prediction was different from user confirmation
    const learningData = {
      invoiceId,
      vendorName: invoice.vendorName,
      detectedType,
      confirmedType,
      fileUrl: invoice.originalFileUrl,
      userId: user.id,
      timestamp: new Date().toISOString(),
      corrected: detectedType !== confirmedType
    };

    console.log('AI Learning Data:', learningData);

    // This vendor preference would be stored in the database once schema is updated
    if (invoice.vendorName) {
      console.log('Would store vendor preference:', {
        userId: user.id,
        vendorName: invoice.vendorName,
        invoiceType: confirmedType,
        confidence: 0.7
      });
    }

    return true;
  } catch (error) {
    console.error('Error storing invoice type confirmation:', error);
    // Don't throw here, as this is a background operation
    return false;
  }
} 