import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import db from "@/db/db";
import { put, del } from "@vercel/blob";
import { nanoid } from "nanoid";

// POST /api/uploads/sample-invoice - Upload a sample invoice
export async function POST(request: NextRequest) {
  try {
    const { userId: clerkUserId } = await auth();
    
    if (!clerkUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user from database
    const user = await db.user.findUnique({
      where: { clerkId: clerkUserId },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Parse form data to get the file
    const formData = await request.formData();
    const file = formData.get("file") as File;
    
    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Generate a unique ID for the file
    const uniqueId = nanoid();
    const fileName = `ai-samples/${uniqueId}-${file.name}`;

    // Upload the file to Vercel Blob
    const { url } = await put(fileName, file, {
      access: "public",
    });

    // Get or create AI settings for the user
    const aiSettings = await db.aISettings.findUnique({
      where: { userId: user.id },
    });

    if (aiSettings) {
      // Update the AI settings with the new sample invoice URL
      await db.aISettings.update({
        where: { userId: user.id },
        data: {
          sampleInvoiceUrls: [...aiSettings.sampleInvoiceUrls, url],
        },
      });
    } else {
      // Create AI settings with the sample invoice URL
      await db.aISettings.create({
        data: {
          userId: user.id,
          customInstructions: "",
          confidenceThreshold: 0.7,
          preferredCategories: [],
          sampleInvoiceUrls: [url],
        },
      });
    }

    return NextResponse.json({ fileUrl: url });
  } catch (error) {
    console.error("Error uploading sample invoice:", error);
    return NextResponse.json(
      { error: "Failed to upload sample invoice" },
      { status: 500 }
    );
  }
}

// DELETE /api/uploads/sample-invoice - Delete a sample invoice
export async function DELETE(request: NextRequest) {
  try {
    const { userId: clerkUserId } = await auth();
    
    if (!clerkUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user from database
    const user = await db.user.findUnique({
      where: { clerkId: clerkUserId },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get the fileUrl from query params
    const url = new URL(request.url);
    const fileUrl = url.searchParams.get("fileUrl");
    
    if (!fileUrl) {
      return NextResponse.json({ error: "No file URL provided" }, { status: 400 });
    }

    // Get AI settings for the user
    const aiSettings = await db.aISettings.findUnique({
      where: { userId: user.id },
    });

    if (!aiSettings || !aiSettings.sampleInvoiceUrls.includes(fileUrl)) {
      return NextResponse.json({ error: "File not found in user's sample invoices" }, { status: 404 });
    }

    // Delete the file from Vercel Blob
    try {
      await del(fileUrl);
    } catch (blobError) {
      console.error("Error deleting file from blob storage:", blobError);
      // Continue even if blob deletion fails
    }

    // Update AI settings to remove the URL
    await db.aISettings.update({
      where: { userId: user.id },
      data: {
        sampleInvoiceUrls: aiSettings.sampleInvoiceUrls.filter(url => url !== fileUrl),
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting sample invoice:", error);
    return NextResponse.json(
      { error: "Failed to delete sample invoice" },
      { status: 500 }
    );
  }
} 