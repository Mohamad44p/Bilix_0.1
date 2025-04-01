import { useState, FormEvent, useRef, useEffect } from "react";
import { Send, Mic, MicOff, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useVoiceRecording } from "@/hooks/useVoiceRecording";

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  isProcessing: boolean;
  placeholder?: string;
}

export default function ChatInput({
  onSendMessage,
  isProcessing,
  placeholder = "Ask about your invoices, financial insights, or reports...",
}: ChatInputProps) {
  const [inputValue, setInputValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input on mount
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  // Handle voice recording
  const {
    isRecording,
    isProcessing: isProcessingVoice,
    startRecording,
    stopRecording,
  } = useVoiceRecording({
    onTranscription: (text) => {
      setInputValue(text);
      if (text.trim()) {
        // Auto-send if we have transcription
        onSendMessage(text);
        setInputValue("");
      }
    },
  });

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isProcessing) return;

    onSendMessage(inputValue);
    setInputValue("");
  };

  const toggleRecording = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const isDisabled = isProcessing || isProcessingVoice;

  return (
    <div className="p-4 border-t">
      <form className="flex gap-2" onSubmit={handleSubmit}>
        <Input
          ref={inputRef}
          placeholder={placeholder}
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          className="flex-1"
          disabled={isDisabled || isRecording}
        />
        
        <Button
          type="submit"
          size="icon"
          disabled={isDisabled || !inputValue.trim() || isRecording}
        >
          {isProcessing ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </Button>
        
        <Button
          type="button"
          variant={isRecording ? "destructive" : "outline"}
          size="icon"
          onClick={toggleRecording}
          disabled={isProcessingVoice}
          className={isRecording ? "animate-pulse" : ""}
        >
          {isRecording ? (
            <MicOff className="h-4 w-4" />
          ) : isProcessingVoice ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Mic className="h-4 w-4" />
          )}
        </Button>
      </form>
      
      {isRecording && (
        <div className="text-xs text-center mt-2 text-muted-foreground animate-pulse">
          Listening... Click the microphone again to stop
        </div>
      )}
    </div>
  );
} 