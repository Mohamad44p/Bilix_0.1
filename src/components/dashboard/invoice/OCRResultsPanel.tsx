"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Check, 
  PlusCircle, 
  Sparkles, 
  Globe,
  CalendarDays,
  Receipt,
  Building,
  Tag,
  AlertCircle,
  Save,
  Pencil,
  Plus,
  X,
  Info,
  ArrowDownCircle,
  ArrowUpCircle,
  RefreshCw
} from "lucide-react";
import { ExtractedInvoiceData, Category, Vendor, InvoiceLineItem, InvoiceType } from "@/lib/types";
import { updateInvoiceCategory, updateInvoiceVendor } from "@/lib/actions/invoice";
import { useToast } from "@/components/ui/use-toast";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Switch } from "@/components/ui/switch";
import * as invoiceService from "@/lib/services/invoice-service";
import { Textarea } from "@/components/ui/textarea";

interface OCRResultsPanelProps {
  invoiceId: string;
  extractedData: ExtractedInvoiceData;
  suggestedCategories: string[];
  vendorSuggestions: string[];
  existingCategories: Category[];
  existingVendors: Vendor[];
  onRefresh?: () => void;
  engine?: string;
  confidence?: number;
}

interface ExtendedInvoiceData extends ExtractedInvoiceData {
  [key: string]: any;
}

