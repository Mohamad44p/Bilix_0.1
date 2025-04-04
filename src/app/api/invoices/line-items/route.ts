import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import db from "@/db/db";
import { z } from "zod";

// Schema for line item validation
const lineItemSchema = z.object({
  invoiceId: z.string(),
  description: z.string(),
  quantity: z.number().positive(),
  unitPrice: z.number().nonnegative(),
  totalPrice: z.number().nonnegative(),
  taxRate: z.number().nonnegative().optional(),
  taxAmount: z.number().nonnegative().optional(),
  discount: z.number().nonnegative().optional(),
  productSku: z.string().optional(),
  notes: z.string().optional(),
  attributes: z.array(z.object({
    name: z.string(),
    value: z.string()
  })).optional(),
});

/**
 * POST: Create a new line item for an invoice
 */
export async function POST(req: NextRequest) {
  try {
    // Authenticate user
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user from database
    const dbUser = await db.user.findUnique({
      where: { clerkId: clerkUserId },
    });

    if (!dbUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Parse request body
    const body = await req.json();
    const validatedData = lineItemSchema.parse(body);

    // Verify invoice exists and belongs to user
    const invoice = await db.invoice.findFirst({
      where: {
        id: validatedData.invoiceId,
        userId: dbUser.id,
      },
    });

    if (!invoice) {
      return NextResponse.json(
        { error: "Invoice not found or not authorized" },
        { status: 404 }
      );
    }

    // Create the line item
    // @ts-ignore - Using correct model name as shown in Prisma Studio
    const lineItem = await db.InvoiceLineItem.create({
      data: {
        description: validatedData.description,
        quantity: validatedData.quantity,
        unitPrice: validatedData.unitPrice,
        totalPrice: validatedData.totalPrice,
        taxRate: validatedData.taxRate,
        taxAmount: validatedData.taxAmount,
        discount: validatedData.discount,
        productSku: validatedData.productSku,
        notes: validatedData.notes,
        invoiceId: validatedData.invoiceId,
        ...(validatedData.attributes && validatedData.attributes.length > 0 && {
          attributes: {
            create: validatedData.attributes.map(attr => ({
              name: attr.name,
              value: attr.value
            }))
          }
        })
      },
    });

    return NextResponse.json(lineItem, { status: 201 });
  } catch (error) {
    console.error("Error creating line item:", error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: "Failed to create line item" },
      { status: 500 }
    );
  }
}

/**
 * GET: Get all line items for an invoice
 */
export async function GET(req: NextRequest) {
  try {
    // Authenticate user
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user from database
    const dbUser = await db.user.findUnique({
      where: { clerkId: clerkUserId },
    });

    if (!dbUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get invoice ID from query params
    const url = new URL(req.url);
    const invoiceId = url.searchParams.get("invoiceId");

    if (!invoiceId) {
      return NextResponse.json(
        { error: "Invoice ID is required" },
        { status: 400 }
      );
    }

    // Verify invoice exists and belongs to user
    const invoice = await db.invoice.findFirst({
      where: {
        id: invoiceId,
        userId: dbUser.id,
      },
    });

    if (!invoice) {
      return NextResponse.json(
        { error: "Invoice not found or not authorized" },
        { status: 404 }
      );
    }

    // Get line items for the invoice
    // @ts-ignore - Using correct model name as shown in Prisma Studio
    const lineItems = await db.InvoiceLineItem.findMany({
      where: {
        invoiceId,
      },
      include: {
        attributes: true
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    return NextResponse.json(lineItems);
  } catch (error) {
    console.error("Error getting line items:", error);
    return NextResponse.json(
      { error: "Failed to get line items" },
      { status: 500 }
    );
  }
}
