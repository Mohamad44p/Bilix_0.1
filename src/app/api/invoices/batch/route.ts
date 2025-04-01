import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import db from "@/db/db";
import { InvoiceStatus } from "@prisma/client";

export async function POST(request: Request) {
  try {
    const { userId: clerkUserId } = await auth();
    
    if (!clerkUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const dbUser = await db.user.findUnique({
      where: { clerkId: clerkUserId },
    });

    if (!dbUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Parse the request body
    const body = await request.json();
    const { operation, invoiceIds, ...additionalData } = body;

    if (!operation || !invoiceIds || !Array.isArray(invoiceIds) || invoiceIds.length === 0) {
      return NextResponse.json(
        { error: "Invalid operation parameters" },
        { status: 400 }
      );
    }

    // Make sure all invoices belong to the user
    const invoices = await db.invoice.findMany({
      where: {
        id: { in: invoiceIds },
        userId: dbUser.id,
      },
    });

    if (invoices.length !== invoiceIds.length) {
      return NextResponse.json(
        { error: "One or more invoices not found or don't belong to the user" },
        { status: 403 }
      );
    }

    // Process the batch operation
    const failedIds: string[] = [];
    const processedIds: string[] = [];

    switch (operation) {
      case "approve":
        // Mark invoices as PAID
        await db.invoice.updateMany({
          where: {
            id: { in: invoiceIds },
            userId: dbUser.id,
          },
          data: {
            status: InvoiceStatus.PAID,
          },
        });
        processedIds.push(...invoiceIds);
        break;

      case "archive":
        // Mark invoices as CANCELLED
        await db.invoice.updateMany({
          where: {
            id: { in: invoiceIds },
            userId: dbUser.id,
          },
          data: {
            status: InvoiceStatus.CANCELLED,
          },
        });
        processedIds.push(...invoiceIds);
        break;

      case "delete":
        // Delete invoices
        await db.invoice.deleteMany({
          where: {
            id: { in: invoiceIds },
            userId: dbUser.id,
          },
        });
        processedIds.push(...invoiceIds);
        break;

      case "tag":
        // Add tags to invoices
        if (!additionalData.tags || !Array.isArray(additionalData.tags)) {
          return NextResponse.json(
            { error: "Tags array is required for tag operation" },
            { status: 400 }
          );
        }

        // For each invoice, update tags individually to preserve existing tags
        for (const invoiceId of invoiceIds) {
          try {
            const invoice = await db.invoice.findUnique({
              where: { id: invoiceId },
              select: { tags: true },
            });

            if (invoice) {
              // Combine existing tags with new ones, removing duplicates
              const updatedTags = Array.from(
                new Set([...invoice.tags, ...additionalData.tags])
              );

              await db.invoice.update({
                where: { id: invoiceId },
                data: { tags: updatedTags },
              });

              processedIds.push(invoiceId);
            } else {
              failedIds.push(invoiceId);
            }
          } catch (error) {
            console.error(`Error updating tags for invoice ${invoiceId}:`, error);
            failedIds.push(invoiceId);
          }
        }
        break;

      default:
        return NextResponse.json(
          { error: "Unsupported operation" },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: failedIds.length === 0,
      processedIds,
      failedIds,
    });
  } catch (error) {
    console.error("Error processing batch operation:", error);
    return NextResponse.json(
      { error: "Failed to process batch operation" },
      { status: 500 }
    );
  }
} 