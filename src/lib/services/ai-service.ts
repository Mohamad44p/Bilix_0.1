import { Invoice } from "@prisma/client";
import { toast } from "sonner";
import { AISettings } from "@/lib/types";

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

// Helper for getting base URL
function getBaseUrl() {
  return typeof window !== 'undefined' ? window.location.origin : '';
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

    const response = await fetch(`${getBaseUrl()}/api/ai/chat`, {
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

    const response = await fetch(`${getBaseUrl()}/api/ai/transcribe`, {
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
    const response = await fetch(`${getBaseUrl()}/api/ai/speech`, {
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
    const response = await fetch(`${getBaseUrl()}/api/invoices/query`, {
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

// Function to save AI settings to database
export async function saveAISettings(settings: AISettings): Promise<boolean> {
  try {
    console.log("Saving AI settings:", settings);

    const response = await fetch(`${getBaseUrl()}/api/user/ai-settings`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(settings),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Server error:", errorData);
      throw new Error(`Error: ${response.status} - ${errorData.error || 'Unknown error'}`);
    }

    await response.json();
    console.log("AI settings saved successfully");
    return true;
  } catch (error) {
    console.error("Error saving AI settings:", error);
    // Don't show toast here since it will be handled by the caller
    return false;
  }
}

// Function to load the user's AI settings
export async function loadAISettings(): Promise<AISettings | null> {
  try {
    const baseUrl = getBaseUrl();
    const response = await fetch(`${baseUrl}/api/user/ai-settings`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      console.error("Error fetching AI settings:", response.status);
      return null;
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error loading AI settings:", error);
    return null;
  }
}

// Function to upload a sample invoice
export async function uploadSampleInvoice(file: File): Promise<string | null> {
  try {
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch(`${getBaseUrl()}/api/uploads/sample-invoice`, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }

    const data = await response.json();
    return data.fileUrl;
  } catch (error) {
    console.error("Error uploading sample invoice:", error);
    toast.error("Failed to upload sample invoice.");
    return null;
  }
}

// Function to delete a sample invoice
export async function deleteSampleInvoice(fileUrl: string): Promise<boolean> {
  try {
    const response = await fetch(`${getBaseUrl()}/api/uploads/sample-invoice?fileUrl=${encodeURIComponent(fileUrl)}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }

    await response.json();
    return true;
  } catch (error) {
    console.error("Error deleting sample invoice:", error);
    toast.error("Failed to delete sample invoice.");
    return false;
  }
} 