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

    // Update the invoice
    const updatedInvoice = await db.invoice.update({
      where: { id: params.id },
      data: {
        invoiceNumber: body.invoiceNumber,
        title: body.title,
        vendorName: body.vendorName,
        issueDate: body.issueDate ? new Date(body.issueDate) : null,
        dueDate: body.dueDate ? new Date(body.dueDate) : null,
        amount: body.amount ? parseFloat(body.amount) : null,
        currency: body.currency,
        status: body.status,
        notes: body.notes,
        tags: body.tags || [],
        categoryId: body.categoryId,
        vendorId: body.vendorId,
      },
      include: {
        category: true,
        vendor: true,
      },
    });

    return NextResponse.json(updatedInvoice);
  } catch (error) {
    console.error("Error updating invoice:", error);
    return NextResponse.json(
      { error: "Failed to update invoice" },
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