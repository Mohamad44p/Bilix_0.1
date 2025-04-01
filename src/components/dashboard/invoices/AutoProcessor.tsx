"use client";

import { useState } from "react";
import { 
  Lightbulb, Sparkles, Check, RefreshCw, Clock, Table, Server, Grid, NetworkIcon
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface AutoProcessorProps {
  onComplete: () => void;
}

interface ProcessingResult {
    processed: number;
    categorized: number;
    recategorized: number;
    duplicates: number;
    errors: number;
}

// Default AI settings configured to use GPT-4 only
const defaultAISettings = {
  model: "gpt-4", // Only using GPT-4
    confidenceThreshold: 0.7,
    autoApprove: false,
    includePaid: false,
    detectDuplicates: true,
  enableLearning: true
};

// This function processes invoices using the API directly
export async function processInvoicesWithAI(
  invoiceIds: string[],
  operation: 'categorize' | 'detectDuplicates' | 'extract' = 'categorize',
  customSettings = {}
): Promise<ProcessingResult> {
  const settings = { ...defaultAISettings, ...customSettings };
  
  try {
    // API endpoint will depend on operation
    const endpoint = `/api/invoices/${operation === 'detectDuplicates' ? 
      'duplicates' : 
      operation === 'extract' ? 
      'extract' : 
      'auto-categorize'}`;
      
    // Call the API
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        invoiceIds,
        options: {
          model: 'gpt-4', // Always use GPT-4
          confidenceThreshold: settings.confidenceThreshold,
          autoApprove: settings.autoApprove,
          includePaid: settings.includePaid,
        }
      }),
    });
    
    if (!response.ok) {
      throw new Error(`API error: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    // Calculate summary stats
    const processedCount = data.results?.length || 0;
    const categorizedCount = data.results?.filter(
      (r: any) => r.success && r.changes?.category
    ).length || 0;
    const duplicatesCount = data.results?.filter(
      (r: any) => r.success && r.changes?.isDuplicate
    ).length || 0;
    const errorsCount = data.results?.filter(
      (r: any) => !r.success
    ).length || 0;
    
    return {
      processed: processedCount,
      categorized: categorizedCount,
      recategorized: 0, // Not tracked in this version
      duplicates: duplicatesCount,
      errors: errorsCount
    };
  } catch (error) {
    console.error(`Error in ${operation} operation:`, error);
    throw error;
  }
}

// This component is kept mainly for backward compatibility
// but doesn't show UI controls anymore
export function AutoProcessor({ onComplete }: AutoProcessorProps) {
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<string | null>(null);
  const [results, setResults] = useState<ProcessingResult | null>(null);

  // Process all invoices with AI
  const processAll = async (operation: 'categorize' | 'detectDuplicates' | 'extract') => {
    if (processing) return;
    
    setProcessing(true);
    setProgress(0);
    setStatus(`Processing invoices with GPT-4...`);
    setResults(null);
    
    try {
      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 5, 90));
      }, 500);
      
      // Replace with actual API call in production
      // Here we're simulating as if we called the API
      await new Promise(resolve => setTimeout(resolve, 2000));
      const results = {
        processed: Math.floor(Math.random() * 20) + 10,
        categorized: Math.floor(Math.random() * 15),
        recategorized: Math.floor(Math.random() * 5),
        duplicates: Math.floor(Math.random() * 3),
        errors: Math.floor(Math.random() * 2)
      };
      
      clearInterval(progressInterval);
      setProgress(100);
      setResults(results);
      
      if (onComplete) {
      onComplete();
      }
    } catch (error) {
      console.error(`Error processing with AI:`, error);
      setStatus("Error: Processing failed");
    } finally {
      setProcessing(false);
    }
  };
  
  return null; // No UI rendered - this is now an API-only service
} 