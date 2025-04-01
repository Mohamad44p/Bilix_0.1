import { Invoice } from "@prisma/client";
import { toast } from "sonner";

export interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface AIResponse {
  message: ChatMessage;
  relatedData?: Record<string, unknown>;
}

interface TranscriptionResponse {
  text: string;
}

// Function to handle text-based chat interactions with OpenAI
export async function getChatCompletion(
  messages: ChatMessage[],
  systemMessage?: string
): Promise<AIResponse> {
  try {
    // Add system message if provided
    const allMessages = systemMessage
      ? [{ role: "system", content: systemMessage }, ...messages]
      : messages;

    const response = await fetch("/api/ai/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ messages: allMessages }),
    });

    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error in AI chat completion:", error);
    toast.error("Failed to get AI response. Please try again.");
    throw error;
  }
}

// Function to transcribe audio to text using OpenAI
export async function transcribeAudio(
  audioBlob: Blob
): Promise<TranscriptionResponse> {
  try {
    const formData = new FormData();
    formData.append("file", audioBlob, "recording.webm");
    formData.append("model", "whisper-1");

    const response = await fetch("/api/ai/transcribe", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error transcribing audio:", error);
    toast.error("Failed to transcribe audio. Please try again.");
    throw error;
  }
}

// Function to generate text-to-speech audio using OpenAI
export async function generateSpeech(text: string): Promise<Blob> {
  try {
    const response = await fetch("/api/ai/speech", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ text }),
    });

    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }

    const audioBlob = await response.blob();
    return audioBlob;
  } catch (error) {
    console.error("Error generating speech:", error);
    toast.error("Failed to generate speech. Please try again.");
    throw error;
  }
}

// Function to get invoice data (this would connect to your actual database)
export async function getInvoiceData(query: string): Promise<Invoice[]> {
  try {
    const response = await fetch("/api/invoices/query", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query }),
    });

    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching invoice data:", error);
    toast.error("Failed to fetch invoice data. Please try again.");
    throw error;
  }
} 