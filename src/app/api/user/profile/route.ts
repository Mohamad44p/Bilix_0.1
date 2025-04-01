import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import db from "@/db/db";
import { InvoiceStatus } from "@prisma/client";

export async function GET() {
  try {
    // Get authenticated Clerk user
    const user = await currentUser();
    
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user from database
    const dbUser = await db.user.findUnique({
      where: { clerkId: user.id },
      include: {
        organizations: true,
      },
    });

    if (!dbUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get user's active organization (first one for now)
    const organization = dbUser.organizations[0] || null;

    // Get invoice stats
    const invoices = await db.invoice.findMany({
      where: {
        userId: dbUser.id,
      },
    });

    // Calculate stats
    const totalInvoices = invoices.length;
    
    const pendingInvoices = invoices.filter(
      invoice => invoice.status === InvoiceStatus.PENDING
    );
    const pendingAmount = pendingInvoices.reduce(
      (sum, invoice) => sum + (invoice.amount || 0), 
      0
    );
    
    const overdueInvoices = invoices.filter(
      invoice => invoice.status === InvoiceStatus.OVERDUE
    );
    const overdueCount = overdueInvoices.length;

    // Format response
    const userProfile = {
      id: dbUser.id,
      clerkId: dbUser.clerkId,
      email: dbUser.email,
      firstName: dbUser.firstName || user.firstName || "",
      lastName: dbUser.lastName || user.lastName || "",
      profileImageUrl: dbUser.profileImageUrl || user.imageUrl,
      role: dbUser.role,
      organization: organization ? {
        id: organization.id,
        name: organization.name,
      } : undefined,
      stats: {
        totalInvoices,
        pendingAmount,
        overdueCount,
      }
    };

    return NextResponse.json(userProfile);
  } catch (error: unknown) {
    console.error("Error fetching user profile:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
} 