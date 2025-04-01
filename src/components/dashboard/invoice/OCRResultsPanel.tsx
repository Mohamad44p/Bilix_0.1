"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
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
  Tag
} from "lucide-react";
import { ExtractedInvoiceData, Category, Vendor, InvoiceItem } from "@/lib/types";
import { updateInvoiceCategory, updateInvoiceVendor } from "@/lib/actions/invoice";
import { useToast } from "@/components/ui/use-toast";

interface OCRResultsPanelProps {
  invoiceId: string;
  extractedData: ExtractedInvoiceData;
  suggestedCategories: string[];
  vendorSuggestions: string[];
  existingCategories: Category[];
  existingVendors: Vendor[];
  onRefresh?: () => void;
}

export default function OCRResultsPanel({
  invoiceId,
  extractedData,
  suggestedCategories,
  vendorSuggestions,
  existingCategories,
  existingVendors,
  onRefresh,
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

  return (
    <Card className="mt-6">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-amber-500" />
            AI-Processed Invoice Data
          </CardTitle>
          {extractedData.language && (
            <Badge variant="outline" className="flex items-center gap-1">
              <Globe className="h-3 w-3" />
              {extractedData.language.toUpperCase()}
            </Badge>
          )}
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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-muted-foreground text-sm">Invoice Number</Label>
                <div className="flex items-center">
                  <Receipt className="h-4 w-4 mr-2 text-muted-foreground" />
                  <span className="font-medium">
                    {extractedData.invoiceNumber || "Not detected"}
                  </span>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label className="text-muted-foreground text-sm">Vendor</Label>
                <div className="flex items-center">
                  <Building className="h-4 w-4 mr-2 text-muted-foreground" />
                  <span className="font-medium">
                    {extractedData.vendorName || "Not detected"}
                  </span>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label className="text-muted-foreground text-sm">Issue Date</Label>
                <div className="flex items-center">
                  <CalendarDays className="h-4 w-4 mr-2 text-muted-foreground" />
                  <span className="font-medium">
                    {formatDate(extractedData.issueDate)}
                  </span>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label className="text-muted-foreground text-sm">Due Date</Label>
                <div className="flex items-center">
                  <CalendarDays className="h-4 w-4 mr-2 text-muted-foreground" />
                  <span className="font-medium">
                    {formatDate(extractedData.dueDate)}
                  </span>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label className="text-muted-foreground text-sm">Amount</Label>
                <div className="flex items-center">
                  <span className="font-medium">
                    {formatCurrency(extractedData.amount, extractedData.currency)}
                  </span>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label className="text-muted-foreground text-sm">Tax</Label>
                <div className="flex items-center">
                  <span className="font-medium">
                    {extractedData.tax ? formatCurrency(extractedData.tax, extractedData.currency) : "Not detected"}
                  </span>
                </div>
              </div>
            </div>
            
            {extractedData.items && extractedData.items.length > 0 && (
              <div className="mt-6">
                <Label className="text-muted-foreground text-sm block mb-2">Line Items</Label>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Description</TableHead>
                      <TableHead className="text-right">Qty</TableHead>
                      <TableHead className="text-right">Unit Price</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {extractedData.items.map((item: InvoiceItem, index: number) => (
                      <TableRow key={index}>
                        <TableCell>{item.description}</TableCell>
                        <TableCell className="text-right">{item.quantity}</TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(item.unitPrice, extractedData.currency)}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(item.totalPrice, extractedData.currency)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
            
            {extractedData.notes && (
              <div className="mt-4">
                <Label className="text-muted-foreground text-sm block mb-1">Notes</Label>
                <p className="text-sm">{extractedData.notes}</p>
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
    </Card>
  );
} 