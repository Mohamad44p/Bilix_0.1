import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import OpenAI from "openai";
import { revalidatePath } from "next/cache";
import db from "@/db/db";
import { Category } from "@prisma/client";
import { Invoice } from "@/lib/types";

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: NextRequest) {
  try {
    // Check authentication
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get request body
    const body = await req.json();
    const { invoiceIds, options } = body;

    if (!invoiceIds || !Array.isArray(invoiceIds) || invoiceIds.length === 0) {
      return NextResponse.json(
        { error: "Invalid request. Invoice IDs are required." },
        { status: 400 }
      );
    }

    const confidenceThreshold = options?.confidenceThreshold || 0.7;
    const model = options?.model || "gpt-4";
    const autoApprove = options?.autoApprove || false;
    const includePaid = options?.includePaid || false;

    // Fetch user's categories and existing invoices for context
    const [categories, invoices] = await Promise.all([
      db.category.findMany({
        where: { userId },
      }),
      db.invoice.findMany({
        where: { 
          id: { in: invoiceIds },
          userId,
          status: includePaid ? undefined : { not: "PAID" } 
        },
        include: {
          vendor: true,
        },
      }),
    ]);

    if (invoices.length === 0) {
      return NextResponse.json(
        { error: "No matching invoices found." },
        { status: 404 }
      );
    }

    // Process each invoice
    const results = await Promise.all(
      invoices.map(async (invoice) => {
        try {
          // Skip invoices without file URLs
          if (!invoice.originalFileUrl) {
            return {
              invoiceId: invoice.id,
              success: false,
              error: "No file URL available for this invoice",
              changes: null,
            };
          }

          // Get categories with embeddings for similarity matching
          const categoryEmbeddings = await Promise.all(
            categories.map(async (category) => {
              // Simple implementation of getEmbedding function
              const getEmbedding = async (text: string) => {
                // In a real app, this would call an embedding API
                // For now just return a mock embedding vector based on text length
                return Array.from({ length: text.length % 10 + 5 }, () => Math.random());
              };
              
              const embedding = await getEmbedding(category.name);
              return { ...category, embedding };
            })
          );

          // Process with appropriate AI approach
          let aiResult;
          if (model === "gpt-4" || model === "gpt-3.5") {
            // Use OpenAI for categorization
            aiResult = await processWithOpenAI(
              invoice as Invoice, 
              categoryEmbeddings, 
              model,
              confidenceThreshold
            );
          } else {
            // Fallback to simpler heuristic approach
            aiResult = await processWithHeuristics(
              invoice as Invoice, 
              categoryEmbeddings, 
              confidenceThreshold
            );
          }

          // Apply changes if auto-approve is enabled
          if (autoApprove && aiResult.confidence >= confidenceThreshold) {
            await db.invoice.update({
              where: { id: invoice.id },
              data: {
                category: aiResult.category,
                tags: aiResult.tags,
                vendorId: aiResult.vendorId,
                // Other fields to update
              },
            });
          }

          return {
            invoiceId: invoice.id,
            success: true,
            changes: {
              category: aiResult.category,
              tags: aiResult.tags,
              vendorId: aiResult.vendorId,
              isDuplicate: aiResult.isDuplicate,
              duplicateOf: aiResult.duplicateOf,
              confidence: aiResult.confidence,
            },
          };
        } catch (error) {
          console.error(`Error processing invoice ${invoice.id}:`, error);
          return {
            invoiceId: invoice.id,
            success: false,
            error: error instanceof Error ? error.message : "Unknown error",
            changes: null,
          };
        }
      })
    );

    // Revalidate the invoices path
    revalidatePath("/dashboard/invoices");

    return NextResponse.json({
      success: true,
      results,
    });
  } catch (error) {
    console.error("Auto-categorization error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

// Process an invoice using OpenAI
async function processWithOpenAI(
  invoice: Invoice, 
  categories: Category[], 
  model: string,
  confidenceThreshold: number
) {
  // Format invoice data for the prompt
  const invoiceData = {
    invoiceNumber: invoice.invoiceNumber || "Unknown",
    vendor: invoice.vendor?.name || "Unknown",
    amount: invoice.amount || 0,
    issueDate: invoice.issueDate 
      ? new Date(invoice.issueDate).toLocaleDateString() 
      : "Unknown",
    description: invoice.description || "",
  };

  // Initially set a default confidence
  let defaultConfidence = 0.7;
  
  // Use the confidenceThreshold to adjust the default confidence if needed
  if (confidenceThreshold > 0.8) {
    // For high threshold requirements, we'll be more conservative
    defaultConfidence = 0.6;
  }

  // Format categories for the prompt
  const categoryOptions = categories.map((cat) => cat.name).join(", ");

  // Create a prompt for the AI
  const prompt = `
  You are an AI assistant that specializes in invoice categorization. 
  Please analyze this invoice and categorize it appropriately.
  
  Invoice Details:
  - Invoice Number: ${invoiceData.invoiceNumber}
  - Vendor: ${invoiceData.vendor}
  - Amount: ${invoiceData.amount}
  - Date: ${invoiceData.issueDate}
  - Description: ${invoiceData.description}
  
  Available Categories: ${categoryOptions}
  
  Please provide:
  1. The most appropriate category from the list above.
  2. A confidence score (0.0 to 1.0) for your category assignment.
  3. 2-4 relevant tags for this invoice (e.g., "software", "subscription", "monthly").
  4. Whether this looks like a potential duplicate invoice (true/false).
  
  Format your response as valid JSON like this:
  {
    "category": "Category Name",
    "confidence": 0.95,
    "tags": ["tag1", "tag2", "tag3"],
    "isDuplicate": false,
    "duplicateOf": null,
    "explanation": "Brief explanation of your reasoning"
  }
  `;

  // Get completion from OpenAI
  const completion = await openai.chat.completions.create({
    model: model === "gpt-4" ? "gpt-4-turbo" : "gpt-3.5-turbo",
    messages: [
      { role: "system", content: "You are an invoice categorization assistant." },
      { role: "user", content: prompt },
    ],
    temperature: 0.3,
    response_format: { type: "json_object" },
  });

  // Parse the AI response
  const responseText = completion.choices[0].message.content || "{}";
  const result = JSON.parse(responseText);

  // Look up vendor ID if available
  let vendorId = invoice.vendorId;
  if (!vendorId && invoice.vendor?.name) {
    // Try to find or create a vendor
    const vendor = await db.vendor.findFirst({
      where: {
        userId: invoice.userId,
        name: { equals: invoice.vendor.name, mode: "insensitive" },
      },
    });
    
    if (vendor) {
      vendorId = vendor.id;
    }
  }

  return {
    category: result.category,
    confidence: result.confidence || defaultConfidence,
    tags: result.tags || [],
    vendorId,
    isDuplicate: result.isDuplicate || false,
    duplicateOf: result.duplicateOf || null,
    explanation: result.explanation || "",
  };
}

// Process an invoice using heuristics and similarity matching
async function processWithHeuristics(
  invoice: Invoice, 
  categories: Category[],
  confidenceThreshold: number
) {
  // Simple heuristic categorization based on vendor name and description
  const bestMatch = {
    category: "",
    confidence: 0,
    tags: [] as string[],
  };

  // Use vendor name for tags
  const tags = [];
  if (invoice.vendor?.name) {
    tags.push(invoice.vendor.name.toLowerCase().split(' ')[0]);
  }

  // Check invoice description against categories
  const description = invoice.description?.toLowerCase() || "";
  
  if (description) {
    // Try to extract meaningful tags from description
    const words = description.split(/\s+/);
    const potentialTags = words
      .filter((word: string) => word.length > 3)
      .filter((word: string) => !["invoice", "payment", "receipt", "charge", "bill"].includes(word));
    
    if (potentialTags.length > 0) {
      tags.push(...potentialTags.slice(0, 2));
    }
  }
  
  // Find similar invoices to check for duplicates
  const similarInvoices = await db.invoice.findMany({
    where: {
      userId: invoice.userId,
      id: { not: invoice.id },
      OR: [
        { vendorId: invoice.vendorId },
        { amount: invoice.amount },
      ],
      createdAt: {
        gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
      },
    },
    take: 5,
  });
  
  // Check for potential duplicates
  const isPotentialDuplicate = similarInvoices.some(
    (similar) => 
      similar.vendorId === invoice.vendorId && 
      similar.amount === invoice.amount
  );

  // Find most similar category based on name
  for (const category of categories) {
    const categoryName = category.name.toLowerCase();
    
    // Check for exact mentions
    if (description.includes(categoryName)) {
      bestMatch.category = category.name;
      bestMatch.confidence = 0.9;
      break;
    }
    
    // Check vendor name against category name
    if (invoice.vendor?.name && invoice.vendor.name.toLowerCase().includes(categoryName)) {
      bestMatch.category = category.name;
      bestMatch.confidence = 0.8;
      break;
    }
  }
  
  // If no good match found, use a default category
  if (bestMatch.confidence < confidenceThreshold) {
    // Try to guess based on amount patterns
    if (invoice.amount && invoice.amount < 50) {
      bestMatch.category = "Miscellaneous";
      bestMatch.confidence = 0.6;
    } else if (invoice.amount && invoice.amount > 1000) {
      bestMatch.category = "Equipment";
      bestMatch.confidence = 0.5;
    } else {
      // Default fallback
      bestMatch.category = "Uncategorized";
      bestMatch.confidence = 0.3;
    }
  }
  
  return {
    category: bestMatch.category,
    confidence: bestMatch.confidence,
    tags: [...new Set(tags)].slice(0, 4), // Unique tags, max 4
    vendorId: invoice.vendorId,
    isDuplicate: isPotentialDuplicate,
    duplicateOf: isPotentialDuplicate ? similarInvoices[0]?.id : null,
    explanation: "Categorized using heuristic pattern matching",
  };
} 