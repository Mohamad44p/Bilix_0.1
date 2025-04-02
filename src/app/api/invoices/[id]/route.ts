import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import db from "@/db/db";

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

export async function GET(request: Request, props: RouteParams) {
  const params = await props.params;
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

    // Get invoice by ID, ensuring it belongs to the current user
    const invoice = await db.invoice.findFirst({
      where: { 
        id: params.id,
        userId: dbUser.id 
      },
      include: {
        category: true,
        vendor: true,
      },
    });

    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    return NextResponse.json(invoice);
  } catch (error) {
    console.error("Error fetching invoice:", error);
    return NextResponse.json(
      { error: "Failed to fetch invoice" },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request, props: RouteParams) {
  const params = await props.params;
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

    // Check if invoice exists and belongs to the user
    const existingInvoice = await db.invoice.findFirst({
      where: { 
        id: params.id,
        userId: dbUser.id 
      },
    });

    if (!existingInvoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    // Parse request body
    const body = await request.json();
    console.log(`Received update for invoice ${params.id}:`, body);

    // Create a data object with only the fields that are provided
    const updateData: Record<string, any> = {};
    
    if (body.invoiceNumber !== undefined) updateData.invoiceNumber = body.invoiceNumber;
    if (body.title !== undefined) updateData.title = body.title;
    if (body.vendorName !== undefined) updateData.vendorName = body.vendorName;
    if (body.issueDate !== undefined) updateData.issueDate = body.issueDate ? new Date(body.issueDate) : null;
    if (body.dueDate !== undefined) updateData.dueDate = body.dueDate ? new Date(body.dueDate) : null;
    if (body.amount !== undefined) updateData.amount = body.amount ? parseFloat(body.amount) : null;
    if (body.currency !== undefined) updateData.currency = body.currency;
    if (body.status !== undefined) {
      // Make sure status is uppercase
      updateData.status = typeof body.status === 'string' ? body.status.toUpperCase() : body.status;
      console.log(`Normalized status to: ${updateData.status}`);
    }
    if (body.notes !== undefined) updateData.notes = body.notes;
    if (body.tags !== undefined) updateData.tags = body.tags || [];
    if (body.categoryId !== undefined) updateData.categoryId = body.categoryId;
    if (body.vendorId !== undefined) updateData.vendorId = body.vendorId;
    if (body.extractedData !== undefined) updateData.extractedData = body.extractedData;

    console.log(`Updating invoice ${params.id} with data:`, updateData);

    // Update the invoice
    const updatedInvoice = await db.invoice.update({
      where: { id: params.id },
      data: updateData,
      include: {
        category: true,
        vendor: true,
      },
    });

    console.log(`Successfully updated invoice ${params.id}`);
    return NextResponse.json(updatedInvoice);
  } catch (error) {
    console.error("Error updating invoice:", error);
    return NextResponse.json(
      { error: "Failed to update invoice", details: error instanceof Error ? error.message : null },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request, props: RouteParams) {
  const params = await props.params;
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

    // Check if invoice exists and belongs to the user
    const existingInvoice = await db.invoice.findFirst({
      where: { 
        id: params.id,
        userId: dbUser.id 
      },
    });

    if (!existingInvoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    // Delete the invoice
    await db.invoice.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting invoice:", error);
    return NextResponse.json(
      { error: "Failed to delete invoice" },
      { status: 500 }
    );
  }
} 