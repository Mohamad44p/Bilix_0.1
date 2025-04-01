import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import db from "@/db/db";
import { put } from "@vercel/blob";
import { nanoid } from "nanoid";

// Simplified function to extract text from invoice (in a real app, use OCR or AI vision API)
async function extractInvoiceData(url: string) {
  // This is a mock implementation - in a real app, you would use OCR or AI services
  // to analyze the invoice image/PDF and extract the data from the provided url
  console.log(`In production, this would process: ${url}`);
  
  // For demo purposes, return simulated data
  return {
    invoiceNumber: `INV-${Math.floor(Math.random() * 10000)}`,
    vendorName: ["Amazon", "Microsoft", "Google", "Dell", "Apple"][Math.floor(Math.random() * 5)],
    issueDate: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
    dueDate: new Date(Date.now() + Math.random() * 30 * 24 * 60 * 60 * 1000),
    amount: Math.floor(Math.random() * 1000) + 100,
    currency: "USD",
    language: "en",
    notes: "Auto-extracted invoice data",
  };
}

// Function to suggest categories based on invoice data
async function suggestCategories(
  vendorName: string,
  amount: number,
  existingCategories: { id: string; name: string }[]
) {
  // Simple logic to suggest categories based on vendor name and amount
  // In a real app, this would use AI/ML to analyze patterns
  const suggestedCategories = [];
  
  const vendorToCategory: Record<string, string> = {
    "Amazon": "Office Supplies",
    "Microsoft": "Software",
    "Google": "Cloud Services",
    "Dell": "Hardware",
    "Apple": "Hardware",
  };
  
  // Add category based on vendor if it exists
  if (vendorName && vendorToCategory[vendorName]) {
    suggestedCategories.push(vendorToCategory[vendorName]);
  }
  
  // Add category based on amount
  if (amount > 500) {
    suggestedCategories.push("Major Purchases");
  } else if (amount < 100) {
    suggestedCategories.push("Minor Expenses");
  }
  
  // Add a general category
  suggestedCategories.push("General Expenses");
  
  // Filter out categories that don't exist in the user's categories
  const existingCategoryNames = existingCategories.map(c => c.name);
  const validSuggestions = suggestedCategories.filter(c => 
    existingCategoryNames.includes(c)
  );
  
  // If no valid suggestions, add the first existing category as a fallback
  if (validSuggestions.length === 0 && existingCategories.length > 0) {
    validSuggestions.push(existingCategories[0].name);
  }
  
  return validSuggestions;
}

export async function POST(request: Request) {
  try {
    const { userId: clerkUserId } = await auth();
    
    if (!clerkUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const dbUser = await db.user.findUnique({
      where: { clerkId: clerkUserId },
    });

    if (!dbUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Parse the form data
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const fileUrl = formData.get("fileUrl") as string | null;
    const metadataString = formData.get("metadata") as string | null;
    
    let existingInvoiceData = {};
    if (metadataString) {
      try {
        existingInvoiceData = JSON.parse(metadataString);
      } catch (e) {
        console.error("Failed to parse metadata:", e);
      }
    }

    // Get either the file or fileUrl
    let invoiceFileUrl = fileUrl;
    
    if (file && !fileUrl) {
      // Upload the file to Vercel Blob
      const uniqueId = nanoid();
      const fileName = `${uniqueId}-${file.name}`;
      
      const { url } = await put(fileName, file, {
        access: "public",
      });
      
      invoiceFileUrl = url;
    }

    if (!invoiceFileUrl) {
      return NextResponse.json(
        { error: "File or fileUrl is required" },
        { status: 400 }
      );
    }

    // Extract data from the invoice
    const extractedData = await extractInvoiceData(invoiceFileUrl);
    
    // Check for duplicate invoices
    const possibleDuplicates = await db.invoice.findMany({
      where: {
        userId: dbUser.id,
        OR: [
          {
            invoiceNumber: extractedData.invoiceNumber,
            vendorName: extractedData.vendorName,
          },
          {
            amount: extractedData.amount,
            vendorName: extractedData.vendorName,
            issueDate: {
              gte: new Date(extractedData.issueDate.getTime() - 7 * 24 * 60 * 60 * 1000),
              lte: new Date(extractedData.issueDate.getTime() + 7 * 24 * 60 * 60 * 1000),
            },
          },
        ],
      },
      take: 1,
    });
    
    const isDuplicate = possibleDuplicates.length > 0;
    const duplicateOf = isDuplicate ? possibleDuplicates[0].id : undefined;
    
    // Get categories for suggestions
    const categories = await db.category.findMany({
      where: { userId: dbUser.id },
      select: { id: true, name: true },
    });
    
    // Get suggested tags based on content
    const suggestedTags = ["invoice", extractedData.vendorName.toLowerCase()];
    if (extractedData.amount > 500) suggestedTags.push("high-value");
    
    // Get suggested categories
    const suggestedCategories = await suggestCategories(
      extractedData.vendorName,
      extractedData.amount,
      categories
    );
    
    return NextResponse.json({
      extractedData: {
        ...extractedData,
        ...existingInvoiceData, // Merge with any existing data
      },
      isDuplicate,
      duplicateOf,
      categories: categories.filter(c => suggestedCategories.includes(c.name)),
      tags: suggestedTags,
    });
  } catch (error) {
    console.error("Error auto-categorizing invoice:", error);
    return NextResponse.json(
      { error: "Failed to auto-categorize invoice" },
      { status: 500 }
    );
  }
} 