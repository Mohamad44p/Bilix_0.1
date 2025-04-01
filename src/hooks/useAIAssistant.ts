import { useState, useCallback, useEffect } from "react";
import { toast } from "sonner";
import { getChatCompletion, getInvoiceData, ChatMessage } from "@/lib/services/ai-service";
import { getUserProfile } from "@/lib/services/user-service";
import { Invoice } from "@prisma/client";
import {
  getConversations,
  getConversation,
  createConversation,
  addMessageToConversation,
} from "@/lib/services/conversation-service";

// Define interfaces that match what comes from the service
type ConversationRole = "user" | "assistant" | "system";

interface Message extends ChatMessage {
  id: string;
  timestamp: Date;
  relatedData?: Record<string, unknown> | Invoice[];
}

interface Conversation {
  id: string;
  title: string;
  messages: {
    id?: string;
    role: string;
    content: string;
    timestamp?: Date;
    relatedData?: Record<string, unknown>;
  }[];
  createdAt: string;
  updatedAt: string;
}

interface SessionContext {
  preferences: {
    language?: string;
    currency?: string;
    dateFormat?: string;
  };
  recentTopics: string[];
  languageDetected: string;
  userData: Record<string, unknown> | null;
  lastQueryTime: string;
  lastQuery?: string;
}

interface UseAIAssistantProps {
  initialMessages?: Message[];
  systemPrompt?: string;
  userPreferences?: {
    language?: string;
    currency?: string;
    dateFormat?: string;
  };
}

// Default system prompt with Bilix branding and purpose
const DEFAULT_SYSTEM_PROMPT = `You are Bilix AI Assistant, a specialized financial assistant focused on helping users manage their invoices and financial data.
Your primary purpose is to assist with invoice management, financial analysis, and providing insights based on the user's financial data.
Be concise, accurate, helpful, and conversational. Remember that you have access to the user's financial data, so give specific and personalized responses.
Always address yourself as "Bilix" when introducing yourself.
You should prioritize financial insights and practical advice related to the user's invoice data.`;

