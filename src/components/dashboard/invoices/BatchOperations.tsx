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

  // Handle direct export button click
  const handleExportClick = () => {
    setShowExportModal(true);
  };

  // Handle export with options
  const handleExport = async (options: ExportOptions) => {
    try {
      // Use the onBatchExport callback for actual export
      await onBatchExport(options);
    } catch (error) {
      console.error("Export failed:", error);
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

        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onBatchApprove}
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
            )}
            Approve
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={onBatchArchive}
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Archive className="h-4 w-4 mr-2" />
            )}
            Archive
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportClick}
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Download className="h-4 w-4 mr-2" />
            )}
            Export
          </Button>
          
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                disabled={isLoading}
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Tag className="h-4 w-4 mr-2" />
                )}
                Add Tags
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
                  />
                  <Button
                    onClick={() => {
                      if (tagInput.trim()) {
                        onBatchTag(
                          tagInput
                            .split(",")
                            .map((tag) => tag.trim())
                            .filter(Boolean)
                        );
                        setTagInput("");
                      }
                    }}
                    disabled={!tagInput.trim() || isLoading}
                  >
                    Add
                  </Button>
                </div>
              </div>
            </PopoverContent>
          </Popover>
          
          <Button
            variant="destructive"
            size="sm"
            onClick={onBatchDelete}
            disabled={isLoading}
          >
            {isLoading ? (
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