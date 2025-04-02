import React from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { ArrowUpCircle, ArrowDownCircle, HelpCircle } from "lucide-react";
import { InvoiceType } from '@/lib/types';

interface InvoiceTypeConfirmationProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoiceId: string;
  invoiceName: string;
  detectedType: InvoiceType;
  onConfirm: (invoiceId: string, confirmedType: InvoiceType) => Promise<void>;
  confidence?: number;
}

export default function InvoiceTypeConfirmation({
  open,
  onOpenChange,
  invoiceId,
  invoiceName,
  detectedType,
  onConfirm,
  confidence = 0
}: InvoiceTypeConfirmationProps) {
  const [selectedType, setSelectedType] = React.useState<InvoiceType>(detectedType);
  const [isConfirming, setIsConfirming] = React.useState(false);

  // Reset selected type when the dialog opens with a new invoice
  React.useEffect(() => {
    if (open) {
      setSelectedType(detectedType);
      setIsConfirming(false);
    }
  }, [open, detectedType]);

  const handleConfirm = async () => {
    setIsConfirming(true);
    try {
      await onConfirm(invoiceId, selectedType);
      onOpenChange(false);
    } catch (error) {
      console.error("Error confirming invoice type:", error);
    } finally {
      setIsConfirming(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center">
            <HelpCircle className="h-5 w-5 mr-2 text-amber-500" />
            Confirm Invoice Type
          </AlertDialogTitle>
          <AlertDialogDescription>
            Please confirm the type of invoice for <strong>{invoiceName}</strong>.
            {confidence > 0 && (
              <div className="mt-1">
                AI confidence: <span className={confidence > 0.7 ? "text-green-600" : confidence > 0.5 ? "text-amber-600" : "text-red-600"}>
                  {Math.round(confidence * 100)}%
                </span>
              </div>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="grid grid-cols-2 gap-4 py-4">
          <Button
            type="button"
            variant={selectedType === 'PURCHASE' ? "default" : "outline"}
            className={selectedType === 'PURCHASE' ? "border-2 border-primary" : ""}
            onClick={() => setSelectedType('PURCHASE')}
          >
            <ArrowDownCircle className="h-5 w-5 mr-2 text-amber-500" />
            <div className="text-left">
              <div className="font-semibold">Purchase Invoice</div>
              <div className="text-xs opacity-90">Your organization pays</div>
            </div>
          </Button>

          <Button
            type="button"
            variant={selectedType === 'PAYMENT' ? "default" : "outline"}
            className={selectedType === 'PAYMENT' ? "border-2 border-primary" : ""}
            onClick={() => setSelectedType('PAYMENT')}
          >
            <ArrowUpCircle className="h-5 w-5 mr-2 text-green-500" />
            <div className="text-left">
              <div className="font-semibold">Payment Invoice</div>
              <div className="text-xs opacity-90">Your organization receives</div>
            </div>
          </Button>
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction 
            onClick={handleConfirm}
            disabled={isConfirming}
          >
            {isConfirming ? "Saving..." : "Confirm"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
} 