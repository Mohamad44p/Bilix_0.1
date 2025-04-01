import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import db from "@/db/db";
import { z } from "zod";

// Schema for adding a message to a conversation
const addMessageSchema = z.object({
  role: z.string(),
  content: z.string(),
  timestamp: z.string().optional(),
  relatedData: z.any().optional(),
});

// GET /api/conversations/[id]
export async function GET(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
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

    // Get the conversation
    const conversation = await db.conversation.findUnique({
      where: {
        id: params.id,
        userId: user.id,
      },
      include: {
        messages: {
          orderBy: { timestamp: "asc" },
        },
      },
    });

    if (!conversation) {
      return NextResponse.json(
        { error: "Conversation not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(conversation);
  } catch (error) {
    console.error("Error fetching conversation:", error);
    return NextResponse.json(
      { error: "Failed to fetch conversation" },
      { status: 500 }
    );
  }
}

// PATCH /api/conversations/[id]
export async function PATCH(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
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

    // Get the existing conversation
    const existingConversation = await db.conversation.findUnique({
      where: {
        id: params.id,
        userId: user.id,
      },
    });

    if (!existingConversation) {
      return NextResponse.json(
        { error: "Conversation not found" },
        { status: 404 }
      );
    }

    // Parse and validate the request body
    const body = await req.json();
    
    // Handle adding a new message to the conversation
    if (body.message) {
      const validatedMessage = addMessageSchema.parse(body.message);
      
      const updatedConversation = await db.conversation.update({
        where: { id: params.id },
        data: {
          updatedAt: new Date(),
          messages: {
            create: {
              role: validatedMessage.role,
              content: validatedMessage.content,
              timestamp: validatedMessage.timestamp ? new Date(validatedMessage.timestamp) : new Date(),
              relatedData: validatedMessage.relatedData || undefined,
            },
          },
        },
        include: {
          messages: {
            orderBy: { timestamp: "asc" },
          },
        },
      });
      
      return NextResponse.json(updatedConversation);
    }
    
    // Handle updating the conversation title
    if (body.title) {
      const updatedConversation = await db.conversation.update({
        where: { id: params.id },
        data: {
          title: body.title,
          updatedAt: new Date(),
        },
        include: {
          messages: {
            orderBy: { timestamp: "asc" },
          },
        },
      });
      
      return NextResponse.json(updatedConversation);
    }

    return NextResponse.json(
      { error: "No valid update data provided" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Error updating conversation:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    return NextResponse.json(
      { error: "Failed to update conversation" },
      { status: 500 }
    );
  }
}

// DELETE /api/conversations/[id]
export async function DELETE(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
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

    // Get the conversation
    const conversation = await db.conversation.findUnique({
      where: {
        id: params.id,
        userId: user.id,
      },
    });

    if (!conversation) {
      return NextResponse.json(
        { error: "Conversation not found" },
        { status: 404 }
      );
    }

    // Delete the conversation
    await db.conversation.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting conversation:", error);
    return NextResponse.json(
      { error: "Failed to delete conversation" },
      { status: 500 }
    );
  }
} 