export default function OCRResultsPanel({
  invoiceId,
  extractedData,
  suggestedCategories,
  vendorSuggestions,
  existingCategories,
  existingVendors,
  onRefresh,
  engine = 'openai',
  confidence = 0.9
}: OCRResultsPanelProps) {
  const [activeTab, setActiveTab] = useState("extracted");
  const [isPending, setIsPending] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [isNewCategory, setIsNewCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [selectedVendor, setSelectedVendor] = useState("");
  const [isNewVendor, setIsNewVendor] = useState(false);
  const [newVendorData, setNewVendorData] = useState({
    name: "",
    email: "",
    phone: "",
    website: "",
    address: "",
  });
  
  // Field editing state
  const [isEditingData, setIsEditingData] = useState(false);
  const [editedData, setEditedData] = useState<Partial<ExtendedInvoiceData>>({});
  const [customFields, setCustomFields] = useState<string[]>([]);
  const [newCustomField, setNewCustomField] = useState("");
  
  // Initialize edited data with extracted data when component mounts or extractedData changes
  useEffect(() => {
    setEditedData({ 
      ...extractedData,
      invoiceType: extractedData.invoiceType || 'PURCHASE' 
    });
    
    // Identify custom fields that might be in the extracted data
    const standardFields = [
      'invoiceNumber', 'vendorName', 'issueDate', 'dueDate', 
      'amount', 'currency', 'tax', 'notes', 'language', 
      'items', 'confidence', 'invoiceType'
    ];
    
    // Set custom fields from extracted data
    const customFieldsFromData = Object.keys(extractedData || {})
      .filter(key => !standardFields.includes(key) && typeof extractedData[key] !== 'object');
    
    if (customFieldsFromData.length > 0) {
      setCustomFields(customFieldsFromData);
    }
  }, [extractedData]);
  
  const { toast } = useToast();

  // Format currency with the correct symbol
  const formatCurrency = (amount: number | undefined, currency: string = "USD") => {
    if (amount === undefined) return "N/A";
    
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency,
    }).format(amount);
  };

  // Format dates for display
  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return "N/A";
    
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  // Save category selection
  const saveCategory = async () => {
    try {
      setIsPending(true);
      const categoryName = isNewCategory ? newCategoryName : selectedCategory;
      
      if (!categoryName) {
        toast({
          title: "Error",
          description: "Please select or create a category",
          variant: "destructive",
        });
        return;
      }

      await updateInvoiceCategory(invoiceId, categoryName, isNewCategory);
      
      toast({
        title: "Category updated",
        description: "Invoice category has been updated successfully",
      });
      
      if (onRefresh) {
        onRefresh();
      }
    } catch (error) {
      console.error("Error saving category:", error);
      toast({
        title: "Error",
        description: "Failed to update category",
        variant: "destructive",
      });
    } finally {
      setIsPending(false);
    }
  };

  // Save vendor selection
  const saveVendor = async () => {
    try {
      setIsPending(true);
      
      if (isNewVendor) {
        if (!newVendorData.name) {
          toast({
            title: "Error",
            description: "Vendor name is required",
            variant: "destructive",
          });
          return;
        }

        await updateInvoiceVendor(
          invoiceId, 
          newVendorData.name, 
          true, 
          {
            email: newVendorData.email,
            phone: newVendorData.phone,
            website: newVendorData.website,
            address: newVendorData.address,
          }
        );
      } else {
        if (!selectedVendor) {
          toast({
            title: "Error",
            description: "Please select a vendor",
            variant: "destructive",
          });
          return;
        }

        await updateInvoiceVendor(invoiceId, selectedVendor, false);
      }
      
      toast({
        title: "Vendor updated",
        description: "Invoice vendor has been updated successfully",
      });
      
      if (onRefresh) {
        onRefresh();
      }
    } catch (error) {
      console.error("Error saving vendor:", error);
      toast({
        title: "Error",
        description: "Failed to update vendor",
        variant: "destructive",
      });
    } finally {
      setIsPending(false);
    }
  };
  
  // Handle field editing
  const handleEditField = (field: string, value: any) => {
    setEditedData(prev => ({
      ...prev,
      [field]: value
    }));
  };
  
  // Save edited data
  const saveEditedData = async () => {
    try {
      setIsPending(true);
      
      // Prepare line items data to save separately
      const lineItems = editedData.items || [];
      
      // In a real application, this would update the invoice with manually corrected data
      await invoiceService.updateInvoice(invoiceId, {
        invoiceNumber: editedData.invoiceNumber,
        vendorName: editedData.vendorName,
        issueDate: editedData.issueDate ? new Date(editedData.issueDate) : undefined,
        dueDate: editedData.dueDate ? new Date(editedData.dueDate) : undefined,
        amount: editedData.amount,
        currency: editedData.currency,
        notes: editedData.notes,
        invoiceType: editedData.invoiceType as InvoiceType,
        extractedData: editedData
      });
      
      // For line items, submit each one to be saved in the database
      if (lineItems.length > 0) {
        await Promise.all(lineItems.map((item: InvoiceLineItem) => 
          invoiceService.saveInvoiceLineItem(invoiceId, item)
        ));
      }
      
      toast({
        title: "Data updated",
        description: "Invoice data has been updated with your changes",
      });
      
      setIsEditingData(false);
      
      if (onRefresh) {
        onRefresh();
      }
    } catch (error) {
      console.error("Error saving edited data:", error);
      toast({
        title: "Error",
        description: "Failed to update invoice data",
        variant: "destructive",
      });
    } finally {
      setIsPending(false);
    }
  };
  
  // Add custom field
  const addCustomField = () => {
    if (newCustomField && !customFields.includes(newCustomField)) {
      setCustomFields([...customFields, newCustomField]);
      setNewCustomField("");
      
      // Initialize edited data for this field
      setEditedData(prev => ({
        ...prev,
        [newCustomField]: ""
      }));
    }
  };
  
  // Remove custom field
  const removeCustomField = (field: string) => {
    setCustomFields(customFields.filter(f => f !== field));
    
    // Remove field from edited data
    const newEditedData = { ...editedData };
    delete newEditedData[field];
    setEditedData(newEditedData);
  };
  
  // Get confidence indicator
  const getConfidenceIndicator = (confidenceScore: number) => {
    if (confidenceScore >= 0.8) {
      return { color: "text-green-500", label: "High" };
    } else if (confidenceScore >= 0.5) {
      return { color: "text-amber-500", label: "Medium" };
    } else {
      return { color: "text-red-500", label: "Low" };
    }
  };
  
  // Get invoice type icon and text
  const getInvoiceTypeDetails = (invoiceType: InvoiceType | undefined) => {
    if (invoiceType === 'PAYMENT') {
      return { 
        icon: <ArrowUpCircle className="h-4 w-4 text-green-500" />, 
        label: "Payment Invoice (Money Received)",
        description: "This is a payment invoice, indicating money received for sales"
      };
    } else {
      return { 
        icon: <ArrowDownCircle className="h-4 w-4 text-amber-500" />, 
        label: "Purchase Invoice (Money Paid)",
        description: "This is a purchase invoice, indicating money paid for goods or services"
      };
    }
  };
  
  const confidenceInfo = getConfidenceIndicator(confidence);
  const invoiceTypeInfo = getInvoiceTypeDetails(editedData.invoiceType as InvoiceType);

  return (
    <Card className="mt-6">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-amber-500" />
            AI-Processed Invoice Data
          </CardTitle>
          <div className="flex items-center gap-3">
            {extractedData.language && (
              <Badge variant="outline" className="flex items-center gap-1">
                <Globe className="h-3 w-3" />
                {extractedData.language.toUpperCase()}
              </Badge>
            )}
            
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-1">
                    <div className={`h-2 w-2 rounded-full ${confidenceInfo.color}`}></div>
                    <span className="text-xs text-muted-foreground">
                      {confidenceInfo.label} confidence
                    </span>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>OCR confidence score: {(confidence * 100).toFixed(0)}%</p>
                  <p className="text-xs text-muted-foreground mt-1">Engine: {engine}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            <Badge variant={editedData.invoiceType === 'PAYMENT' ? 'success' : 'secondary'} className="flex items-center gap-1">
              {invoiceTypeInfo.icon}
              <span className="ml-1">{editedData.invoiceType === 'PAYMENT' ? 'Payment' : 'Purchase'}</span>
            </Badge>
          </div>
        </div>
        <CardDescription>
          Data extracted from the invoice using AI-powered OCR
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-3 mb-4">
            <TabsTrigger value="extracted">Extracted Data</TabsTrigger>
            <TabsTrigger value="category">Category</TabsTrigger>
            <TabsTrigger value="vendor">Vendor</TabsTrigger>
          </TabsList>

          <TabsContent value="extracted" className="space-y-6">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-muted-foreground">
                Review the extracted data and make corrections if needed
              </p>
              <div className="flex items-center gap-2">
                <span className="text-sm">Edit mode</span>
                <Switch 
                  checked={isEditingData} 
                  onCheckedChange={setIsEditingData} 
                />
              </div>
            </div>
            
            <div className="mb-4 p-3 bg-muted/20 border rounded-md">
              <div className="flex items-start gap-2">
                {invoiceTypeInfo.icon}
                <div>
                  <h4 className="text-sm font-medium">{invoiceTypeInfo.label}</h4>
                  <p className="text-xs text-muted-foreground">{invoiceTypeInfo.description}</p>
                </div>
              </div>
              
              {isEditingData && (
                <div className="mt-3 pt-3 border-t">
                  <Label className="text-muted-foreground text-sm mb-2 block">Invoice Type</Label>
                  <Select 
                    value={editedData.invoiceType || 'PURCHASE'} 
                    onValueChange={(value) => handleEditField("invoiceType", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select invoice type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PURCHASE">
                        <div className="flex items-center gap-2">
                          <ArrowDownCircle className="h-4 w-4 text-amber-500" />
                          <span>Purchase Invoice (Money Paid)</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="PAYMENT">
                        <div className="flex items-center gap-2">
                          <ArrowUpCircle className="h-4 w-4 text-green-500" />
                          <span>Payment Invoice (Money Received)</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-muted-foreground text-sm">Invoice Number</Label>
                {isEditingData ? (
                  <Input
                    value={editedData.invoiceNumber || ""}
                    onChange={(e) => handleEditField("invoiceNumber", e.target.value)}
                    placeholder="Enter invoice number"
                  />
                ) : (
                  <div className="flex items-center">
                    <Receipt className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span className="font-medium">
                      {extractedData.invoiceNumber || "Not detected"}
                    </span>
                  </div>
                )}
              </div>
              
              <div className="space-y-2">
                <Label className="text-muted-foreground text-sm">Vendor</Label>
                {isEditingData ? (
                  <Input
                    value={editedData.vendorName || ""}
                    onChange={(e) => handleEditField("vendorName", e.target.value)}
                    placeholder="Enter vendor name"
                  />
                ) : (
                  <div className="flex items-center">
                    <Building className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span className="font-medium">
                      {extractedData.vendorName || "Not detected"}
                    </span>
                  </div>
                )}
              </div>
              
              <div className="space-y-2">
                <Label className="text-muted-foreground text-sm">Issue Date</Label>
                {isEditingData ? (
                  <Input
                    type="date"
                    value={editedData.issueDate || ""}
                    onChange={(e) => handleEditField("issueDate", e.target.value)}
                  />
                ) : (
                  <div className="flex items-center">
                    <CalendarDays className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span className="font-medium">
                      {formatDate(extractedData.issueDate)}
                    </span>
                  </div>
                )}
              </div>
              
              <div className="space-y-2">
                <Label className="text-muted-foreground text-sm">Due Date</Label>
                {isEditingData ? (
                  <Input
                    type="date"
                    value={editedData.dueDate || ""}
                    onChange={(e) => handleEditField("dueDate", e.target.value)}
                  />
                ) : (
                  <div className="flex items-center">
                    <CalendarDays className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span className="font-medium">
                      {formatDate(extractedData.dueDate)}
                    </span>
                  </div>
                )}
              </div>
              
              <div className="space-y-2">
                <Label className="text-muted-foreground text-sm">Amount</Label>
                {isEditingData ? (
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      step="0.01"
                      value={editedData.amount || ""}
                      onChange={(e) => handleEditField("amount", parseFloat(e.target.value))}
                      placeholder="Enter amount"
                    />
                    <Select 
                      value={editedData.currency || "USD"} 
                      onValueChange={(value) => handleEditField("currency", value)}
                    >
                      <SelectTrigger className="w-24">
                        <SelectValue placeholder="Currency" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="USD">USD</SelectItem>
                        <SelectItem value="EUR">EUR</SelectItem>
                        <SelectItem value="GBP">GBP</SelectItem>
                        <SelectItem value="CAD">CAD</SelectItem>
                        <SelectItem value="JPY">JPY</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                ) : (
                  <div className="flex items-center">
                    <span className="font-medium">
                      {formatCurrency(extractedData.amount, extractedData.currency)}
                    </span>
                  </div>
                )}
              </div>
              
              <div className="space-y-2">
                <Label className="text-muted-foreground text-sm">Tax</Label>
                {isEditingData ? (
                  <Input
                    type="number"
                    step="0.01"
                    value={editedData.tax || ""}
                    onChange={(e) => handleEditField("tax", parseFloat(e.target.value))}
                    placeholder="Enter tax amount"
                  />
                ) : (
                  <div className="flex items-center">
                    <span className="font-medium">
                      {extractedData.tax ? formatCurrency(extractedData.tax, extractedData.currency) : "Not detected"}
                    </span>
                  </div>
                )}
              </div>
              
              {/* Custom fields */}
              {customFields.map(field => (
                <div key={field} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-muted-foreground text-sm">{field}</Label>
                    {isEditingData && (
                      <Button variant="ghost" size="icon" onClick={() => removeCustomField(field)}>
                        <X className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                  {isEditingData ? (
                    <Input
                      value={editedData[field] || ""}
                      onChange={(e) => handleEditField(field, e.target.value)}
                      placeholder={`Enter ${field.toLowerCase()}`}
                    />
                  ) : (
                    <div className="flex items-center">
                      <span className="font-medium">
                        {editedData[field] || "Not available"}
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
            
            {/* Custom field input in edit mode */}
            {isEditingData && (
              <div className="mt-4 border-t pt-4">
                <Label className="text-muted-foreground text-sm mb-2 block">Add Custom Field</Label>
                <div className="flex gap-2">
                  <Input
                    value={newCustomField}
                    onChange={(e) => setNewCustomField(e.target.value)}
                    placeholder="Enter field name"
                  />
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="icon"
                    onClick={addCustomField}
                    disabled={!newCustomField}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Add custom fields to track additional information for this invoice
                </p>
              </div>
            )}
            
            <div className="mt-6">
              <Label className="text-muted-foreground text-sm block mb-2">Line Items</Label>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Description</TableHead>
                    <TableHead className="text-right">Qty</TableHead>
                    <TableHead className="text-right">Unit Price</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    {isEditingData && (
                      <>
                        <TableHead className="text-right">Tax Rate</TableHead>
                        <TableHead className="text-right">Tax Amount</TableHead>
                        <TableHead className="text-right">Discount</TableHead>
                        <TableHead className="text-right">SKU</TableHead>
                        <TableHead></TableHead>
                      </>
                    )}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(editedData.items || extractedData.items || []).map((item: InvoiceLineItem, index: number) => (
                    <TableRow key={index}>
                      <TableCell>
                        {isEditingData ? (
                          <Input
                            value={item.description}
                            onChange={(e) => {
                              const updatedItems = [...(editedData.items || [])];
                              updatedItems[index] = { ...updatedItems[index], description: e.target.value };
                              handleEditField("items", updatedItems);
                            }}
                          />
                        ) : (
                          item.description
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {isEditingData ? (
                          <Input
                            type="number"
                            value={item.quantity}
                            onChange={(e) => {
                              const updatedItems = [...(editedData.items || [])];
                              updatedItems[index] = { ...updatedItems[index], quantity: parseFloat(e.target.value) };
                              handleEditField("items", updatedItems);
                            }}
                            className="w-20 ml-auto"
                          />
                        ) : (
                          item.quantity
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {isEditingData ? (
                          <Input
                            type="number"
                            step="0.01"
                            value={item.unitPrice}
                            onChange={(e) => {
                              const updatedItems = [...(editedData.items || [])];
                              updatedItems[index] = { ...updatedItems[index], unitPrice: parseFloat(e.target.value) };
                              handleEditField("items", updatedItems);
                            }}
                            className="w-24 ml-auto"
                          />
                        ) : (
                          formatCurrency(item.unitPrice, editedData.currency)
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {isEditingData ? (
                          <Input
                            type="number"
                            step="0.01"
                            value={item.totalPrice}
                            onChange={(e) => {
                              const updatedItems = [...(editedData.items || [])];
                              updatedItems[index] = { ...updatedItems[index], totalPrice: parseFloat(e.target.value) };
                              handleEditField("items", updatedItems);
                            }}
                            className="w-24 ml-auto"
                          />
                        ) : (
                          formatCurrency(item.totalPrice, editedData.currency)
                        )}
                      </TableCell>
                      
                      {isEditingData && (
                        <>
                          <TableCell className="text-right">
                            <Input
                              type="number"
                              step="0.01"
                              value={item.taxRate || ''}
                              onChange={(e) => {
                                const updatedItems = [...(editedData.items || [])];
                                updatedItems[index] = { 
                                  ...updatedItems[index], 
                                  taxRate: e.target.value ? parseFloat(e.target.value) : undefined 
                                };
                                handleEditField("items", updatedItems);
                              }}
                              className="w-20 ml-auto"
                              placeholder="%"
                            />
                          </TableCell>
                          <TableCell className="text-right">
                            <Input
                              type="number"
                              step="0.01"
                              value={item.taxAmount || ''}
                              onChange={(e) => {
                                const updatedItems = [...(editedData.items || [])];
                                updatedItems[index] = { 
                                  ...updatedItems[index], 
                                  taxAmount: e.target.value ? parseFloat(e.target.value) : undefined 
                                };
                                handleEditField("items", updatedItems);
                              }}
                              className="w-24 ml-auto"
                            />
                          </TableCell>
                          <TableCell className="text-right">
                            <Input
                              type="number"
                              step="0.01"
                              value={item.discount || ''}
                              onChange={(e) => {
                                const updatedItems = [...(editedData.items || [])];
                                updatedItems[index] = { 
                                  ...updatedItems[index], 
                                  discount: e.target.value ? parseFloat(e.target.value) : undefined 
                                };
                                handleEditField("items", updatedItems);
                              }}
                              className="w-24 ml-auto"
                            />
                          </TableCell>
                          <TableCell className="text-right">
                            <Input
                              value={item.productSku || ''}
                              onChange={(e) => {
                                const updatedItems = [...(editedData.items || [])];
                                updatedItems[index] = { 
                                  ...updatedItems[index], 
                                  productSku: e.target.value || undefined 
                                };
                                handleEditField("items", updatedItems);
                              }}
                              className="w-24 ml-auto"
                              placeholder="SKU"
                            />
                          </TableCell>
                          <TableCell>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="ml-auto" 
                              onClick={() => {
                                const updatedItems = (editedData.items || []).filter((_, i) => i !== index);
                                handleEditField("items", updatedItems);
                              }}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </>
                      )}
                    </TableRow>
                  ))}
                  {isEditingData && (
                    <TableRow>
                      <TableCell colSpan={isEditingData ? 9 : 5}>
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full"
                          onClick={() => {
                            const newItem: InvoiceLineItem = {
                              description: "",
                              quantity: 1,
                              unitPrice: 0,
                              totalPrice: 0
                            };
                            const updatedItems = [...(editedData.items || []), newItem];
                            handleEditField("items", updatedItems);
                          }}
                        >
                          <Plus className="h-3 w-3 mr-1" /> Add Item
                        </Button>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
            
            <div className="space-y-2 mt-4">
              <Label className="text-muted-foreground text-sm">Notes</Label>
              {isEditingData ? (
                <Textarea
                  value={editedData.notes || ""}
                  onChange={(e) => handleEditField("notes", e.target.value)}
                  placeholder="Enter notes"
                  rows={3}
                />
              ) : (
                extractedData.notes && (
                  <p className="text-sm">{extractedData.notes}</p>
                )
              )}
            </div>
            
            {isEditingData && (
              <div className="flex justify-end mt-4">
                <div className="flex items-center gap-2">
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setEditedData({ ...extractedData });
                      setIsEditingData(false);
                    }}
                  >
                    <X className="h-4 w-4 mr-2" />
                    Cancel
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      // Recalculate line item totals based on quantity and unit price
                      if (editedData.items && editedData.items.length > 0) {
                        const updatedItems = editedData.items.map(item => ({
                          ...item,
                          totalPrice: item.quantity * item.unitPrice
                        }));
                        handleEditField("items", updatedItems);
                      }
                    }}
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Recalculate
                  </Button>
                  <Button 
                    onClick={saveEditedData}
                    disabled={isPending}
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {isPending ? "Saving..." : "Save Changes"}
                  </Button>
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="category" className="space-y-6">
            <div className="mb-6">
              <Label className="text-muted-foreground text-sm block mb-2">AI-Suggested Categories</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {suggestedCategories.map((category, index) => (
                  <Badge 
                    key={index} 
                    variant="outline" 
                    className="cursor-pointer hover:bg-primary/10 flex items-center gap-1"
                    onClick={() => {
                      setSelectedCategory(category);
                      setIsNewCategory(false);
                    }}
                  >
                    <Tag className="h-3 w-3" />
                    {category}
                    {selectedCategory === category && !isNewCategory && (
                      <Check className="h-3 w-3 ml-1 text-green-500" />
                    )}
                  </Badge>
                ))}
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-muted-foreground text-sm">Select Existing Category</Label>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="flex items-center text-xs h-7 px-2"
                  onClick={() => {
                    setIsNewCategory(true);
                    setSelectedCategory("");
                  }}
                >
                  <PlusCircle className="h-3 w-3 mr-1" />
                  New Category
                </Button>
              </div>
              
              {!isNewCategory ? (
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    {existingCategories.map((category) => (
                      <SelectItem key={category.id} value={category.name}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <div className="space-y-2">
                  <Label htmlFor="new-category">New Category Name</Label>
                  <Input
                    id="new-category"
                    placeholder="Enter category name"
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                  />
                </div>
              )}
              
              <Button 
                onClick={saveCategory} 
                disabled={isPending || (!selectedCategory && !newCategoryName)}
                className="w-full"
              >
                {isPending ? "Saving..." : "Save Category"}
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="vendor" className="space-y-6">
            <div className="mb-6">
              <Label className="text-muted-foreground text-sm block mb-2">AI-Suggested Vendors</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {vendorSuggestions.map((vendor, index) => (
                  <Badge 
                    key={index} 
                    variant="outline" 
                    className="cursor-pointer hover:bg-primary/10 flex items-center gap-1"
                    onClick={() => {
                      setSelectedVendor(vendor);
                      setIsNewVendor(false);
                    }}
                  >
                    <Building className="h-3 w-3" />
                    {vendor}
                    {selectedVendor === vendor && !isNewVendor && (
                      <Check className="h-3 w-3 ml-1 text-green-500" />
                    )}
                  </Badge>
                ))}
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-muted-foreground text-sm">Select Existing Vendor</Label>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="flex items-center text-xs h-7 px-2"
                  onClick={() => {
                    setIsNewVendor(true);
                    setSelectedVendor("");
                    setNewVendorData({
                      name: extractedData.vendorName || "",
                      email: "",
                      phone: "",
                      website: "",
                      address: "",
                    });
                  }}
                >
                  <PlusCircle className="h-3 w-3 mr-1" />
                  New Vendor
                </Button>
              </div>
              
              {!isNewVendor ? (
                <Select value={selectedVendor} onValueChange={setSelectedVendor}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a vendor" />
                  </SelectTrigger>
                  <SelectContent>
                    {existingVendors.map((vendor) => (
                      <SelectItem key={vendor.id} value={vendor.name}>
                        {vendor.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="vendor-name">Vendor Name</Label>
                    <Input
                      id="vendor-name"
                      placeholder="Enter vendor name"
                      value={newVendorData.name}
                      onChange={(e) => setNewVendorData({...newVendorData, name: e.target.value})}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="vendor-email">Email (Optional)</Label>
                    <Input
                      id="vendor-email"
                      placeholder="Enter vendor email"
                      value={newVendorData.email}
                      onChange={(e) => setNewVendorData({...newVendorData, email: e.target.value})}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="vendor-phone">Phone (Optional)</Label>
                    <Input
                      id="vendor-phone"
                      placeholder="Enter vendor phone"
                      value={newVendorData.phone}
                      onChange={(e) => setNewVendorData({...newVendorData, phone: e.target.value})}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="vendor-website">Website (Optional)</Label>
                    <Input
                      id="vendor-website"
                      placeholder="Enter vendor website"
                      value={newVendorData.website}
                      onChange={(e) => setNewVendorData({...newVendorData, website: e.target.value})}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="vendor-address">Address (Optional)</Label>
                    <Input
                      id="vendor-address"
                      placeholder="Enter vendor address"
                      value={newVendorData.address}
                      onChange={(e) => setNewVendorData({...newVendorData, address: e.target.value})}
                    />
                  </div>
                </div>
              )}
              
              <Button 
                onClick={saveVendor} 
                disabled={isPending || (!selectedVendor && !newVendorData.name)}
                className="w-full"
              >
                {isPending ? "Saving..." : "Save Vendor"}
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
      
      {confidence < 0.7 && (
        <CardFooter className="bg-amber-50 border-t text-amber-800 dark:bg-amber-950/30 dark:text-amber-400 px-6 py-4">
          <div className="flex items-start gap-2">
            <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium">Low confidence detection</p>
              <p className="text-sm mt-1">
                The AI has lower confidence in some of the extracted data. Please review carefully and make corrections where needed.
              </p>
            </div>
          </div>
        </CardFooter>
      )}
    </Card>
  );
} 