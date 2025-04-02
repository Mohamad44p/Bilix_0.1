import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import db from "@/db/db";
import { z } from "zod";

// Define schema for AI settings
const AISettingsSchema = z.object({
  customInstructions: z.string().optional(),
  confidenceThreshold: z.number().min(0).max(1).default(0.7),
  preferredCategories: z.array(z.string()).default([]),
  sampleInvoiceUrls: z.array(z.string()).default([]),
});

// GET /api/user/ai-settings - Get current user's AI settings
export async function GET() {
  try {
    const { userId: clerkUserId } = await auth();
    console.log("GET AI settings for clerk user:", clerkUserId);
    
    if (!clerkUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user from database
    const user = await db.user.findUnique({
      where: { clerkId: clerkUserId },
    });

    if (!user) {
      console.log("User not found in database for clerkId:", clerkUserId);
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    console.log("Found user in database:", user.id);

    // Get AI settings
    const aiSettings = await db.aISettings.findUnique({
      where: { userId: user.id },
    });

    // Return settings or default values
    if (!aiSettings) {
      console.log("No AI settings found, returning defaults");
      return NextResponse.json({
        customInstructions: "",
        confidenceThreshold: 0.7,
        preferredCategories: [],
        sampleInvoiceUrls: [],
      });
    }

    console.log("AI settings found:", aiSettings.id);
    return NextResponse.json(aiSettings);
  } catch (error) {
    console.error("Error fetching AI settings:", error);
    return NextResponse.json(
      { error: "Failed to fetch AI settings" },
      { status: 500 }
    );
  }
}

// POST /api/user/ai-settings - Save user's AI settings
export async function POST(request: Request) {
  try {
    const { userId: clerkUserId } = await auth();
    console.log("POST AI settings for clerk user:", clerkUserId);
    
    if (!clerkUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user from database
    const user = await db.user.findUnique({
      where: { clerkId: clerkUserId },
    });

    if (!user) {
      console.log("User not found in database for clerkId:", clerkUserId);
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    console.log("Found user in database:", user.id);

    // Parse and validate request body
    const body = await request.json();
    console.log("Request body:", body);
    
    try {
      const validatedData = AISettingsSchema.parse(body);
      console.log("Validated data:", validatedData);

      // Check if AI settings already exist
      const existingSettings = await db.aISettings.findUnique({
        where: { userId: user.id },
      });

      if (existingSettings) {
        // Update existing settings
        console.log("Updating existing settings:", existingSettings.id);
        const updatedSettings = await db.aISettings.update({
          where: { userId: user.id },
          data: {
            customInstructions: validatedData.customInstructions,
            confidenceThreshold: validatedData.confidenceThreshold,
            preferredCategories: validatedData.preferredCategories,
            sampleInvoiceUrls: validatedData.sampleInvoiceUrls,
          },
        });

        console.log("Settings updated successfully");
        return NextResponse.json(updatedSettings);
      } else {
        // Create new settings
        console.log("Creating new AI settings for user:", user.id);
        const newSettings = await db.aISettings.create({
          data: {
            userId: user.id,
            customInstructions: validatedData.customInstructions,
            confidenceThreshold: validatedData.confidenceThreshold,
            preferredCategories: validatedData.preferredCategories,
            sampleInvoiceUrls: validatedData.sampleInvoiceUrls,
          },
        });

        console.log("New settings created successfully");
        return NextResponse.json(newSettings);
      }
    } catch (validationError) {
      console.error("Validation error:", validationError);
      if (validationError instanceof z.ZodError) {
        return NextResponse.json({ error: validationError.errors }, { status: 400 });
      }
      throw validationError;
    }
  } catch (error) {
    console.error("Error saving AI settings:", error);
    return NextResponse.json(
      { error: "Failed to save AI settings", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
} 