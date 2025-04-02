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

    console.log(`Batch operation request: ${operation}`, { invoiceIds, ...additionalData });

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
      const foundIds = invoices.map(i => i.id);
      const missingIds = invoiceIds.filter(id => !foundIds.includes(id));
      
      console.error(`Some invoices not found or don't belong to the user:`, missingIds);
      
      return NextResponse.json(
        { 
          error: "One or more invoices not found or don't belong to the user",
          missingIds 
        },
        { status: 403 }
      );
    }

    // Process the batch operation
    const failedIds: string[] = [];
    const processedIds: string[] = [];
    
    console.log(`Processing batch operation: ${operation} on ${invoiceIds.length} invoices`);

    try {
      switch (operation.toLowerCase()) {
        case "approve":
          // Mark invoices as PAID
          const approveResult = await db.invoice.updateMany({
            where: {
              id: { in: invoiceIds },
              userId: dbUser.id,
            },
            data: {
              status: InvoiceStatus.PAID,
            },
          });
          
          console.log(`Approved ${approveResult.count} invoices`);
          processedIds.push(...invoiceIds);
          break;

        case "archive":
          try {
            console.log(`Archiving ${invoiceIds.length} invoices...`);
            
            // Mark invoices as CANCELLED (which is used for archived items)
            const archiveResult = await db.invoice.updateMany({
              where: {
                id: { in: invoiceIds },
                userId: dbUser.id,
              },
              data: {
                status: InvoiceStatus.CANCELLED, // Using CANCELLED status for archived invoices
              },
            });
            
            console.log(`Successfully archived ${archiveResult.count} invoices`);
            processedIds.push(...invoiceIds);
          } catch (error) {
            console.error("Error during archive operation:", error);
            failedIds.push(...invoiceIds);
          }
          break;

        case "delete":
          // Delete invoices
          const deleteResult = await db.invoice.deleteMany({
            where: {
              id: { in: invoiceIds },
              userId: dbUser.id,
            },
          });
          
          console.log(`Deleted ${deleteResult.count} invoices`);
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
          
          console.log(`Tagged ${processedIds.length} invoices, failed for ${failedIds.length}`);
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
    } catch (operationError) {
      console.error(`Error in batch operation '${operation}':`, operationError);
      return NextResponse.json({
        error: `Operation failed: ${operationError instanceof Error ? operationError.message : 'Unknown error'}`,
        success: false,
        processedIds,
        failedIds: invoiceIds,
      }, { status: 500 });
    }
  } catch (error) {
    console.error("Error processing batch operation:", error);
    return NextResponse.json(
      { error: "Failed to process batch operation", details: error instanceof Error ? error.message : undefined },
      { status: 500 }
    );
  }
} 