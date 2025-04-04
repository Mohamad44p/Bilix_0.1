"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { getInventoryHistory } from "@/lib/services/inventory-service";
import { formatDate, formatCurrency } from "@/lib/utils";
import { ArrowUp, ArrowDown, History } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface InventoryHistoryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  itemId: string;
  itemName: string;
}

interface HistoryEntry {
  id: string;
  previousQuantity: number;
  newQuantity: number;
  changeReason: string;
  timestamp: Date;
  notes?: string | null;
  invoiceId?: string | null;
  invoice?: {
    invoiceNumber?: string;
  } | null;
}

export function InventoryHistoryModal({
  open,
  onOpenChange,
  itemId,
  itemName,
}: InventoryHistoryModalProps) {
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      loadHistory();
    }
  }, [open, itemId]);

  const loadHistory = async () => {
    setLoading(true);
    try {
      const data = await getInventoryHistory(itemId);
      setHistory(data);
    } catch (error) {
      console.error("Failed to load inventory history:", error);
      toast({
        title: "Error loading history",
        description: "Could not load inventory history. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getChangeIcon = (previousQuantity: number, newQuantity: number) => {
    const change = newQuantity - previousQuantity;
    if (change > 0) {
      return <ArrowUp className="h-4 w-4 text-green-500" />;
    } else if (change < 0) {
      return <ArrowDown className="h-4 w-4 text-red-500" />;
    } else {
      return null;
    }
  };

  const getChangeReasonBadge = (reason: string) => {
    switch (reason.toUpperCase()) {
      case "PURCHASE":
        return <span className="px-2 py-1 rounded-full bg-green-100 text-green-800 text-xs font-medium">Purchase</span>;
      case "SALE":
        return <span className="px-2 py-1 rounded-full bg-blue-100 text-blue-800 text-xs font-medium">Sale</span>;
      case "ADJUSTMENT":
        return <span className="px-2 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-medium">Adjustment</span>;
      case "RETURN":
        return <span className="px-2 py-1 rounded-full bg-purple-100 text-purple-800 text-xs font-medium">Return</span>;
      default:
        return <span className="px-2 py-1 rounded-full bg-gray-100 text-gray-800 text-xs font-medium capitalize">{reason.toLowerCase()}</span>;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Inventory History for {itemName}
          </DialogTitle>
        </DialogHeader>

        <div className="mt-4">
          {loading ? (
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center justify-between p-4 border rounded-md animate-pulse">
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                  <div className="space-y-2 text-right">
                    <Skeleton className="h-4 w-16 ml-auto" />
                    <Skeleton className="h-4 w-20 ml-auto" />
                  </div>
                </div>
              ))}
            </div>
          ) : history.length === 0 ? (
            <div className="text-center py-8">
              <History className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No history found</h3>
              <p className="text-muted-foreground">
                This item has no recorded inventory changes
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {history.map((entry) => (
                <div key={entry.id} className="p-4 border rounded-md hover:bg-muted/50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        {getChangeReasonBadge(entry.changeReason)}
                        {entry.invoice?.invoiceNumber && (
                          <span className="text-sm text-muted-foreground">
                            Invoice: {entry.invoice.invoiceNumber}
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {formatDate(entry.timestamp)}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-1 font-medium">
                        {getChangeIcon(entry.previousQuantity, entry.newQuantity)}
                        <span>
                          {entry.previousQuantity} → {entry.newQuantity}
                        </span>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Change: {entry.newQuantity - entry.previousQuantity}
                      </div>
                    </div>
                  </div>
                  {entry.notes && (
                    <div className="mt-2 text-sm border-t pt-2">
                      <span className="font-medium">Notes:</span> {entry.notes}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
