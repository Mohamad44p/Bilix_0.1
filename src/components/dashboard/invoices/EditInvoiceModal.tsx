"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DatePicker } from "@/components/ui/date-picker";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Invoice } from "@/lib/types";
import { TagsInput } from "@/components/dashboard/invoices/TagsInput";
import * as invoiceService from "@/lib/services/invoice-service";
import { useToast } from "@/components/ui/use-toast";
import { Loader2 } from "lucide-react";

interface EditInvoiceModalProps {
  invoice: Invoice | null;
  open: boolean;
  onClose: () => void;
  onSave: () => void;
  availableCategories: string[];
}

export function EditInvoiceModal({
  invoice,
  open,
  onClose,
  onSave,
  availableCategories = []
}: EditInvoiceModalProps) {
  const [formData, setFormData] = useState<Partial<Invoice>>({});
  const [saving, setSaving] = useState(false);
  const [tags, setTags] = useState<string[]>([]);
  const [categoryValue, setCategoryValue] = useState<string>("none");
  const { toast } = useToast();

  // Initialize form data when invoice changes
  useEffect(() => {
    if (invoice) {
      setFormData({
        invoiceNumber: invoice.invoiceNumber || '',
        title: invoice.title || '',
        vendorName: invoice.vendorName || '',
        issueDate: invoice.issueDate,
        dueDate: invoice.dueDate,
        amount: invoice.amount,
        currency: invoice.currency || 'USD',
        status: invoice.status,
        notes: invoice.notes || '',
      });
      
      // Handle the category properly
      if (invoice.category && typeof invoice.category === 'object' && invoice.category.name) {
        setCategoryValue(invoice.category.name);
      } else if (invoice.category && typeof invoice.category === 'string') {
        setCategoryValue(invoice.category as string);
      } else {
        setCategoryValue("none");
      }
      
      setTags(invoice.tags || []);
    }
  }, [invoice]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const parsedValue = value ? parseFloat(value) : undefined;
    setFormData(prev => ({ ...prev, [name]: parsedValue }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCategoryChange = (value: string) => {
    setCategoryValue(value);
  };

  const handleDateChange = (name: string, date: Date | undefined) => {
    setFormData(prev => ({ ...prev, [name]: date }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!invoice) return;
    
    setSaving(true);
    
    try {
      // Create the update data without directly including category
      const updateData: Partial<Invoice> = {
        ...formData,
        tags
      };
      
      // Handle category conversion for the API
      if (categoryValue !== "none") {
        // Create a simplified category object
        updateData.category = {
          id: categoryValue, // Using the name as ID for simplicity
          name: categoryValue
        };
      } else {
        // When "none" is selected, we want to remove the category
        updateData.category = undefined;
      }
      
      console.log("Updating invoice with data:", updateData);
      
      // Update the invoice
      await invoiceService.updateInvoice(invoice.id, updateData);
      
      toast({
        title: "Invoice updated",
        description: `Invoice ${formData.invoiceNumber || invoice.id} has been updated successfully.`,
      });
      
      // Close the modal and refresh the invoice list
      onSave();
      onClose();
    } catch (error) {
      console.error("Failed to update invoice:", error);
      toast({
        title: "Update failed",
        description: error instanceof Error ? error.message : "Failed to update invoice",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Invoice</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="invoiceNumber">Invoice Number</Label>
              <Input
                id="invoiceNumber"
                name="invoiceNumber"
                value={formData.invoiceNumber || ''}
                onChange={handleInputChange}
                placeholder="INV-001"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                name="title"
                value={formData.title || ''}
                onChange={handleInputChange}
                placeholder="Monthly Service"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="vendorName">Vendor Name</Label>
              <Input
                id="vendorName"
                name="vendorName"
                value={formData.vendorName || ''}
                onChange={handleInputChange}
                placeholder="Vendor Inc."
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select 
                defaultValue={formData.status || 'PENDING'}
                onValueChange={(value) => handleSelectChange('status', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PENDING">Pending</SelectItem>
                  <SelectItem value="PAID">Paid</SelectItem>
                  <SelectItem value="OVERDUE">Overdue</SelectItem>
                  <SelectItem value="CANCELLED">Archived</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="issueDate">Issue Date</Label>
              <DatePicker
                date={formData.issueDate ? new Date(formData.issueDate) : undefined}
                setDate={(date) => handleDateChange('issueDate', date)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="dueDate">Due Date</Label>
              <DatePicker
                date={formData.dueDate ? new Date(formData.dueDate) : undefined}
                setDate={(date) => handleDateChange('dueDate', date)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="amount">Amount</Label>
              <div className="flex items-center gap-2">
                <div className="w-24">
                  <Select 
                    defaultValue={formData.currency || 'USD'}
                    onValueChange={(value) => handleSelectChange('currency', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Currency" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USD">USD</SelectItem>
                      <SelectItem value="EUR">EUR</SelectItem>
                      <SelectItem value="GBP">GBP</SelectItem>
                      <SelectItem value="CAD">CAD</SelectItem>
                      <SelectItem value="AUD">AUD</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Input
                  id="amount"
                  name="amount"
                  type="number"
                  step="0.01"
                  value={formData.amount !== undefined ? formData.amount : ''}
                  onChange={handleNumberChange}
                  placeholder="0.00"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select 
                value={categoryValue}
                onValueChange={handleCategoryChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {availableCategories.map((category) => (
                    <SelectItem key={category} value={category}>{category}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="tags">Tags</Label>
            <TagsInput
              value={tags}
              onChange={setTags}
              placeholder="Add tags..."
              max={10}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              name="notes"
              value={formData.notes || ''}
              onChange={handleInputChange}
              placeholder="Add any additional notes here"
              rows={4}
            />
          </div>
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={saving}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
} 