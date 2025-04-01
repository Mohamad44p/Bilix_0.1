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

    // Get form data with audio file
    const formData = await request.formData();
    const audioFile = formData.get("file") as File;
    
    if (!audioFile) {
      return NextResponse.json(
        { error: "No audio file provided" },
        { status: 400 }
      );
    }

    // Convert File to Buffer for OpenAI API
    const arrayBuffer = await audioFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Call OpenAI Whisper API for transcription
    const response = await openai.audio.transcriptions.create({
      file: new File([buffer], audioFile.name, { type: audioFile.type }),
      model: "whisper-1",
      language: "en", // Can be made dynamic based on user preferences
    });

    return NextResponse.json({
      text: response.text,
    });
  } catch (error: unknown) {
    console.error("Error transcribing audio:", error);
    
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error transcribing audio" },
      { status: 500 }
    );
  }
}

// Configure for larger file size limit (for audio files)
export const config = {
  api: {
    bodyParser: false,
  },
}; 