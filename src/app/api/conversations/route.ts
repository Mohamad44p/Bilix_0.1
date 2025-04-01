import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import db from "@/db/db";
import { z } from "zod";

// Schema for creating a new conversation
const createConversationSchema = z.object({
  title: z.string(),
  messages: z.array(
    z.object({
      role: z.string(),
      content: z.string(),
      timestamp: z.string().optional(),
      relatedData: z.any().optional(),
    })
  ),
});

// GET /api/conversations
export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get the user from the database
    const user = await db.user.findUnique({
      where: { clerkId: userId },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get conversations for the user
    const conversations = await db.conversation.findMany({
      where: { userId: user.id },
      orderBy: { updatedAt: "desc" },
      include: {
        messages: {
          orderBy: { timestamp: "asc" },
        },
      },
    });

    return NextResponse.json(conversations);
  } catch (error) {
    console.error("Error fetching conversations:", error);
    return NextResponse.json(
      { error: "Failed to fetch conversations" },
      { status: 500 }
    );
  }
}

// POST /api/conversations
export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get the user from the database
    const user = await db.user.findUnique({
      where: { clerkId: userId },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Parse the request body
    const body = await req.json();
    const validatedData = createConversationSchema.parse(body);

    // Create the conversation
    const conversation = await db.conversation.create({
      data: {
        title: validatedData.title,
        userId: user.id,
        messages: {
          create: validatedData.messages.map((message) => ({
            role: message.role,
            content: message.content,
            timestamp: message.timestamp ? new Date(message.timestamp) : new Date(),
            relatedData: message.relatedData || undefined,
          })),
        },
      },
      include: {
        messages: true,
      },
    });

    return NextResponse.json(conversation);
  } catch (error) {
    console.error("Error creating conversation:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    return NextResponse.json(
      { error: "Failed to create conversation" },
      { status: 500 }
    );
  }
} 