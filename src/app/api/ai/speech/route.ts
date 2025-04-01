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
    const { text, voice = "alloy" } = body;

    if (!text) {
      return NextResponse.json(
        { error: "Text is required" },
        { status: 400 }
      );
    }

    // Call OpenAI TTS API
    const mp3 = await openai.audio.speech.create({
      model: "tts-1",
      voice: voice, // Available options: alloy, echo, fable, onyx, nova, shimmer
      input: text,
    });

    // Get the speech as an ArrayBuffer
    const buffer = Buffer.from(await mp3.arrayBuffer());

    // Return the audio as a stream
    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "audio/mpeg",
        "Content-Length": buffer.length.toString(),
      },
    });
  } catch (error: unknown) {
    console.error("Error generating speech:", error);
    
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error generating speech" },
      { status: 500 }
    );
  }
} 