"use client";
/* eslint-disable @next/next/no-img-element */
/* eslint-disable jsx-a11y/alt-text */

import { useState, useTransition, useEffect } from "react";
import {
  Upload,
  Check,
  File,
  Image,
  Table,
  FileText,
  AlertTriangle,
  Sparkles,
  Loader2,
  RefreshCw
} from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table as UITable,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/components/ui/use-toast";
import { uploadInvoice, processInvoiceOCR, getUserCategories, getUserVendors } from "@/lib/actions/invoice";
import OCRResultsPanel from "../invoice/OCRResultsPanel";
import { OCRResult, Category, Vendor } from "@/lib/types";

const InvoiceUpload = () => {
  const [dragging, setDragging] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<{
    name: string;
    id: string;
    status: 'uploading' | 'processing' | 'completed' | 'error';
    url: string;
  }[]>([]);
  const [isPending, startTransition] = useTransition();
  const [selectedInvoice, setSelectedInvoice] = useState<string | null>(null);
  const [ocrResults, setOcrResults] = useState<{
    [key: string]: OCRResult & { vendorSuggestions: string[] };
  }>({});
  const [categories, setCategories] = useState<Category[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  
  const { toast } = useToast();

  // Load categories and vendors
  useEffect(() => {
    const loadData = async () => {
      try {
        const [categoriesData, vendorsData] = await Promise.all([
          getUserCategories(),
          getUserVendors()
        ]);
        
        setCategories(categoriesData);
        setVendors(vendorsData);
      } catch (error) {
        console.error("Error loading data:", error);
      }
    };
    
    loadData();
  }, []);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(true);
  };

  const handleDragLeave = () => {
    setDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const files = Array.from(e.dataTransfer.files);
      
      // Upload each file
      files.forEach(file => {
        handleFileUpload(file);
      });
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files);
      
      // Upload each file
      files.forEach(file => {
        handleFileUpload(file);
      });
    }
  };

  const handleFileUpload = (file: File) => {
    // Generate temporary ID for tracking
    const tempId = Math.random().toString(36).substring(2, 9);
    
    // Add file to the list with uploading status
    setUploadedFiles(prev => [
      ...prev, 
      { 
        name: file.name, 
        id: tempId, 
        status: 'uploading',
        url: ''
      }
    ]);
    
    const formData = new FormData();
    formData.append("file", file);
    
    startTransition(async () => {
      try {
        // Upload the invoice
        const invoice = await uploadInvoice(formData);
        
        // Update status to processing
        setUploadedFiles(prev => prev.map(f => 
          f.id === tempId 
            ? { 
                ...f, 
                id: invoice.id, 
                status: 'processing',
                url: invoice.originalFileUrl || ''
              } 
            : f
        ));
        
        // Process with OCR
        const result = await processInvoiceOCR(invoice.id, invoice.originalFileUrl || '');
        
        // Update status to completed
        setUploadedFiles(prev => prev.map(f => 
          f.id === invoice.id 
            ? { ...f, status: 'completed' } 
            : f
        ));
        
        // Store OCR results
        setOcrResults(prev => ({
          ...prev,
          [invoice.id]: result
        }));
        
        // Select the invoice to show OCR results
        setSelectedInvoice(invoice.id);
        
        toast({
          title: "Invoice processed",
          description: `Successfully processed ${file.name}`,
        });
      } catch (error) {
        console.error("Error uploading file:", error);
        
        // Update status to error
        setUploadedFiles(prev => prev.map(f => 
          f.id === tempId 
            ? { ...f, status: 'error' } 
            : f
        ));
        
        toast({
          title: "Processing failed",
          description: `Failed to process ${file.name}`,
          variant: "destructive",
        });
      }
    });
  };

  const handleRetryProcessing = (invoiceId: string, fileUrl: string) => {
    if (!fileUrl) {
      toast({
        title: "Error",
        description: "No file URL available for processing",
        variant: "destructive",
      });
      return;
    }
    
    // Update status to processing
    setUploadedFiles(prev => prev.map(f => 
      f.id === invoiceId 
        ? { ...f, status: 'processing' } 
        : f
    ));
    
    startTransition(async () => {
      try {
        // Process with OCR
        const result = await processInvoiceOCR(invoiceId, fileUrl);
        
        // Update status to completed
        setUploadedFiles(prev => prev.map(f => 
          f.id === invoiceId 
            ? { ...f, status: 'completed' } 
            : f
        ));
        
        // Store OCR results
        setOcrResults(prev => ({
          ...prev,
          [invoiceId]: result
        }));
        
        // Select the invoice to show OCR results
        setSelectedInvoice(invoiceId);
        
        toast({
          title: "Invoice processed",
          description: "Successfully processed invoice",
        });
      } catch (error) {
        console.error("Error processing invoice:", error);
        
        // Update status to error
        setUploadedFiles(prev => prev.map(f => 
          f.id === invoiceId 
            ? { ...f, status: 'error' } 
            : f
        ));
        
        toast({
          title: "Processing failed",
          description: "Failed to process invoice",
          variant: "destructive",
        });
      }
    });
  };

  const handleRefreshData = async () => {
    try {
      const [categoriesData, vendorsData] = await Promise.all([
        getUserCategories(),
        getUserVendors()
      ]);
      
      setCategories(categoriesData);
      setVendors(vendorsData);
      
      toast({
        title: "Data refreshed",
        description: "Categories and vendors have been refreshed",
      });
    } catch (error) {
      console.error("Error refreshing data:", error);
      toast({
        title: "Refresh failed",
        description: "Failed to refresh data",
        variant: "destructive",
      });
    }
  };

  // Get status badge for a file
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'uploading':
        return (
          <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100 border-blue-200">
            <div className="flex items-center gap-1">
              <Loader2 className="h-3 w-3 animate-spin" />
              <span>Uploading</span>
            </div>
          </Badge>
        );
      case 'processing':
        return (
          <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100 border-amber-200">
            <div className="flex items-center gap-1">
              <Sparkles className="h-3 w-3" />
              <span>Processing</span>
            </div>
          </Badge>
        );
      case 'completed':
        return (
          <Badge className="bg-green-100 text-green-800 hover:bg-green-100 border-green-200">
            <div className="flex items-center gap-1">
              <Check className="h-3 w-3" />
              <span>Completed</span>
            </div>
          </Badge>
        );
      case 'error':
        return (
          <Badge className="bg-red-100 text-red-800 hover:bg-red-100 border-red-200">
            <div className="flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" />
              <span>Error</span>
            </div>
          </Badge>
        );
      default:
        return null;
    }
  };

  return (
    <DashboardLayout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Invoice Upload</h1>
          <p className="text-muted-foreground">
            Upload and manage your invoices with AI-powered processing
          </p>
        </div>
        <Button variant="outline" onClick={handleRefreshData} disabled={isPending}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh Data
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Upload Invoices</CardTitle>
              <CardDescription>
                Upload invoices for AI processing and data extraction
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="file" className="w-full">
                <TabsList className="grid grid-cols-3 mb-4">
                  <TabsTrigger value="file">File Upload</TabsTrigger>
                  <TabsTrigger value="email">Email Integration</TabsTrigger>
                  <TabsTrigger value="software">
                    Accounting Software
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="file" className="space-y-4">
                  <div
                    className={`border-2 border-dashed rounded-lg p-8 text-center ${
                      dragging ? "border-primary bg-primary/5" : "border-border"
                    }`}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                  >
                    <div className="flex flex-col items-center justify-center gap-2">
                      <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                        {isPending ? (
                          <Loader2 className="h-6 w-6 text-primary animate-spin" />
                        ) : (
                          <Upload className="h-6 w-6 text-primary" />
                        )}
                      </div>
                      <h3 className="text-lg font-medium">
                        Drag and drop your invoice files
                      </h3>
                      <p className="text-sm text-muted-foreground mb-3">
                        Support for PDF, JPG, PNG, Excel and CSV files up to
                        10MB
                      </p>
                      <div className="flex flex-wrap justify-center gap-2 mb-3">
                        <Badge
                          variant="outline"
                          className="flex items-center gap-1"
                        >
                          <FileText className="h-3 w-3" /> PDF
                        </Badge>
                        <Badge
                          variant="outline"
                          className="flex items-center gap-1"
                        >
                          <Image className="h-3 w-3" /> JPG/PNG
                        </Badge>
                        <Badge
                          variant="outline"
                          className="flex items-center gap-1"
                        >
                          <Table className="h-3 w-3" /> Excel/CSV
                        </Badge>
                      </div>
                      <div>
                        <Label htmlFor="file-upload" className="cursor-pointer">
                          <div className="bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-medium">
                            {isPending ? "Uploading..." : "Select Files"}
                          </div>
                          <Input
                            id="file-upload"
                            type="file"
                            className="hidden"
                            onChange={handleFileChange}
                            multiple
                            accept=".pdf,.jpg,.jpeg,.png,.xlsx,.xls,.csv"
                            disabled={isPending}
                          />
                        </Label>
                      </div>
                    </div>
                  </div>

                  {uploadedFiles.length > 0 && (
                    <Card className="mt-4">
                      <CardHeader className="py-3">
                        <CardTitle className="text-base">
                          Uploaded Files
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-0">
                        <UITable>
                          <TableHeader>
                            <TableRow>
                              <TableHead>File Name</TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead className="text-right">
                                Actions
                              </TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {uploadedFiles.map((file) => (
                              <TableRow 
                                key={file.id}
                                className={selectedInvoice === file.id ? "bg-muted/50" : ""}
                              >
                                <TableCell className="font-medium">
                                  <div className="flex items-center gap-2">
                                    <File className="h-4 w-4 text-muted-foreground" />
                                    {file.name}
                                  </div>
                                </TableCell>
                                <TableCell>
                                  {getStatusBadge(file.status)}
                                </TableCell>
                                <TableCell className="text-right">
                                  {file.status === 'completed' && (
                                    <Button 
                                      variant="ghost" 
                                      size="sm"
                                      onClick={() => setSelectedInvoice(file.id)}
                                    >
                                      View
                                    </Button>
                                  )}
                                  {file.status === 'error' && (
                                    <Button 
                                      variant="ghost" 
                                      size="sm"
                                      onClick={() => handleRetryProcessing(file.id, file.url)}
                                      disabled={isPending}
                                    >
                                      <RefreshCw className="h-3 w-3 mr-1" />
                                      Retry
                                    </Button>
                                  )}
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-red-500"
                                    onClick={() => {
                                      setUploadedFiles(prev => 
                                        prev.filter(f => f.id !== file.id)
                                      );
                                      if (selectedInvoice === file.id) {
                                        setSelectedInvoice(null);
                                      }
                                    }}
                                  >
                                    Remove
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </UITable>
                      </CardContent>
                    </Card>
                  )}

                  {selectedInvoice && ocrResults[selectedInvoice] && (
                    <OCRResultsPanel
                      invoiceId={selectedInvoice}
                      extractedData={ocrResults[selectedInvoice].extractedData}
                      suggestedCategories={ocrResults[selectedInvoice].suggestedCategories}
                      vendorSuggestions={ocrResults[selectedInvoice].vendorSuggestions}
                      existingCategories={categories}
                      existingVendors={vendors}
                      onRefresh={handleRefreshData}
                    />
                  )}
                </TabsContent>

                <TabsContent value="email" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">
                        Email Integration
                      </CardTitle>
                      <CardDescription>
                        Connect your email account to automatically fetch
                        invoices
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="email">Email Address</Label>
                        <Input id="email" placeholder="your@email.com" />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="provider">Email Provider</Label>
                        <Select defaultValue="gmail">
                          <SelectTrigger id="provider">
                            <SelectValue placeholder="Select provider" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="gmail">Gmail</SelectItem>
                            <SelectItem value="outlook">Outlook</SelectItem>
                            <SelectItem value="yahoo">Yahoo</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="pt-2">
                        <Button>Connect Email Account</Button>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="software" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">
                        Connect Accounting Software
                      </CardTitle>
                      <CardDescription>
                        Integrate with your existing accounting tools
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <button className="border rounded-lg p-4 flex flex-col items-center hover:border-primary hover:bg-primary/5 transition-colors">
                          <img
                            src="https://placeholder.pics/svg/80x80/DEDEDE/555555/xero"
                            className="h-16 w-16 mb-2"
                            alt="Xero"
                          />
                          <span className="font-medium">Xero</span>
                        </button>

                        <button className="border rounded-lg p-4 flex flex-col items-center hover:border-primary hover:bg-primary/5 transition-colors">
                          <img
                            src="https://placeholder.pics/svg/80x80/DEDEDE/555555/quickbooks"
                            className="h-16 w-16 mb-2"
                            alt="QuickBooks"
                          />
                          <span className="font-medium">QuickBooks</span>
                        </button>

                        <button className="border rounded-lg p-4 flex flex-col items-center hover:border-primary hover:bg-primary/5 transition-colors">
                          <img
                            src="https://placeholder.pics/svg/80x80/DEDEDE/555555/zoho"
                            className="h-16 w-16 mb-2"
                            alt="Zoho"
                          />
                          <span className="font-medium">Zoho Books</span>
                        </button>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>

        <div>
          <Card className="h-full flex flex-col">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center">
                  <Sparkles className="h-4 w-4 mr-2 text-amber-500" />
                  AI Processing
                </CardTitle>
                <Badge variant="outline" className="bg-amber-100 text-amber-800">AI-Powered</Badge>
              </div>
              <CardDescription>
                Automated invoice processing features
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 flex-1">
              <div className="space-y-4">
                <div className="border rounded-lg p-4 bg-gradient-to-r from-blue-50 to-blue-50/30 dark:from-blue-950/50 dark:to-blue-950/20">
                  <div className="flex items-start gap-3">
                    <div className="h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center flex-shrink-0">
                      <Check className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <h3 className="font-medium">Automated Data Extraction</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        Our AI automatically extracts key information from
                        invoices including vendor, amount, date, and line items.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="border rounded-lg p-4 bg-gradient-to-r from-purple-50 to-purple-50/30 dark:from-purple-950/50 dark:to-purple-950/20">
                  <div className="flex items-start gap-3">
                    <div className="h-8 w-8 rounded-full bg-purple-100 dark:bg-purple-900/50 flex items-center justify-center flex-shrink-0">
                      <Check className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div>
                      <h3 className="font-medium">Invoice Classification</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        Automatically categorize invoices by vendor, department,
                        and expense type for better financial tracking.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="border rounded-lg p-4 bg-gradient-to-r from-green-50 to-green-50/30 dark:from-green-950/50 dark:to-green-950/20">
                  <div className="flex items-start gap-3">
                    <div className="h-8 w-8 rounded-full bg-green-100 dark:bg-green-900/50 flex items-center justify-center flex-shrink-0">
                      <Check className="h-4 w-4 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <h3 className="font-medium">Multi-language Support</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        Process invoices in multiple languages with automatic
                        translation and data extraction.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="border rounded-lg p-4 bg-gradient-to-r from-amber-50 to-amber-50/30 dark:from-amber-950/50 dark:to-amber-950/20">
                  <div className="flex items-start gap-3">
                    <div className="h-8 w-8 rounded-full bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center flex-shrink-0">
                      <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                    </div>
                    <div>
                      <h3 className="font-medium">Fraud Detection</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        AI identifies potential duplicate invoices or suspicious
                        patterns to prevent fraud.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="p-4 pt-0 mt-auto">
              <Button className="w-full">
                <Sparkles className="mr-2 h-4 w-4" />
                Configure AI Settings
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default InvoiceUpload;