export function useAIAssistant({
  initialMessages = [],
  systemPrompt = DEFAULT_SYSTEM_PROMPT,
  userPreferences = {},
}: UseAIAssistantProps = {}) {
  const [messages, setMessages] = useState<Message[]>(
    initialMessages.length > 0
      ? initialMessages
      : [
          {
            id: "welcome",
            role: "assistant",
            content:
              "Hello! I'm Bilix, your AI financial assistant. I can help you manage invoices, analyze expenses, generate reports, and provide financial insights based on your data. What would you like to know about your finances today?",
            timestamp: new Date(),
          },
        ]
  );
  const [isProcessing, setIsProcessing] = useState(false);
  const [recentConversations, setRecentConversations] = useState<Conversation[]>([]);
  const [sessionContext, setSessionContext] = useState<SessionContext>({
    preferences: userPreferences,
    recentTopics: [],
    languageDetected: "en",
    userData: null,
    lastQueryTime: new Date().toISOString(),
  });
  const [isInitialized, setIsInitialized] = useState(false);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);

  // Load user data and conversation history on initialization
  useEffect(() => {
    const initialize = async () => {
      try {
        // Load user data
        const userData = await getUserProfile();
        if (userData) {
          setSessionContext(prev => ({
            ...prev,
            userData: userData as unknown as Record<string, unknown>,
          }));
        }
        
        // Load recent conversations
        const conversations = await getConversations();
        setRecentConversations(conversations as unknown as Conversation[]);
        
        setIsInitialized(true);
      } catch (error) {
        console.error("Error initializing AI Assistant:", error);
        setIsInitialized(true); // Still mark as initialized to enable interaction
      }
    };

    initialize();
  }, []);

  // Function to send a message to the AI
  const sendMessage = useCallback(
    async (content: string, relatedData?: Record<string, unknown>) => {
      if (!content.trim()) return;

      // Create user message
      const userMessage: Message = {
        id: Date.now().toString(),
        role: "user",
        content,
        timestamp: new Date(),
        relatedData,
      };

      // Add to messages
      setMessages((prev) => [...prev, userMessage]);
      setIsProcessing(true);

      try {
        // Prepare the conversation context
        const enhancedSystemPrompt = `${systemPrompt}

User profile information: ${
          sessionContext.userData 
            ? JSON.stringify({
                name: sessionContext.userData.firstName + " " + sessionContext.userData.lastName,
                email: sessionContext.userData.email,
                role: sessionContext.userData.role,
                organization: sessionContext.userData.organization && 
                  typeof sessionContext.userData.organization === 'object' ? 
                  (sessionContext.userData.organization as {name: string}).name : "None",
              }) 
            : "Not available"
        }

User preferences: ${JSON.stringify(sessionContext.preferences)}
Current conversation context: ${JSON.stringify({
  recentTopics: sessionContext.recentTopics,
  languageDetected: sessionContext.languageDetected,
  lastQueryTime: sessionContext.lastQueryTime,
})}`;

        // Get context-aware message history (last 10 messages)
        const chatHistory = messages
          .slice(-10)
          .map(({ role, content }) => ({ role, content }));

        // Get AI response
        const aiResponse = await getChatCompletion(
          [...chatHistory, { role: "user", content }],
          enhancedSystemPrompt
        );

        // Try to get relevant data if we detect specific queries
        let responseData = undefined;
        if (
          content.toLowerCase().includes("invoice") ||
          content.toLowerCase().includes("report") ||
          content.toLowerCase().includes("vendor") ||
          content.toLowerCase().includes("expense") ||
          content.toLowerCase().includes("payment") ||
          content.toLowerCase().includes("financial") ||
          content.toLowerCase().includes("money") ||
          content.toLowerCase().includes("spent") ||
          content.toLowerCase().includes("paid")
        ) {
          try {
            responseData = await getInvoiceData(content);
          } catch (error) {
            console.error("Error fetching related data:", error);
          }
        }

        // Create assistant message
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: aiResponse.message.content,
          timestamp: new Date(),
          relatedData: responseData || aiResponse.relatedData,
        };

        // Add to messages
        setMessages((prev) => [...prev, assistantMessage]);

        // Update session context with information about this exchange
        updateSessionContext(content);

        // Save to database if there's an active conversation
        if (currentConversationId) {
          await addMessageToConversation(currentConversationId, {
            role: userMessage.role,
            content: userMessage.content,
            timestamp: userMessage.timestamp,
            relatedData: Array.isArray(userMessage.relatedData) ? 
              { invoices: userMessage.relatedData } : userMessage.relatedData
          });
          
          await addMessageToConversation(currentConversationId, {
            role: assistantMessage.role,
            content: assistantMessage.content,
            timestamp: assistantMessage.timestamp,
            relatedData: Array.isArray(assistantMessage.relatedData) ? 
              { invoices: assistantMessage.relatedData } : assistantMessage.relatedData
          });
        } else if (messages.length > 1) {
          // Create a new conversation if this is beyond the welcome message
          const title = await generateConversationTitle();
          const newConversation = await createConversation(title, [
            ...messages, 
            userMessage, 
            assistantMessage
          ].map(msg => ({
            role: msg.role,
            content: msg.content,
            timestamp: msg.timestamp,
            relatedData: Array.isArray(msg.relatedData) ? 
              { invoices: msg.relatedData } : msg.relatedData
          })));
          
          if (newConversation) {
            setCurrentConversationId(newConversation.id);
            
            // Refresh the conversations list
            const conversations = await getConversations();
            setRecentConversations(conversations as unknown as Conversation[]);
          }
        }

        return assistantMessage;
      } catch (error) {
        console.error("Error processing message:", error);
        toast.error(
          "Sorry, I encountered an error. Please try again in a moment."
        );
      } finally {
        setIsProcessing(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [messages, sessionContext, systemPrompt, currentConversationId]
  );

  // Function to update session context
  const updateSessionContext = useCallback(
    (userQuery: string) => {
      // Simple topic extraction (in a real app, this would be more sophisticated)
      const topics = extractTopics(userQuery);
      
      // Update recent topics
      setSessionContext((prev) => ({
        ...prev,
        recentTopics: [...new Set([...topics, ...prev.recentTopics])].slice(0, 5),
        lastQuery: userQuery,
        lastQueryTime: new Date().toISOString(),
      }));

      // Detect language (simplified)
      if (userQuery.length > 10) {
        const detectedLanguage = detectLanguage(userQuery);
        if (detectedLanguage !== sessionContext.languageDetected) {
          setSessionContext((prev) => ({
            ...prev,
            languageDetected: detectedLanguage,
          }));
        }
      }
    },
    [sessionContext]
  );

  // Simple language detection (would use a real library in production)
  const detectLanguage = (text: string): string => {
    // This is a very simplified implementation
    const spanish = /[áéíóúüñ¿¡]/i;
    const french = /[àâæçéèêëîïôœùûüÿ]/i;
    const german = /[äöüß]/i;
    const arabic = /[\u0600-\u06FF]/;
    const chinese = /[\u4e00-\u9fff]/;

    if (arabic.test(text)) return "ar";
    if (chinese.test(text)) return "zh";
    if (spanish.test(text)) return "es";
    if (french.test(text)) return "fr";
    if (german.test(text)) return "de";
    return "en"; // Default to English
  };

  // Simple topic extraction
  const extractTopics = (text: string): string[] => {
    const topics = [];
    const lowerText = text.toLowerCase();
    
    if (lowerText.includes("invoice")) topics.push("invoices");
    if (lowerText.includes("report")) topics.push("reports");
    if (lowerText.includes("expense")) topics.push("expenses");
    if (lowerText.includes("vendor")) topics.push("vendors");
    if (lowerText.includes("payment")) topics.push("payments");
    if (lowerText.includes("due")) topics.push("due dates");
    if (lowerText.includes("tax")) topics.push("taxes");
    if (lowerText.includes("budget")) topics.push("budgeting");
    
    return topics;
  };

  // Function to load a conversation
  const loadConversation = useCallback(async (conversationId: string) => {
    try {
      const conversation = await getConversation(conversationId);
      
      if (conversation) {
        // Format the messages
        const formattedMessages = conversation.messages.map(msg => ({
          id: msg.id || Date.now().toString(),
          role: msg.role as ConversationRole,
          content: msg.content,
          timestamp: new Date(msg.timestamp || Date.now()),
          relatedData: msg.relatedData
        }));
        
        setMessages(formattedMessages as unknown as Message[]);
        setCurrentConversationId(conversation.id);
        return true;
      }
      return false;
    } catch (error) {
      console.error("Error loading conversation:", error);
      toast.error("Failed to load conversation");
      return false;
    }
  }, []);

  // Generate a title for the current conversation
  const generateConversationTitle = useCallback(async () => {
    if (messages.length < 3) return "New Conversation";
    
    const userMessages = messages
      .filter(m => m.role === "user")
      .map(m => m.content)
      .join(" ");
    
    try {
      const response = await getChatCompletion(
        [{ role: "user", content: `Generate a short title (3-5 words) for a conversation about: ${userMessages}` }],
        "You are generating a short title for a conversation. Keep it concise and relevant. Only return the title, no quotes or extra text."
      );
      
      return response.message.content || "New Conversation";
    } catch (error) {
      console.error("Error generating conversation title:", error);
      return "New Conversation";
    }
  }, [messages]);

  // Function to clear conversation
  const clearConversation = useCallback(async () => {
    // Reset to welcome message
    setMessages([
      {
        id: "welcome",
        role: "assistant",
        content:
          "Hello! I'm Bilix, your AI financial assistant. I can help you manage invoices, analyze expenses, generate reports, and provide financial insights based on your data. What would you like to know about your finances today?",
        timestamp: new Date(),
      },
    ]);
    
    // Clear current conversation ID
    setCurrentConversationId(null);
    
    toast.info("Started a new conversation");
  }, []);

  // Function to generate a proactive suggestion
  const generateProactiveSuggestion = useCallback(async () => {
    // Don't generate suggestions while user is in the middle of a conversation
    if (isProcessing || messages.length < 2) return null;
    
    // Construct a prompt for generating a suggestion
    const suggestionPrompt = `Based on the user's conversation history and financial data, generate a helpful proactive suggestion. 
    Recent topics: ${sessionContext.recentTopics.join(", ")}
    Last query: ${sessionContext.lastQuery || "None"}
    
    Some examples of good suggestions:
    - You have 3 invoices due this week. Would you like to review them?
    - I noticed some unusual spending patterns in your recent invoices. Would you like me to analyze them?
    - Based on your current cash flow, you might want to delay some payments. Would you like recommendations?
    
    Make the suggestion specific, helpful, and finance-related.`;
    
    try {
      const suggestionResponse = await getChatCompletion(
        [{ role: "user", content: suggestionPrompt }],
        "You are Bilix AI Assistant making a single, brief proactive suggestion related to the user's finances and invoices. Be specific and helpful."
      );
      
      return suggestionResponse.message.content;
    } catch (error) {
      console.error("Error generating suggestion:", error);
      return null;
    }
  }, [isProcessing, messages.length, sessionContext]);

  // Function to retry last user message
  const retryLastMessage = useCallback(async () => {
    // Find the last user message
    const lastUserMessageIndex = [...messages].reverse().findIndex(m => m.role === "user");
    
    if (lastUserMessageIndex === -1) {
      toast.error("No previous message to retry");
      return;
    }
    
    const lastUserMessage = [...messages].reverse()[lastUserMessageIndex];
    
    // Remove the last assistant message if it exists
    if (lastUserMessageIndex === 0) {
      // The last message was from the user, so just retry it
      setMessages(messages.slice(0, -1));
    } else {
      // Remove the assistant's response to the last user message
      setMessages(messages.slice(0, -2));
    }
    
    // Retry sending the message
    await sendMessage(
      lastUserMessage.content, 
      Array.isArray(lastUserMessage.relatedData) ? 
        { invoices: lastUserMessage.relatedData } : 
        lastUserMessage.relatedData
    );
  }, [messages, sendMessage]);

  return {
    messages,
    isProcessing,
    sendMessage,
    clearConversation,
    generateProactiveSuggestion,
    sessionContext,
    recentConversations,
    loadConversation,
    isInitialized,
    currentConversationId,
    retryLastMessage
  };
} 