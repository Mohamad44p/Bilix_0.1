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

    // Get total count for pagination
    const total = await db.invoice.count({
      where: { userId: dbUser.id },
    });

    // Get invoices with pagination
    const invoices = await db.invoice.findMany({
      where: { userId: dbUser.id },
      include: {
        category: true,
        vendor: true,
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    });

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
      { error: "Failed to fetch invoices" },
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