import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import db from "@/db/db";
import { z } from "zod";

// Schema for line item update validation
const lineItemUpdateSchema = z.object({
  description: z.string().optional(),
  quantity: z.number().positive().optional(),
  unitPrice: z.number().nonnegative().optional(),
  totalPrice: z.number().nonnegative().optional(),
  taxRate: z.number().nonnegative().optional(),
  taxAmount: z.number().nonnegative().optional(),
  discount: z.number().nonnegative().optional(),
  productSku: z.string().optional(),
  notes: z.string().optional(),
});

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

/**
 * GET: Get a specific line item by ID
 */
export async function GET(request: NextRequest, props: RouteParams) {
  const params = await props.params;
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

    // Get the line item
    const lineItem = await db.invoiceLineItem.findUnique({
      where: {
        id: params.id,
      },
      include: {
        invoice: {
          select: {
            userId: true,
          },
        },
      },
    });

    if (!lineItem) {
      return NextResponse.json(
        { error: "Line item not found" },
        { status: 404 }
      );
    }

    // Ensure the line item belongs to the user
    if (lineItem.invoice.userId !== dbUser.id) {
      return NextResponse.json(
        { error: "Unauthorized access to line item" },
        { status: 403 }
      );
    }

    // Return the line item without the invoice relation
    const { invoice, ...lineItemData } = lineItem;
    return NextResponse.json(lineItemData);
  } catch (error) {
    console.error("Error getting line item:", error);
    return NextResponse.json(
      { error: "Failed to get line item" },
      { status: 500 }
    );
  }
}

/**
 * PUT: Update a specific line item
 */
export async function PUT(request: NextRequest, props: RouteParams) {
  const params = await props.params;
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

    // Get the line item to check ownership
    const existingLineItem = await db.invoiceLineItem.findUnique({
      where: {
        id: params.id,
      },
      include: {
        invoice: {
          select: {
            userId: true,
          },
        },
      },
    });

    if (!existingLineItem) {
      return NextResponse.json(
        { error: "Line item not found" },
        { status: 404 }
      );
    }

    // Ensure the line item belongs to the user
    if (existingLineItem.invoice.userId !== dbUser.id) {
      return NextResponse.json(
        { error: "Unauthorized access to line item" },
        { status: 403 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validatedData = lineItemUpdateSchema.parse(body);

    // Update the line item
    const updatedLineItem = await db.invoiceLineItem.update({
      where: {
        id: params.id,
      },
      data: validatedData,
    });

    return NextResponse.json(updatedLineItem);
  } catch (error) {
    console.error("Error updating line item:", error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: "Failed to update line item" },
      { status: 500 }
    );
  }
}

/**
 * DELETE: Delete a specific line item
 */
export async function DELETE(request: NextRequest, props: RouteParams) {
  const params = await props.params;
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

    // Get the line item to check ownership
    const existingLineItem = await db.invoiceLineItem.findUnique({
      where: {
        id: params.id,
      },
      include: {
        invoice: {
          select: {
            userId: true,
          },
        },
      },
    });

    if (!existingLineItem) {
      return NextResponse.json(
        { error: "Line item not found" },
        { status: 404 }
      );
    }

    // Ensure the line item belongs to the user
    if (existingLineItem.invoice.userId !== dbUser.id) {
      return NextResponse.json(
        { error: "Unauthorized access to line item" },
        { status: 403 }
      );
    }

    // Delete the line item
    await db.invoiceLineItem.delete({
      where: {
        id: params.id,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting line item:", error);
    return NextResponse.json(
      { error: "Failed to delete line item" },
      { status: 500 }
    );
  }
} 