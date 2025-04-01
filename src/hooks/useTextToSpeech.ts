import { useState, useCallback, useRef } from "react";
import { toast } from "sonner";
import { generateSpeech } from "@/lib/services/ai-service";

interface UseTextToSpeechProps {
  onSpeechStart?: () => void;
  onSpeechEnd?: () => void;
}

export function useTextToSpeech(props?: UseTextToSpeechProps) {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const { onSpeechStart, onSpeechEnd } = props || {};
  
  // Initialize audio element if it doesn't exist
  if (typeof window !== "undefined" && !audioRef.current) {
    audioRef.current = new Audio();
    
    audioRef.current.onended = () => {
      setIsSpeaking(false);
      if (onSpeechEnd) {
        onSpeechEnd();
      }
    };
    
    audioRef.current.onpause = () => {
      setIsSpeaking(false);
      if (onSpeechEnd) {
        onSpeechEnd();
      }
    };
    
    audioRef.current.onerror = () => {
      setIsSpeaking(false);
      if (onSpeechEnd) {
        onSpeechEnd();
      }
      toast.error("Error playing audio");
    };
  }
  
  const speak = useCallback(async (text: string) => {
    try {
      // Skip if already speaking or empty text
      if (isSpeaking || !text.trim()) return;
      
      setIsLoading(true);
      
      // Stop any current playback
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
      
      // Generate speech audio from text
      const audioBlob = await generateSpeech(text);
      
      // Create URL for the audio blob
      const audioUrl = URL.createObjectURL(audioBlob);
      
      if (audioRef.current) {
        audioRef.current.src = audioUrl;
        audioRef.current.play().then(() => {
          setIsSpeaking(true);
          if (onSpeechStart) {
            onSpeechStart();
          }
        }).catch((error) => {
          console.error("Error playing audio:", error);
          toast.error("Failed to play audio");
          if (onSpeechEnd) {
            onSpeechEnd();
          }
        });
      }
    } catch (error) {
      console.error("Error in text-to-speech:", error);
      toast.error("Failed to generate speech");
      if (onSpeechEnd) {
        onSpeechEnd();
      }
    } finally {
      setIsLoading(false);
    }
  }, [isSpeaking, onSpeechStart, onSpeechEnd]);
  
  const stop = useCallback(() => {
    if (audioRef.current && isSpeaking) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsSpeaking(false);
      if (onSpeechEnd) {
        onSpeechEnd();
      }
    }
  }, [isSpeaking, onSpeechEnd]);
  
  return {
    speak,
    stop,
    isSpeaking,
    isLoading
  };
} 