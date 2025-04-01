import { Bot, Copy, RefreshCw, User, Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { toast } from "sonner";

interface MessageDisplayProps {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  relatedData?: Record<string, unknown>;
  onPlayAudio?: (text: string) => void;
  onStopAudio?: () => void;
  onRetry?: () => void;
  isPlaying?: boolean;
}

const formatTimestamp = (date: Date) => {
  return date.toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  });
};

export default function MessageDisplay({
  role,
  content,
  timestamp,
  relatedData,
  onPlayAudio,
  onStopAudio,
  onRetry,
  isPlaying,
}: MessageDisplayProps) {
  const [showData, setShowData] = useState(false);

  // Format the content with markdown-like syntax
  const formatContent = (text: string) => {
    // Bold text (between ** **)
    let formattedText = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    
    // Bullet points
    formattedText = formattedText.replace(/• (.*?)(?:\n|$)/g, '<li>$1</li>');
    formattedText = formattedText.replace(/<li>/g, '<ul class="ml-5 list-disc"><li>');
    formattedText = formattedText.replace(/<\/li>(?!\n<li>)/g, '</li></ul>');
    
    // Handle newlines
    formattedText = formattedText.replace(/\n/g, '<br/>');
    
    return formattedText;
  };

  const handleCopyContent = () => {
    navigator.clipboard.writeText(content)
      .then(() => {
        toast.success("Message copied to clipboard");
      })
      .catch(() => {
        toast.error("Failed to copy message");
      });
  };

  return (
    <div className={`flex ${role === "assistant" ? "justify-start" : "justify-end"}`}>
      <div
        className={`flex gap-3 max-w-[80%] ${
          role === "assistant" ? "flex-row" : "flex-row-reverse"
        }`}
      >
        <div
          className={`h-8 w-8 rounded-full flex-shrink-0 flex items-center justify-center ${
            role === "assistant"
              ? "bg-primary text-primary-foreground"
              : "bg-muted"
          }`}
        >
          {role === "assistant" ? <Bot className="h-4 w-4" /> : <User className="h-4 w-4" />}
        </div>
        <div>
          <div
            className={`rounded-lg p-3 text-sm ${
              role === "assistant"
                ? "bg-muted"
                : "bg-primary text-primary-foreground"
            }`}
          >
            <div 
              className="whitespace-pre-line"
              dangerouslySetInnerHTML={{ __html: formatContent(content) }}
            />
            <div
              className={`text-xs mt-1 flex justify-between items-center ${
                role === "assistant"
                  ? "text-muted-foreground"
                  : "text-primary-foreground/80"
              }`}
            >
              <span>{formatTimestamp(timestamp)}</span>
              
              <div className="flex gap-1">
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-6 w-6 p-0"
                  onClick={handleCopyContent}
                  title="Copy message"
                >
                  <Copy className="h-3 w-3" />
                </Button>
                
                {role === "assistant" && onPlayAudio && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-6 w-6 p-0"
                    onClick={() => isPlaying ? onStopAudio?.() : onPlayAudio(content)}
                    title={isPlaying ? "Stop speaking" : "Speak message"}
                  >
                    {isPlaying ? (
                      <VolumeX className="h-3 w-3" />
                    ) : (
                      <Volume2 className="h-3 w-3" />
                    )}
                  </Button>
                )}
                
                {role === "user" && onRetry && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-6 w-6 p-0"
                    onClick={onRetry}
                    title="Retry this message"
                  >
                    <RefreshCw className="h-3 w-3" />
                  </Button>
                )}
              </div>
            </div>
          </div>
          
          {role === "assistant" && relatedData && (
            <div className="mt-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowData(!showData)}
                className="text-xs"
              >
                {showData ? "Hide related data" : "Show related data"}
              </Button>
              
              {showData && (
                <div className="mt-1 text-xs rounded-md bg-muted/50 p-2">
                  <pre className="text-xs overflow-auto max-h-40">
                    {JSON.stringify(relatedData, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 