"use client";

import { useEffect, useRef, useState } from "react";
import { Bot, Phone, PhoneOff, RefreshCw, Sparkles } from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";

// Import our custom hooks
import { useAIAssistant } from "@/hooks/useAIAssistant";
import { useTextToSpeech } from "@/hooks/useTextToSpeech";

// Import our custom components
import MessageDisplay from "@/components/dashboard/ai-assistant/MessageDisplay";
import ChatInput from "@/components/dashboard/ai-assistant/ChatInput";
import SuggestedPrompts from "@/components/dashboard/ai-assistant/SuggestedPrompts";
import VoiceCallModal from "@/components/dashboard/ai-assistant/VoiceCallModal";

const AiAssistant = () => {
  // Initialize the AI Assistant hook
  const {
    messages,
    isProcessing,
    sendMessage,
    clearConversation,
    generateProactiveSuggestion,
    sessionContext,
    recentConversations,
    loadConversation,
    isInitialized,
    retryLastMessage,
  } = useAIAssistant();

  // Initialize text-to-speech functionality
  const { speak, stop, isSpeaking } = useTextToSpeech();

  // Refs for managing the scroll area
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // State for proactive suggestions
  const [proactiveSuggestion, setProactiveSuggestion] = useState<string | null>(null);
  
  // Track which message is currently speaking
  const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(null);

  // State for voice call modal
  const [isVoiceCallActive, setIsVoiceCallActive] = useState(false);

  // Handle playing audio for a message
  const handlePlayAudio = (messageId: string, text: string) => {
    // If already speaking the same message, stop it
    if (isSpeaking && speakingMessageId === messageId) {
      stop();
      setSpeakingMessageId(null);
      return;
    }
    
    // Stop any current speech
    if (isSpeaking) {
      stop();
    }
    
    // Play the new message
    speak(text);
    setSpeakingMessageId(messageId);
  };

  // Stop speaking when unmounting
  useEffect(() => {
    return () => {
      if (isSpeaking) {
        stop();
      }
    };
  }, [isSpeaking, stop]);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector(
        "[data-radix-scroll-area-viewport]"
      );
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [messages]);

  // Periodically generate proactive suggestions
  useEffect(() => {
    // Only generate suggestions when not processing a message
    if (isProcessing) return;
    
    const suggestionTimer = setTimeout(async () => {
      // Don't generate suggestions too frequently
      if (!proactiveSuggestion && messages.length > 1) {
        const suggestion = await generateProactiveSuggestion();
        if (suggestion) {
          setProactiveSuggestion(suggestion);
        }
      }
    }, 30000);
    
    return () => {
      clearTimeout(suggestionTimer);
    };
  }, [messages, isProcessing, generateProactiveSuggestion, proactiveSuggestion]);

  const handleSelectPrompt = (prompt: string) => {
    // If it's a proactive suggestion, clear it once used
    if (proactiveSuggestion === prompt) {
      setProactiveSuggestion(null);
    }
    
    sendMessage(prompt);
  };

  const handleClearConversation = () => {
    // Stop any speech
    if (isSpeaking) {
      stop();
      setSpeakingMessageId(null);
    }
    
    clearConversation();
    setProactiveSuggestion(null);
  };

  const handleLoadConversation = (conversationId: string) => {
    // Stop any speech
    if (isSpeaking) {
      stop();
      setSpeakingMessageId(null);
    }
    
    loadConversation(conversationId);
  };

  const handleRetryMessage = () => {
    // Stop any speech
    if (isSpeaking) {
      stop();
      setSpeakingMessageId(null);
    }
    
    retryLastMessage();
  };

  const toggleVoiceCall = () => {
    if (isVoiceCallActive) {
      // Stop voice call
      setIsVoiceCallActive(false);
    } else {
      // Start voice call
      setIsVoiceCallActive(true);
    }
  };

  // Format recent conversations for the SuggestedPrompts component
  const formattedRecentConversations = recentConversations.map(
    conversation => ({
      id: conversation.id,
      title: conversation.title
    })
  );

  return (
    <DashboardLayout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">AI Assistant</h1>
          <p className="text-muted-foreground">
            Chat with Bilix, your AI financial assistant to manage invoices and get
            insights
          </p>
        </div>
        <div>
          <Button 
            variant={isVoiceCallActive ? "destructive" : "outline"} 
            size="sm"
            onClick={toggleVoiceCall}
            className="flex items-center gap-2"
          >
            {isVoiceCallActive ? (
              <>
                <PhoneOff className="h-4 w-4" />
                End Call
              </>
            ) : (
              <>
                <Phone className="h-4 w-4" />
                Voice Call
              </>
            )}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3">
          <Card className="h-[calc(100vh-12rem)]">
            <CardHeader className="border-b px-4 py-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center">
                  <Bot className="h-5 w-5 mr-2 text-primary" />
                  Bilix AI Financial Assistant
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Badge className="ai-tag">
                    <Sparkles className="h-3 w-3 mr-1" />
                    AI-Powered
                  </Badge>
                  <Button variant="outline" size="sm" onClick={handleClearConversation}>
                    <RefreshCw className="h-4 w-4 mr-1" /> New Chat
                  </Button>
                </div>
              </div>
            </CardHeader>
            <div className="flex flex-col h-[calc(100%-4rem)]">
              <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
                <div className="space-y-4">
                  {!isInitialized && (
                    <div className="flex justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    </div>
                  )}
                  
                  {isInitialized && messages.map((message) => (
                    <MessageDisplay
                      key={message.id}
                      role={message.role as "user" | "assistant"}
                      content={message.content}
                      timestamp={message.timestamp}
                      relatedData={
                        message.relatedData 
                          ? (Array.isArray(message.relatedData) 
                              ? { invoices: message.relatedData } 
                              : message.relatedData as Record<string, unknown>)
                          : undefined
                      }
                      onPlayAudio={
                        message.role === "assistant"
                          ? (text) => handlePlayAudio(message.id, text)
                          : undefined
                      }
                      onStopAudio={stop}
                      onRetry={
                        message.role === "user" && messages[messages.length - 1] !== message
                          ? handleRetryMessage
                          : undefined
                      }
                      isPlaying={speakingMessageId === message.id && isSpeaking}
                    />
                  ))}
                  
                  {isProcessing && (
                    <div className="flex justify-start">
                      <div className="flex gap-3 max-w-[80%]">
                        <div className="h-8 w-8 rounded-full flex-shrink-0 flex items-center justify-center bg-primary text-primary-foreground">
                          <Bot className="h-4 w-4" />
                        </div>
                        <div className="rounded-lg p-3 text-sm bg-muted">
                          <div className="flex items-center space-x-2">
                            <div className="h-2 w-2 rounded-full bg-slate-400 animate-pulse"></div>
                            <div className="h-2 w-2 rounded-full bg-slate-400 animate-pulse delay-150"></div>
                            <div className="h-2 w-2 rounded-full bg-slate-400 animate-pulse delay-300"></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </ScrollArea>
              
              <ChatInput
                onSendMessage={sendMessage}
                isProcessing={isProcessing || !isInitialized}
              />
            </div>
          </Card>
        </div>
        <div className="hidden lg:block">
          <SuggestedPrompts
            onSelectPrompt={handleSelectPrompt}
            onNewConversation={handleClearConversation}
            recentTopics={sessionContext.recentTopics}
            proactiveSuggestion={proactiveSuggestion}
            languageCode={sessionContext.languageDetected}
            recentConversations={formattedRecentConversations}
            onSelectConversation={handleLoadConversation}
          />
        </div>
      </div>

      {/* Voice Call Modal */}
      {isVoiceCallActive && (
        <VoiceCallModal
          onClose={() => setIsVoiceCallActive(false)}
          onSendMessage={sendMessage}
          isProcessing={isProcessing}
          lastAssistantMessage={messages.findLast(m => m.role === 'assistant')?.content || ''}
        />
      )}
    </DashboardLayout>
  );
};

export default AiAssistant;
