import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import db from "@/db/db";
import { InvoiceStatus } from "@prisma/client";

// Define the invoice data type
type InvoiceCreateData = {
  userId: string;
  invoiceNumber: string;
  title: string;
  vendorName: string;
  issueDate?: Date;
  dueDate?: Date;
  amount?: number;
  currency: string;
  status: InvoiceStatus;
  notes?: string;
  tags: string[];
  categoryId?: string;
  vendorId?: string;
};

export async function GET(request: Request) {
  try {
    const { userId: clerkUserId } = await auth();
    
    if (!clerkUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get the user from database
    const dbUser = await db.user.findUnique({
      where: { clerkId: clerkUserId },
    });

    if (!dbUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Parse query parameters
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get("page") || "1");
    const limit = parseInt(url.searchParams.get("limit") || "10");
    const skip = (page - 1) * limit;
    
    // Parse filters
    const status = url.searchParams.get("status") || undefined;
    const search = url.searchParams.get("search") || undefined;
    const category = url.searchParams.get("category") || undefined;
    const tags = url.searchParams.getAll("tags") || undefined;
    const startDate = url.searchParams.get("startDate") || undefined;
    const endDate = url.searchParams.get("endDate") || undefined;
    const naturalLanguageQuery = url.searchParams.get("naturalLanguageQuery") || undefined;
    
    console.log("GET /api/invoices filters:", { 
      page, limit, status, search, category, tags, startDate, endDate, naturalLanguageQuery 
    });

    // Build where conditions
    const whereConditions: any = { userId: dbUser.id };
    
    if (status) {
      whereConditions.status = status;
    }
    
    if (search) {
      whereConditions.OR = [
        { invoiceNumber: { contains: search, mode: 'insensitive' } },
        { vendorName: { contains: search, mode: 'insensitive' } },
        { title: { contains: search, mode: 'insensitive' } },
        { notes: { contains: search, mode: 'insensitive' } },
      ];
    }
    
    if (category) {
      whereConditions.category = {
        name: { equals: category, mode: 'insensitive' },
      };
    }
    
    if (tags && tags.length > 0) {
      whereConditions.tags = {
        hasSome: tags,
      };
    }
    
    if (startDate || endDate) {
      whereConditions.issueDate = {};
      
      if (startDate) {
        whereConditions.issueDate.gte = new Date(startDate);
      }
      
      if (endDate) {
        whereConditions.issueDate.lte = new Date(endDate);
      }
    }
    
    // Process natural language query (simplified implementation)
    if (naturalLanguageQuery) {
      console.log("Natural language query:", naturalLanguageQuery);
      
      const nq = naturalLanguageQuery.toLowerCase();
      
      // ===== Status filters =====
      if (nq.includes("overdue")) {
        whereConditions.status = "OVERDUE";
      } else if (nq.includes("paid")) {
        whereConditions.status = "PAID";
      } else if (nq.includes("pending")) {
        whereConditions.status = "PENDING";
      } else if (nq.includes("archived") || nq.includes("cancelled")) {
        whereConditions.status = "CANCELLED";
      }
      
      // ===== Date filters =====
      if (nq.includes("last month")) {
        const now = new Date();
        const firstDayCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const lastDayLastMonth = new Date(firstDayCurrentMonth.getTime() - 1);
        const firstDayLastMonth = new Date(lastDayLastMonth.getFullYear(), lastDayLastMonth.getMonth(), 1);
        
        whereConditions.issueDate = {
          gte: firstDayLastMonth,
          lte: lastDayLastMonth,
        };
      } else if (nq.includes("this month")) {
        const now = new Date();
        const firstDayCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const lastDayCurrentMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        
        whereConditions.issueDate = {
          gte: firstDayCurrentMonth,
          lte: lastDayCurrentMonth,
        };
      } else if (nq.includes("this year")) {
        const now = new Date();
        const firstDayCurrentYear = new Date(now.getFullYear(), 0, 1);
        const lastDayCurrentYear = new Date(now.getFullYear(), 11, 31);
        
        whereConditions.issueDate = {
          gte: firstDayCurrentYear,
          lte: lastDayCurrentYear,
        };
      } else if (nq.includes("last year")) {
        const now = new Date();
        const firstDayLastYear = new Date(now.getFullYear() - 1, 0, 1);
        const lastDayLastYear = new Date(now.getFullYear() - 1, 11, 31);
        
        whereConditions.issueDate = {
          gte: firstDayLastYear,
          lte: lastDayLastYear,
        };
      } else if (nq.includes("last week")) {
        const now = new Date();
        const todayDayOfWeek = now.getDay(); // 0 = Sunday, 1 = Monday, etc.
        const daysToLastSunday = todayDayOfWeek === 0 ? 7 : todayDayOfWeek;
        const lastSunday = new Date(now);
        lastSunday.setDate(now.getDate() - daysToLastSunday);
        
        const lastSaturday = new Date(lastSunday);
        lastSaturday.setDate(lastSunday.getDate() - 1);
        
        const lastMonday = new Date(lastSunday);
        lastMonday.setDate(lastSunday.getDate() - 6);
        
        whereConditions.issueDate = {
          gte: lastMonday,
          lte: lastSaturday,
        };
      }
      
      // ===== Vendor filters =====
      if (nq.includes("from") || nq.includes("vendor")) {
        // Extract vendor name (simplified)
        const vendorPattern = /from\s+([a-z0-9\s]+)|\bvendor\s+([a-z0-9\s]+)/i;
        const vendorMatch = nq.match(vendorPattern);
        
        if (vendorMatch && (vendorMatch[1] || vendorMatch[2])) {
          const vendorName = (vendorMatch[1] || vendorMatch[2]).trim();
          whereConditions.vendorName = {
            contains: vendorName,
            mode: 'insensitive',
          };
        }
      }
      
      // ===== Amount filters =====
      // Less than pattern
      const lessThanPattern = /less than\s+[$]?(\d[\d,.]*)|under\s+[$]?(\d[\d,.]*)|below\s+[$]?(\d[\d,.]*)|maximum\s+[$]?(\d[\d,.]*)|max\s+[$]?(\d[\d,.]*)|<\s*[$]?(\d[\d,.]*)/i;
      const lessThanMatch = nq.match(lessThanPattern);
      
      if (lessThanMatch) {
        // Find the first captured group with a value
        const amountStr = lessThanMatch.slice(1).find(m => m);
        
        if (amountStr) {
          const amount = parseFloat(amountStr.replace(/[,$]/g, ''));
          
          if (!isNaN(amount)) {
            whereConditions.amount = { 
              ...(whereConditions.amount || {}),
              lt: amount 
            };
            console.log(`Added 'less than ${amount}' filter`);
          }
        }
      }
      
      // Greater than pattern
      const greaterThanPattern = /more than\s+[$]?(\d[\d,.]*)|over\s+[$]?(\d[\d,.]*)|above\s+[$]?(\d[\d,.]*)|minimum\s+[$]?(\d[\d,.]*)|min\s+[$]?(\d[\d,.]*)|>\s*[$]?(\d[\d,.]*)/i;
      const greaterThanMatch = nq.match(greaterThanPattern);
      
      if (greaterThanMatch) {
        // Find the first captured group with a value
        const amountStr = greaterThanMatch.slice(1).find(m => m);
        
        if (amountStr) {
          const amount = parseFloat(amountStr.replace(/[,$]/g, ''));
          
          if (!isNaN(amount)) {
            whereConditions.amount = { 
              ...(whereConditions.amount || {}),
              gt: amount 
            };
            console.log(`Added 'greater than ${amount}' filter`);
          }
        }
      }
      
      // Equal to pattern
      const equalToPattern = /exactly\s+[$]?(\d[\d,.]*)|equal to\s+[$]?(\d[\d,.]*)|equals\s+[$]?(\d[\d,.]*)|=\s*[$]?(\d[\d,.]*)/i;
      const equalToMatch = nq.match(equalToPattern);
      
      if (equalToMatch) {
        // Find the first captured group with a value
        const amountStr = equalToMatch.slice(1).find(m => m);
        
        if (amountStr) {
          const amount = parseFloat(amountStr.replace(/[,$]/g, ''));
          
          if (!isNaN(amount)) {
            whereConditions.amount = amount;
            console.log(`Added 'equals ${amount}' filter`);
          }
        }
      }
      
      // Range pattern (between X and Y)
      const rangePattern = /between\s+[$]?(\d[\d,.]*)\s+and\s+[$]?(\d[\d,.]*)/i;
      const rangeMatch = nq.match(rangePattern);
      
      if (rangeMatch && rangeMatch[1] && rangeMatch[2]) {
        const lowerAmount = parseFloat(rangeMatch[1].replace(/[,$]/g, ''));
        const upperAmount = parseFloat(rangeMatch[2].replace(/[,$]/g, ''));
        
        if (!isNaN(lowerAmount) && !isNaN(upperAmount)) {
          whereConditions.amount = { 
            gte: lowerAmount,
            lte: upperAmount
          };
          console.log(`Added 'between ${lowerAmount} and ${upperAmount}' filter`);
        }
      }
      
      // ===== Category filters =====
      const categoryPattern = /category\s+([a-z0-9\s]+)|in\s+category\s+([a-z0-9\s]+)/i;
      const categoryMatch = nq.match(categoryPattern);
      
      if (categoryMatch && (categoryMatch[1] || categoryMatch[2])) {
        const categoryName = (categoryMatch[1] || categoryMatch[2]).trim();
        whereConditions.category = {
          name: { contains: categoryName, mode: 'insensitive' },
        };
        console.log(`Added category filter: ${categoryName}`);
      }
      
      // ===== Tag filters =====
      const tagPattern = /tag(?:ged)?\s+(?:with|as)?\s+([a-z0-9\s]+)|with\s+tag\s+([a-z0-9\s]+)/i;
      const tagMatch = nq.match(tagPattern);
      
      if (tagMatch && (tagMatch[1] || tagMatch[2])) {
        const tagName = (tagMatch[1] || tagMatch[2]).trim();
        whereConditions.tags = {
          hasSome: [tagName],
        };
        console.log(`Added tag filter: ${tagName}`);
      }
      
      // ===== Generic search through multiple fields =====
      // Extract potentially important terms not covered by specific patterns
      const importantTerms = nq
        .replace(/overdue|paid|pending|archived|cancelled|last month|this month|this year|last year|last week|from|vendor|category|tag|tagged|with|as|less than|under|below|maximum|max|more than|over|above|minimum|min|exactly|equal to|equals|between|and/gi, '')
        .split(/\s+/)
        .filter(term => term.length > 3)  // Only consider terms with more than 3 characters
        .filter(term => !(/^\d+$/.test(term)))  // Exclude numbers
        .filter(Boolean);  // Remove empty strings
      
      if (importantTerms.length > 0) {
        // Include OR conditions for each important term
        const termConditions = importantTerms.map(term => ([
          { invoiceNumber: { contains: term, mode: 'insensitive' } },
          { vendorName: { contains: term, mode: 'insensitive' } },
          { title: { contains: term, mode: 'insensitive' } },
          { notes: { contains: term, mode: 'insensitive' } }
        ])).flat();
        
        // If we already have OR conditions, append these; otherwise create new ones
        if (whereConditions.OR) {
          whereConditions.OR = [...whereConditions.OR, ...termConditions];
        } else {
          whereConditions.OR = termConditions;
        }
        console.log(`Added generic search for terms: ${importantTerms.join(', ')}`);
      }
    }
    
    console.log("Final where conditions:", JSON.stringify(whereConditions, null, 2));

    // Get total count for pagination with filters
    const total = await db.invoice.count({
      where: whereConditions,
    });

    // Get invoices with pagination and filters
    const invoices = await db.invoice.findMany({
      where: whereConditions,
      include: {
        category: true,
        vendor: true,
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    });
    
    console.log(`Query returned ${invoices.length} invoices out of ${total} total matches`);

    return NextResponse.json({
      invoices,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching invoices:", error);
    return NextResponse.json(
      { error: "Failed to fetch invoices", details: error instanceof Error ? error.message : undefined },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const { userId: clerkUserId } = await auth();
    
    if (!clerkUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get the user from database
    const dbUser = await db.user.findUnique({
      where: { clerkId: clerkUserId },
    });

    if (!dbUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Parse request body
    const body = await request.json();
    
    // Create base invoice data
    const createData: InvoiceCreateData = {
      userId: dbUser.id,
      invoiceNumber: body.invoiceNumber,
      title: body.title,
      vendorName: body.vendorName,
      issueDate: body.issueDate ? new Date(body.issueDate) : undefined,
      dueDate: body.dueDate ? new Date(body.dueDate) : undefined,
      amount: body.amount ? parseFloat(body.amount) : undefined,
      currency: body.currency,
      status: (body.status as InvoiceStatus) || InvoiceStatus.PENDING,
      notes: body.notes,
      tags: body.tags || [],
    };
    
    // Check if category exists
    if (body.categoryId) {
      const categoryExists = await db.category.findUnique({
        where: { id: body.categoryId },
      });
      
      if (categoryExists) {
        createData.categoryId = body.categoryId;
      }
    }
    
    // Check if vendor exists
    if (body.vendorId) {
      const vendorExists = await db.vendor.findUnique({
        where: { id: body.vendorId },
      });
      
      if (vendorExists) {
        createData.vendorId = body.vendorId;
      }
    }

    // Create the invoice
    const invoice = await db.invoice.create({
      data: createData,
    });

    return NextResponse.json(invoice, { status: 201 });
  } catch (error) {
    console.error("Error creating invoice:", error);
    return NextResponse.json(
      { error: "Failed to create invoice" },
      { status: 500 }
    );
  }
} 