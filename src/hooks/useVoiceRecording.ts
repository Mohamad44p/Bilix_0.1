import { useState, useCallback, useRef, useEffect } from "react";
import { toast } from "sonner";
import { transcribeAudio } from "@/lib/services/ai-service";

interface UseVoiceRecordingProps {
  onTranscription: (text: string) => void;
  onRecordingStart?: () => void;
  onRecordingStop?: () => void;
  showNotifications?: boolean;
}

export function useVoiceRecording({ 
  onTranscription, 
  onRecordingStart,
  onRecordingStop,
  showNotifications = false
}: UseVoiceRecordingProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const lastRecordingTime = useRef<number>(0);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (mediaRecorderRef.current && isRecording) {
        mediaRecorderRef.current.stop();
      }
    };
  }, [isRecording]);

  const startRecording = useCallback(async () => {
    // Prevent rapid toggling of recording state
    const now = Date.now();
    if (now - lastRecordingTime.current < 1000) {
      return; // Ignore if less than 1 second since last recording change
    }
    lastRecordingTime.current = now;
    
    audioChunksRef.current = [];
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      
      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        
        // Only process if we have actual audio data
        if (audioBlob.size > 100) { // Skip empty or very small recordings
          try {
            setIsProcessing(true);
            // Call the recording stop callback if provided
            if (onRecordingStop) {
              onRecordingStop();
            }
            
            const { text } = await transcribeAudio(audioBlob);
            
            // Only process if we got actual text back
            if (text && text.trim()) {
              onTranscription(text);
              // Only show notification if explicitly enabled
              if (showNotifications) {
                toast.info("Processing your voice input...");
              }
            } else {
              // Silent recording with no speech detected
              setIsProcessing(false);
            }
          } catch (error) {
            console.error("Error processing audio:", error);
            toast.error("Failed to process audio. Please try again.");
            setIsProcessing(false);
          } finally {
            // Stop all audio tracks
            stream.getTracks().forEach(track => track.stop());
          }
        } else {
          // Recording was too short or empty
          setIsProcessing(false);
          // Stop all audio tracks
          stream.getTracks().forEach(track => track.stop());
        }
      };
      
      mediaRecorder.onstart = () => {
        // Call the recording start callback if provided
        if (onRecordingStart) {
          onRecordingStart();
        }
        // Only show notification if explicitly enabled
        if (showNotifications) {
          toast.info("Recording started. Speak now...");
        }
      };
      
      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error("Error starting recording:", error);
      toast.error("Could not access microphone. Please check permissions.");
    }
  }, [onTranscription, onRecordingStart, onRecordingStop, showNotifications]);

  const stopRecording = useCallback(() => {
    // Prevent rapid toggling of recording state
    const now = Date.now();
    if (now - lastRecordingTime.current < 1000) {
      return; // Ignore if less than 1 second since last recording change
    }
    lastRecordingTime.current = now;
    
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  }, [isRecording]);

  return {
    isRecording,
    isProcessing,
    startRecording,
    stopRecording
  };
} 