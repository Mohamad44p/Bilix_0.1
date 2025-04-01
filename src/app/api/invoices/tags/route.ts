import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import db from "@/db/db";

export async function GET() {
  try {
    const { userId: clerkUserId } = await auth();
    
    if (!clerkUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get the user from database using clerkId
    const dbUser = await db.user.findUnique({
      where: { clerkId: clerkUserId },
    });

    if (!dbUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Fetch all invoices to extract unique tags
    const invoices = await db.invoice.findMany({
      where: { userId: dbUser.id },
      select: { tags: true },
    });

    // Extract and flatten all tags, then remove duplicates
    const allTags = Array.from(
      new Set(
        invoices.flatMap(invoice => invoice.tags)
      )
    ).sort();

    return NextResponse.json(allTags);
  } catch (error) {
    console.error("Error fetching tags:", error);
    return NextResponse.json(
      { error: "Failed to fetch tags" },
      { status: 500 }
    );
  }
} 