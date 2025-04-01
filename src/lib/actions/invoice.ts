"use server";

import { currentUser } from "@clerk/nextjs/server";
import db from "@/db/db";
import { revalidatePath } from "next/cache";
import { put } from "@vercel/blob";
import { nanoid } from "nanoid";
import { getCurrentDbUser } from "./user";
import * as ocrService from "../services/ocr-service";
import { InvoiceFieldConfig, InvoiceStatus } from "../types";
import { InvoiceStatus as PrismaInvoiceStatus } from "@prisma/client";

// Map Prisma InvoiceStatus to application InvoiceStatus
const mapPrismaInvoiceStatus = (status: PrismaInvoiceStatus): InvoiceStatus => {
  if (status === 'ARCHIVED') return 'CANCELLED';
  return status as InvoiceStatus;
};

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
 * Process an invoice with OCR and update the database with extracted data
 */
export async function processInvoiceOCR(invoiceId: string, fileUrl: string, customFields?: InvoiceFieldConfig[]) {
  try {
    const user = await getCurrentDbUser();
    if (!user) {
      throw new Error("User not found in database");
    }

    // Get the invoice
    const invoice = await db.invoice.findUnique({
      where: {
        id: invoiceId,
        userId: user.id,
      },
    });

    if (!invoice) {
      throw new Error("Invoice not found");
    }

    // Get existing vendors for the user
    const vendors = await db.vendor.findMany({
      where: {
        userId: user.id,
      },
      select: {
        name: true,
      },
    });

    // Process the invoice with OCR using the OpenAI Vision API
    const result = await ocrService.processInvoiceWithOCR(fileUrl, customFields);
    
    // Get vendor suggestions
    const vendorSuggestions = await ocrService.suggestVendors(
      result.extractedData.vendorName || "",
      vendors.map((v: { name: string }) => v.name)
    );

    // Prepare dates correctly
    const issueDate = result.extractedData.issueDate
      ? new Date(result.extractedData.issueDate)
      : null;
    
    const dueDate = result.extractedData.dueDate
      ? new Date(result.extractedData.dueDate)
      : null;

    // Update the invoice with the extracted data
    await db.invoice.update({
      where: {
        id: invoiceId,
      },
      data: {
        invoiceNumber: result.extractedData.invoiceNumber,
        vendorName: result.extractedData.vendorName,
        issueDate,
        dueDate,
        amount: result.extractedData.amount,
        currency: result.extractedData.currency,
        notes: result.extractedData.notes,
        languageCode: result.extractedData.language,
        extractedData: result.extractedData,
      },
    });

    return {
      ...result,
      vendorSuggestions,
    };
  } catch (error) {
    console.error("Error processing invoice with OCR:", error);
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
      status: mapPrismaInvoiceStatus(invoice.status as PrismaInvoiceStatus),
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
          organizationId: user.organizations[0]?.id,
        },
      });
    } else {
      // Find existing category
      category = await db.category.findFirst({
        where: {
          name: categoryName,
          userId: user.id,
        },
      });

      if (!category) {
        throw new Error("Category not found");
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
          email: vendorDetails?.email,
          phone: vendorDetails?.phone,
          website: vendorDetails?.website,
          address: vendorDetails?.address,
          userId: user.id,
          organizationId: user.organizations[0]?.id,
        },
      });
    } else {
      // Find existing vendor
      vendor = await db.vendor.findFirst({
        where: {
          name: vendorName,
          userId: user.id,
        },
      });

      if (!vendor) {
        throw new Error("Vendor not found");
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