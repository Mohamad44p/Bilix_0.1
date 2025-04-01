import { NextResponse } from "next/server";
import OpenAI from "openai";

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "",
});

export async function POST(request: Request) {
  try {
    // Check API key is present
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "OpenAI API key not configured" },
        { status: 500 }
      );
    }

    // Get request body
    const body = await request.json();
    const { messages } = body;

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: "Invalid request: messages array is required" },
        { status: 400 }
      );
    }

    // Call OpenAI API
    const response = await openai.chat.completions.create({
      model: "gpt-4-turbo-preview", // Use the latest model
      messages: messages,
      temperature: 0.7,
      max_tokens: 1000,
    });

    // Get the generated message
    const message = response.choices[0].message;

    // Process any function calls or data extraction that might be in the response
    let relatedData = null;

    // Simple detection of JSON or structured data in the response
    const jsonMatch = message.content?.match(/```json([\s\S]*?)```/);
    if (jsonMatch && jsonMatch[1]) {
      try {
        relatedData = JSON.parse(jsonMatch[1].trim());
      } catch (err) {
        console.error("Error parsing JSON from response:", err);
      }
    }

    return NextResponse.json({
      message: {
        role: "assistant",
        content: message.content,
      },
      relatedData,
    });
  } catch (error: unknown) {
    console.error("Error calling OpenAI API:", error);
    
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error processing your request" },
      { status: 500 }
    );
  }
} 