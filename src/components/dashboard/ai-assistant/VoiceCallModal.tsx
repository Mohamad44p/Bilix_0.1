import { useState, useEffect, useRef, useCallback } from "react";
import { Phone, MicOff, Bot, Loader2, Volume2, VolumeX, PhoneOff } from "lucide-react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useVoiceRecording } from "@/hooks/useVoiceRecording";
import { useTextToSpeech } from "@/hooks/useTextToSpeech";

interface VoiceCallModalProps {
  onClose: () => void;
  onSendMessage: (text: string) => void;
  isProcessing: boolean;
  lastAssistantMessage: string;
}

export default function VoiceCallModal({
  onClose,
  onSendMessage,
  isProcessing,
  lastAssistantMessage
}: VoiceCallModalProps) {
  // Basic call state
  const [isCallConnected, setIsCallConnected] = useState(false);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [elapsedTime, setElapsedTime] = useState("00:00");
  const [lastSpokenMessage, setLastSpokenMessage] = useState("");
  const [isCallActive, setIsCallActive] = useState(true);
  
  // Conversation control state
  const [conversationState, setConversationState] = useState<"idle" | "assistant-speaking" | "user-speaking" | "processing">("idle");
  const [isUserTurn, setIsUserTurn] = useState(false);
  const [autoRecordEnabled, setAutoRecordEnabled] = useState(true);
  const [previousMessages] = useState(new Set<string>());
  
  // Refs for timers and state tracking
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const turnTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const assistantMessageQueueRef = useRef<string[]>([]);
  
  // Text-to-speech hook with simplified callbacks
  const { speak, stop, isSpeaking } = useTextToSpeech({
    onSpeechStart: () => {
      setConversationState("assistant-speaking");
      setIsUserTurn(false);
    },
    onSpeechEnd: () => {
      if (!isCallActive) return;
      
      setConversationState("idle");
      
      // Process next message in queue if any
      if (assistantMessageQueueRef.current.length > 0) {
        const nextMessage = assistantMessageQueueRef.current.shift();
        if (nextMessage) {
          setTimeout(() => speak(nextMessage), 300);
          return;
        }
      }
      
      // Give user turn after a brief pause
      if (autoRecordEnabled) {
        if (turnTimeoutRef.current) clearTimeout(turnTimeoutRef.current);
        turnTimeoutRef.current = setTimeout(() => {
          if (!isProcessing && !isSpeaking && isCallActive) {
            setIsUserTurn(true);
          }
        }, 1200);
      }
    }
  });

  // Handle user messages
  const handleUserMessage = useCallback((text: string) => {
    if (!isCallActive || !text.trim()) return;
    
    // Stop any current speech
    if (isSpeaking) stop();
    
    // Clear message queue
    assistantMessageQueueRef.current = [];
    
    // Send message to parent
    setConversationState("processing");
    setIsUserTurn(false);
    onSendMessage(text);
  }, [isCallActive, isSpeaking, stop, onSendMessage]);

  // Voice recording hook
  const {
    isRecording,
    isProcessing: isProcessingVoice,
    startRecording,
    stopRecording,
  } = useVoiceRecording({
    onTranscription: handleUserMessage,
    onRecordingStart: () => {
      setConversationState("user-speaking");
      if (isSpeaking) stop();
    },
    onRecordingStop: () => {
      if (conversationState === "user-speaking") {
        setConversationState(isProcessing ? "processing" : "idle");
      }
    },
    showNotifications: false
  });

  // Auto-start recording when it's user's turn
  useEffect(() => {
    if (isUserTurn && !isRecording && !isSpeaking && isCallConnected && autoRecordEnabled && isCallActive && !isProcessing) {
      const timer = setTimeout(() => {
        if (isCallActive && !isProcessing && !isSpeaking && !isRecording) {
          startRecording();
        }
      }, 800);
      
      return () => clearTimeout(timer);
    }
  }, [isUserTurn, isRecording, isSpeaking, isCallConnected, autoRecordEnabled, isCallActive, isProcessing, startRecording]);

  // Clean up timeouts on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (turnTimeoutRef.current) clearTimeout(turnTimeoutRef.current);
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
      stop();
      setIsCallActive(false);
    };
  }, [stop]);

  // Start call when modal opens
  useEffect(() => {
    const connectTimeout = setTimeout(() => {
      setIsCallConnected(true);
      setStartTime(new Date());
      
      // Greeting with slight delay
      setTimeout(() => {
        const greeting = "Hello, this is Bilix, your financial assistant. How can I help you today?";
        speak(greeting);
        setLastSpokenMessage(greeting);
        previousMessages.add(greeting);
      }, 800);
    }, 1000);
    
    return () => {
      clearTimeout(connectTimeout);
    };
  }, [speak, previousMessages]);

  // Handle timer for call duration
  useEffect(() => {
    if (isCallConnected && startTime) {
      timerRef.current = setInterval(() => {
        const now = new Date();
        const diff = Math.floor((now.getTime() - startTime.getTime()) / 1000);
        const minutes = Math.floor(diff / 60).toString().padStart(2, '0');
        const seconds = (diff % 60).toString().padStart(2, '0');
        setElapsedTime(`${minutes}:${seconds}`);
      }, 1000);
    }
    
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isCallConnected, startTime]);

  // Process new assistant messages
  useEffect(() => {
    if (!isCallConnected || !isCallActive || !lastAssistantMessage || !lastAssistantMessage.trim()) return;
    
    // Skip if we already processed this exact message
    if (previousMessages.has(lastAssistantMessage)) return;
    previousMessages.add(lastAssistantMessage);
    
    // If speaking or recording, queue the message
    if (isSpeaking || isRecording || isProcessingVoice) {
      assistantMessageQueueRef.current.push(lastAssistantMessage);
      return;
    }
    
    // Otherwise speak it directly
    speak(lastAssistantMessage);
    setLastSpokenMessage(lastAssistantMessage);
  }, [lastAssistantMessage, isCallConnected, isCallActive, isSpeaking, isRecording, isProcessingVoice, speak, previousMessages]);

  // Handle processing state changes
  useEffect(() => {
    if (!isCallActive) return;
    
    if (isProcessing) {
      setConversationState("processing");
      setIsUserTurn(false);
    } else if (conversationState === "processing") {
      // Short delay before changing state from processing
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = setTimeout(() => {
        if (!isSpeaking && !isRecording) {
          setConversationState("idle");
        }
      }, 500);
    }
  }, [isProcessing, conversationState, isSpeaking, isRecording, isCallActive]);

  const handleEndCall = () => {
    // Clean up
    if (isSpeaking) stop();
    if (isRecording) stopRecording();
    
    setIsCallActive(false);
    onClose();
  };

  const toggleAutoRecord = () => {
    setAutoRecordEnabled(!autoRecordEnabled);
  };

  return (
    <Dialog open={true} onOpenChange={handleEndCall}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5 text-primary" />
            Voice Call with Bilix
            <div className="ml-auto px-2 py-1 bg-muted rounded-md text-xs font-mono">
              {elapsedTime}
            </div>
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex flex-col items-center justify-center space-y-6 py-6">
          {!isCallConnected ? (
            <div className="flex flex-col items-center gap-3">
              <div className="p-8 rounded-full bg-muted animate-pulse">
                <Phone className="h-8 w-8 text-primary" />
              </div>
              <p className="text-center text-sm text-muted-foreground">Connecting to Bilix...</p>
            </div>
          ) : (
            <>
              <div className={`p-12 rounded-full ${getStatusColorClass(conversationState)}`}>
                <div className="relative">
                  <Bot className="h-12 w-12 text-background" />
                  {getStatusIndicator(conversationState, isProcessing, isSpeaking, isRecording)}
                </div>
              </div>
              
              <div className="w-full max-w-xs">
                <div className="text-center mb-4 text-sm">
                  {getStatusMessage(conversationState, isProcessing, isSpeaking, isRecording)}
                </div>
                
                <div className="text-center p-3 bg-muted rounded-lg mb-2 min-h-16 max-h-32 overflow-y-auto">
                  {lastSpokenMessage || "Waiting to begin conversation..."}
                </div>
              </div>
              
              <div className="flex gap-4">
                <Button 
                  onClick={toggleAutoRecord} 
                  variant={autoRecordEnabled ? "default" : "outline"}
                  size="sm"
                  className="flex items-center gap-2"
                >
                  {autoRecordEnabled ? (
                    <>
                      <Volume2 className="h-4 w-4" />
                      Auto-Listen
                    </>
                  ) : (
                    <>
                      <VolumeX className="h-4 w-4" />
                      Manual Mode
                    </>
                  )}
                </Button>
                
                {!autoRecordEnabled && (
                  <Button
                    onClick={isRecording ? stopRecording : startRecording}
                    variant={isRecording ? "destructive" : "default"}
                    size="sm"
                    className="flex items-center gap-2"
                    disabled={isSpeaking || isProcessing}
                  >
                    {isRecording ? (
                      <>
                        <MicOff className="h-4 w-4" />
                        Stop
                      </>
                    ) : (
                      <>
                        <Phone className="h-4 w-4" />
                        Speak
                      </>
                    )}
                  </Button>
                )}
              </div>
            </>
          )}
        </div>
        
        <DialogFooter>
          <Button 
            onClick={handleEndCall} 
            variant="destructive"
            className="flex items-center gap-2"
          >
            <PhoneOff className="h-4 w-4" />
            End Call
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Helper functions for UI
function getStatusColorClass(state: string): string {
  switch (state) {
    case "assistant-speaking":
      return "bg-primary animate-pulse";
    case "user-speaking":
      return "bg-green-500";
    case "processing":
      return "bg-amber-500";
    default:
      return "bg-slate-400";
  }
}

function getStatusIndicator(state: string, isProcessing: boolean, isSpeaking: boolean, isRecording: boolean) {
  if (isProcessing) {
    return (
      <div className="absolute -bottom-1 -right-1 bg-amber-500 rounded-full p-1">
        <Loader2 className="h-4 w-4 text-background animate-spin" />
      </div>
    );
  }
  
  if (isSpeaking) {
    return (
      <div className="absolute -bottom-1 -right-1 bg-primary rounded-full p-1">
        <Volume2 className="h-4 w-4 text-background" />
      </div>
    );
  }
  
  if (isRecording) {
    return (
      <div className="absolute -bottom-1 -right-1 bg-green-500 rounded-full p-1">
        <Phone className="h-4 w-4 text-background" />
      </div>
    );
  }
  
  return null;
}

function getStatusMessage(state: string, isProcessing: boolean, isSpeaking: boolean, isRecording: boolean): string {
  if (isProcessing) return "Processing your request...";
  if (isSpeaking) return "Bilix is speaking...";
  if (isRecording) return "Listening to you...";
  return "Waiting for your input...";
} 