import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import db from "@/db/db";
import { updateInventoryFromInvoice } from "@/lib/services/inventory-service";

export async function POST(req: NextRequest) {
  try {
    const { userId, orgId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    const { invoiceId, invoiceType, lineItems } = await req.json();
    
    if (!invoiceId || !invoiceType || !lineItems) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }
    
    if (invoiceType !== 'PURCHASE' && invoiceType !== 'PAYMENT') {
      return NextResponse.json(
        { error: "Invalid invoice type" },
        { status: 400 }
      );
    }
    
    const invoice = await db.invoice.findUnique({
      where: {
        id: invoiceId,
        userId
      }
    });
    
    if (!invoice) {
      return NextResponse.json(
        { error: "Invoice not found" },
        { status: 404 }
      );
    }
    
    await updateInventoryFromInvoice(
      invoiceId,
      invoiceType,
      lineItems,
      userId,
      orgId || undefined
    );
    
    return NextResponse.json(
      { success: true, message: "Inventory updated successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error updating inventory:", error);
    return NextResponse.json(
      { error: "Failed to update inventory", details: (error as Error).message },
      { status: 500 }
    );
  }
}
