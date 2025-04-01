import { useState } from "react";
import { Sparkles, AlertCircle, CheckCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useInvoices } from "@/hooks/useInvoices";
import * as invoiceService from "@/lib/services/invoice-service";

interface AutoProcessorProps {
  onComplete?: (results: {
    processed: number;
    categorized: number;
    tagged: number;
    archived: number;
    duplicatesFound: number;
  }) => void;
}

export function AutoProcessor({ onComplete }: AutoProcessorProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [processingStatus, setProcessingStatus] = useState<string>("");
  const [processingResults, setProcessingResults] = useState<{
    processed: number;
    categorized: number;
    tagged: number;
    archived: number;
    duplicatesFound: number;
    duplicates: Array<{
      id: string;
      duplicateOf: string;
      invoiceNumber?: string;
      vendorName?: string;
    }>;
  }>({
    processed: 0,
    categorized: 0,
    tagged: 0,
    archived: 0,
    duplicatesFound: 0,
    duplicates: [],
  });
  const [error, setError] = useState<string | null>(null);

  // Use the invoices hook to access invoice data and operations
  const {
    invoices,
    loading: invoicesLoading,
    refresh: refreshInvoices,
  } = useInvoices({
    initialStatus: "PENDING",
    initialLimit: 100, // Fetch more invoices for batch processing
  });

  // Start auto-processing
  const startAutoProcessing = async () => {
    setIsProcessing(true);
    setProcessingProgress(0);
    setProcessingStatus("Initializing...");
    setError(null);
    
    const results = {
      processed: 0,
      categorized: 0,
      tagged: 0,
      archived: 0,
      duplicatesFound: 0,
      duplicates: [] as Array<{
        id: string;
        duplicateOf: string;
        invoiceNumber?: string;
        vendorName?: string;
      }>,
    };

    try {
      // In a real implementation, only process invoices that need categorization or tagging
      const pendingInvoices = invoices.filter(inv => 
        inv.status === "PENDING" && 
        (!inv.categoryId || !inv.tags || inv.tags.length === 0)
      );
      
      if (pendingInvoices.length === 0) {
        setProcessingStatus("No invoices to process");
        setIsProcessing(false);
        return;
      }
      
      // Process each invoice with the auto-categorize endpoint
      for (let i = 0; i < pendingInvoices.length; i++) {
        const invoice = pendingInvoices[i];
        
        // Update progress
        const progress = Math.round((i / pendingInvoices.length) * 100);
        setProcessingProgress(progress);
        setProcessingStatus(`Processing invoice ${i + 1} of ${pendingInvoices.length}`);
        
        try {
          // Call the auto-categorize API to get suggestions
          if (invoice.originalFileUrl) {
            const aiResult = await invoiceService.autoCategorizeInvoice(
              invoice.originalFileUrl,
              invoice
            );
            
            results.processed++;
            
            // Apply suggested category if available
            if (aiResult.categories.length > 0 && !invoice.categoryId) {
              const categoryId = aiResult.categories[0].id;
              await invoiceService.updateInvoice(invoice.id, { 
                categoryId 
              });
              results.categorized++;
            }
            
            // Apply suggested tags if available
            if (aiResult.tags.length > 0 && (!invoice.tags || invoice.tags.length === 0)) {
              await invoiceService.updateInvoice(invoice.id, { 
                tags: aiResult.tags 
              });
              results.tagged++;
            }
            
            // Check for duplicates
            if (aiResult.isDuplicate && aiResult.duplicateOf) {
              results.duplicatesFound++;
              results.duplicates.push({
                id: invoice.id,
                duplicateOf: aiResult.duplicateOf,
                invoiceNumber: invoice.invoiceNumber || undefined,
                vendorName: invoice.vendorName || undefined,
              });
            }
          } else {
            // No original file URL to process
            console.log(`Invoice ${invoice.id} has no original file URL`);
          }
        } catch (error) {
          console.error(`Error processing invoice ${invoice.id}:`, error);
        }
      }
      
      // Complete the processing
      setProcessingProgress(100);
      setProcessingStatus("Processing complete");
      setProcessingResults(results);
      
      // Notify parent component if needed
      if (onComplete) {
        onComplete(results);
      }
      
      // Refresh invoices after processing
      await refreshInvoices();
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unknown error occurred");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-purple-500" />
          Intelligent Document Processing
        </CardTitle>
        <CardDescription>
          Automatically categorize, tag, and organize your invoices with AI
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium mb-1">Auto-Process Documents</p>
              <p className="text-sm text-muted-foreground">
                Process all pending documents to extract data, detect duplicates, and organize automatically.
              </p>
            </div>
            
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    onClick={startAutoProcessing}
                    disabled={isProcessing || invoicesLoading}
                    className="bg-purple-600 hover:bg-purple-700"
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <Sparkles className="mr-2 h-4 w-4" />
                        Auto-Process
                      </>
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  Automatically categorize, tag, and analyze invoices
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          
          {isProcessing && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>{processingStatus}</span>
                <span>{processingProgress}%</span>
              </div>
              <Progress value={processingProgress} className="h-2" />
            </div>
          )}
          
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3 text-red-800 dark:bg-red-950/30 dark:border-red-900 dark:text-red-400">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                <p className="text-sm font-medium">Error during processing</p>
              </div>
              <p className="text-sm mt-1">{error}</p>
            </div>
          )}
          
          {!isProcessing && processingResults.processed > 0 && (
            <div className="bg-green-50 border border-green-200 rounded-md p-3 text-green-800 dark:bg-green-950/30 dark:border-green-900 dark:text-green-400">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                <p className="text-sm font-medium">Processing complete</p>
              </div>
              <div className="mt-2 grid grid-cols-2 md:grid-cols-4 gap-2">
                <div className="bg-white/50 dark:bg-black/5 p-2 rounded">
                  <p className="text-xs text-muted-foreground">Processed</p>
                  <p className="text-lg font-semibold">{processingResults.processed}</p>
                </div>
                <div className="bg-white/50 dark:bg-black/5 p-2 rounded">
                  <p className="text-xs text-muted-foreground">Categorized</p>
                  <p className="text-lg font-semibold">{processingResults.categorized}</p>
                </div>
                <div className="bg-white/50 dark:bg-black/5 p-2 rounded">
                  <p className="text-xs text-muted-foreground">Tagged</p>
                  <p className="text-lg font-semibold">{processingResults.tagged}</p>
                </div>
                <div className="bg-white/50 dark:bg-black/5 p-2 rounded">
                  <p className="text-xs text-muted-foreground">Duplicates</p>
                  <p className="text-lg font-semibold">{processingResults.duplicatesFound}</p>
                </div>
              </div>
              
              {processingResults.duplicates.length > 0 && (
                <div className="mt-3 space-y-2">
                  <p className="text-sm font-medium">Potential duplicates found:</p>
                  {processingResults.duplicates.map((duplicate, index) => (
                    <div key={index} className="bg-white/50 dark:bg-black/5 p-2 rounded flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">
                          {duplicate.vendorName || "Unknown vendor"} - {duplicate.invoiceNumber || "No invoice number"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Duplicate of another invoice in the system
                        </p>
                      </div>
                      <Badge variant="secondary">Needs review</Badge>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </CardContent>
      
      <CardFooter className="flex justify-between border-t pt-4">
        <p className="text-xs text-muted-foreground">
          AI will analyze document content, extract data, and categorize automatically
        </p>
      </CardFooter>
    </Card>
  );
} 