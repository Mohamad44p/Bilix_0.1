import { toast } from "sonner";

interface ConversationMessage {
  id?: string;
  role: string;
  content: string;
  timestamp?: Date;
  relatedData?: Record<string, unknown>;
}

interface Conversation {
  id: string;
  title: string;
  messages: ConversationMessage[];
  createdAt: string;
  updatedAt: string;
}

/**
 * Fetch all conversations for the current user
 */
export async function getConversations(): Promise<Conversation[]> {
  try {
    const response = await fetch("/api/conversations");
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to fetch conversations");
    }
    
    return await response.json();
  } catch (error) {
    console.error("Error fetching conversations:", error);
    toast.error("Failed to load conversation history");
    return [];
  }
}

/**
 * Fetch a specific conversation by ID
 */
export async function getConversation(id: string): Promise<Conversation | null> {
  try {
    const response = await fetch(`/api/conversations/${id}`);
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to fetch conversation");
    }
    
    return await response.json();
  } catch (error) {
    console.error("Error fetching conversation:", error);
    toast.error("Failed to load conversation");
    return null;
  }
}

/**
 * Create a new conversation
 */
export async function createConversation(
  title: string,
  messages: ConversationMessage[]
): Promise<Conversation | null> {
  try {
    const response = await fetch("/api/conversations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        title,
        messages,
      }),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to create conversation");
    }
    
    return await response.json();
  } catch (error) {
    console.error("Error creating conversation:", error);
    toast.error("Failed to save conversation");
    return null;
  }
}

/**
 * Add a message to an existing conversation
 */
export async function addMessageToConversation(
  conversationId: string,
  message: ConversationMessage
): Promise<Conversation | null> {
  try {
    const response = await fetch(`/api/conversations/${conversationId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message,
      }),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to add message");
    }
    
    return await response.json();
  } catch (error) {
    console.error("Error adding message:", error);
    toast.error("Failed to save message");
    return null;
  }
}

/**
 * Update a conversation title
 */
export async function updateConversationTitle(
  conversationId: string,
  title: string
): Promise<Conversation | null> {
  try {
    const response = await fetch(`/api/conversations/${conversationId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        title,
      }),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to update conversation");
    }
    
    return await response.json();
  } catch (error) {
    console.error("Error updating conversation:", error);
    toast.error("Failed to update conversation");
    return null;
  }
}

/**
 * Delete a conversation
 */
export async function deleteConversation(conversationId: string): Promise<boolean> {
  try {
    const response = await fetch(`/api/conversations/${conversationId}`, {
      method: "DELETE",
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to delete conversation");
    }
    
    return true;
  } catch (error) {
    console.error("Error deleting conversation:", error);
    toast.error("Failed to delete conversation");
    return false;
  }
} 