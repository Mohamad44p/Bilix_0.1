import { useState } from "react";
import { 
  Check, Download, Archive, Tag, AlertCircle, Loader2, CheckCircle, X, Trash2 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ExportModal, ExportOptions } from "@/components/dashboard/invoices/ExportModal";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

interface BatchOperationsProps {
  selectedCount: number;
  onBatchApprove: () => Promise<void>;
  onBatchDelete: () => Promise<void>;
  onBatchExport: (options: ExportOptions) => Promise<void>;
  onBatchArchive: () => Promise<void>;
  onBatchTag: (tags: string[]) => Promise<void>;
  isLoading?: boolean;
  hasError?: boolean;
  errorMessage?: string;
}

export function BatchOperations({
  selectedCount,
  onBatchApprove,
  onBatchDelete,
  onBatchExport,
  onBatchArchive,
  onBatchTag,
  isLoading = false,
  hasError = false,
  errorMessage = "An error occurred during the batch operation",
}: BatchOperationsProps) {
  const [tagInput, setTagInput] = useState("");
  const [showExportModal, setShowExportModal] = useState(false);
  const [currentOperation, setCurrentOperation] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Handle direct export button click
  const handleExportClick = () => {
    setShowExportModal(true);
  };

  // Handle export with options
  const handleExport = async (options: ExportOptions) => {
    try {
      setCurrentOperation("export");
      setProgress(10);
      
      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + 10;
        });
      }, 500);
      
      // Use the onBatchExport callback for actual export
      await onBatchExport(options);
      
      clearInterval(progressInterval);
      setProgress(100);
      setSuccessMessage(`Successfully exported ${selectedCount} invoice${selectedCount !== 1 ? 's' : ''}`);
      
      // Clear success message after a delay
      setTimeout(() => {
        setCurrentOperation(null);
        setProgress(0);
        setSuccessMessage(null);
      }, 3000);
    } catch (error) {
      console.error("Export failed:", error);
      setCurrentOperation(null);
      setProgress(0);
    }
  };
  
  // Handle approve operation with progress tracking
  const handleApprove = async () => {
    try {
      setCurrentOperation("approve");
      setProgress(10);
      
      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + 10;
        });
      }, 300);
      
      await onBatchApprove();
      
      clearInterval(progressInterval);
      setProgress(100);
      setSuccessMessage(`Successfully approved ${selectedCount} invoice${selectedCount !== 1 ? 's' : ''}`);
      
      // Clear success message after a delay
      setTimeout(() => {
        setCurrentOperation(null);
        setProgress(0);
        setSuccessMessage(null);
      }, 3000);
    } catch (error) {
      console.error("Approve failed:", error);
      setCurrentOperation(null);
      setProgress(0);
    }
  };
  
  // Handle archive operation with progress tracking
  const handleArchive = async () => {
    try {
      setCurrentOperation("archive");
      setProgress(10);
      
      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + 15;
        });
      }, 300);
      
      await onBatchArchive();
      
      clearInterval(progressInterval);
      setProgress(100);
      setSuccessMessage(`Successfully archived ${selectedCount} invoice${selectedCount !== 1 ? 's' : ''}`);
      
      // Clear success message after a delay
      setTimeout(() => {
        setCurrentOperation(null);
        setProgress(0);
        setSuccessMessage(null);
      }, 3000);
    } catch (error) {
      console.error("Archive failed:", error);
      setCurrentOperation(null);
      setProgress(0);
    }
  };
  
  // Handle delete operation with progress tracking
  const handleDelete = async () => {
    try {
      setCurrentOperation("delete");
      setProgress(10);
      
      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + 20;
        });
      }, 250);
      
      await onBatchDelete();
      
      clearInterval(progressInterval);
      setProgress(100);
      setSuccessMessage(`Successfully deleted ${selectedCount} invoice${selectedCount !== 1 ? 's' : ''}`);
      
      // Clear success message after a delay
      setTimeout(() => {
        setCurrentOperation(null);
        setProgress(0);
        setSuccessMessage(null);
      }, 3000);
    } catch (error) {
      console.error("Delete failed:", error);
      setCurrentOperation(null);
      setProgress(0);
    }
  };
  
  // Handle tag operation with progress tracking
  const handleTagSubmit = async () => {
    if (!tagInput.trim()) return;
    
    const tags = tagInput
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean);
    
    if (tags.length === 0) return;
    
    try {
      setCurrentOperation("tag");
      setProgress(10);
      
      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + 10;
        });
      }, 300);
      
      await onBatchTag(tags);
      
      clearInterval(progressInterval);
      setProgress(100);
      setSuccessMessage(`Successfully tagged ${selectedCount} invoice${selectedCount !== 1 ? 's' : ''}`);
      
      // Clear input and success message after a delay
      setTagInput("");
      setTimeout(() => {
        setCurrentOperation(null);
        setProgress(0);
        setSuccessMessage(null);
      }, 3000);
    } catch (error) {
      console.error("Tagging failed:", error);
      setCurrentOperation(null);
      setProgress(0);
    }
  };

  if (selectedCount === 0) {
    return null;
  }

  return (
    <div className="bg-muted/40 border rounded-md p-4">
      <div className="flex flex-col space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Check className="h-5 w-5 text-primary" />
            <span className="font-medium">
              {selectedCount} {selectedCount === 1 ? "invoice" : "invoices"} selected
            </span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => window.location.reload()}
            className="text-xs"
          >
            <X className="h-4 w-4 mr-1" /> Clear selection
          </Button>
        </div>

        {hasError && (
          <div className="bg-red-100 text-red-800 p-2 rounded text-sm flex items-center space-x-2">
            <AlertCircle className="h-4 w-4" />
            <span>{errorMessage}</span>
          </div>
        )}
        
        {successMessage && (
          <div className="bg-green-100 text-green-800 p-2 rounded text-sm flex items-center space-x-2">
            <CheckCircle className="h-4 w-4" />
            <span>{successMessage}</span>
          </div>
        )}
        
        {currentOperation && (
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-sm capitalize">
                {currentOperation === "tag" ? "Applying tags" : `${currentOperation}ing invoices`}
              </span>
              <span className="text-xs text-muted-foreground">{progress}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleApprove}
            disabled={isLoading || !!currentOperation}
          >
            {currentOperation === "approve" ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
            )}
            Approve
            {selectedCount > 10 && (
              <Badge variant="secondary" className="ml-1 text-xs">
                {selectedCount}
              </Badge>
            )}
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleArchive}
            disabled={isLoading || !!currentOperation}
          >
            {currentOperation === "archive" ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Archive className="h-4 w-4 mr-2" />
            )}
            Archive
            {selectedCount > 10 && (
              <Badge variant="secondary" className="ml-1 text-xs">
                {selectedCount}
              </Badge>
            )}
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportClick}
            disabled={isLoading || !!currentOperation}
          >
            {currentOperation === "export" ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Download className="h-4 w-4 mr-2" />
            )}
            Export
            {selectedCount > 10 && (
              <Badge variant="secondary" className="ml-1 text-xs">
                {selectedCount}
              </Badge>
            )}
          </Button>
          
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                disabled={isLoading || !!currentOperation}
              >
                {currentOperation === "tag" ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Tag className="h-4 w-4 mr-2" />
                )}
                Add Tags
                {selectedCount > 10 && (
                  <Badge variant="secondary" className="ml-1 text-xs">
                    {selectedCount}
                  </Badge>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80">
              <div className="space-y-4">
                <h4 className="font-medium">Add Tags to Invoices</h4>
                <p className="text-sm text-muted-foreground">
                  Enter tags separated by commas
                </p>
                <div className="flex items-center space-x-2">
                  <Input
                    placeholder="e.g., important, tax, reviewed"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        handleTagSubmit();
                      }
                    }}
                  />
                  <Button
                    onClick={handleTagSubmit}
                    disabled={!tagInput.trim() || isLoading || !!currentOperation}
                  >
                    Add
                  </Button>
                </div>
                
                <div className="flex flex-wrap gap-1 mt-2">
                  {["important", "tax", "2023", "receipt", "expense"].map(tag => (
                    <Badge 
                      key={tag}
                      variant="outline" 
                      className="cursor-pointer"
                      onClick={() => {
                        if (tagInput.includes(tag)) return;
                        const newInput = tagInput ? `${tagInput}, ${tag}` : tag;
                        setTagInput(newInput);
                      }}
                    >
                      + {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            </PopoverContent>
          </Popover>
          
          <Button
            variant="destructive"
            size="sm"
            onClick={handleDelete}
            disabled={isLoading || !!currentOperation}
          >
            {currentOperation === "delete" ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4 mr-2" />
            )}
            Delete
          </Button>
        </div>
      </div>

      <ExportModal
        open={showExportModal}
        onClose={() => setShowExportModal(false)}
        onExport={handleExport}
        selectedCount={selectedCount}
      />
    </div>
  );
} 