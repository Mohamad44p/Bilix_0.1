"use client";
/* eslint-disable @next/next/no-img-element */
/* eslint-disable jsx-a11y/alt-text */

import { useState, useTransition, useEffect, useRef } from "react";
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
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";

const InvoiceUpload = () => {
  const [dragging, setDragging] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<{
    name: string;
    id: string;
    status: 'uploading' | 'processing' | 'completed' | 'error';
    url: string;
    fileType?: string;
    fileSize?: number;
  }[]>([]);
  const [isPending, startTransition] = useTransition();
  const [selectedInvoice, setSelectedInvoice] = useState<string | null>(null);
  const [ocrResults, setOcrResults] = useState<{
    [key: string]: OCRResult & { vendorSuggestions: string[] };
  }>({});
  const [categories, setCategories] = useState<Category[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  
  const { toast } = useToast();

  // Email integration states
  const [emailProvider, setEmailProvider] = useState("gmail");
  const [emailAddress, setEmailAddress] = useState("");
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [emailSyncProgress, setEmailSyncProgress] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncResults, setSyncResults] = useState<{
    found: number;
    processed: number;
    failed: number;
    invoices: Array<{id: string; subject: string; from: string; date: string; status: string;}>;
  }>({
    found: 0,
    processed: 0,
    failed: 0,
    invoices: []
  });

  // Add these state variables
  const [selectedSoftware, setSelectedSoftware] = useState<string | null>(null);
  const [integrationsStatus, setIntegrationsStatus] = useState<Record<string, {
    connected: boolean;
    lastSync?: string;
    invoiceCount?: number;
  }>>({
    xero: { connected: false },
    quickbooks: { connected: false },
    zoho: { connected: false },
    freshbooks: { connected: false }
  });
  const [isSyncingSoftware, setIsSyncingSoftware] = useState(false);
  const [softwareSyncProgress, setSoftwareSyncProgress] = useState(0);

  // Add bulk upload state variables
  const [bulkUpload, setBulkUpload] = useState<{
    totalFiles: number;
    processedFiles: number;
    failedFiles: number;
    inProgress: boolean;
    progress: number;
  }>({
    totalFiles: 0,
    processedFiles: 0,
    failedFiles: 0,
    inProgress: false,
    progress: 0
  });

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
      
      // Use bulk upload if there are multiple files
      if (files.length > 1) {
        processBulkUpload(files);
      } else {
        // Single file, use regular upload
        handleFileUpload(files[0]);
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files);
      
      // Use bulk upload if there are multiple files
      if (files.length > 1) {
        processBulkUpload(files);
      } else {
        // Single file, use regular upload
        handleFileUpload(files[0]);
      }
    }
  };

  const handleFileUpload = (file: File) => {
    // Check file type and size
    const validTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/tiff', 
      'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/csv'];
    
    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    const fileType = file.type;
    
    // Allow files that might have incorrect MIME types but valid extensions
    const validExtensions = ['pdf', 'jpg', 'jpeg', 'png', 'tiff', 'tif', 'xls', 'xlsx', 'csv'];
    const isValidExtension = fileExtension && validExtensions.includes(fileExtension);
    const isValidType = validTypes.includes(fileType);
    
    if (!isValidType && !isValidExtension) {
      toast({
        title: "Invalid file type",
        description: `${file.name} is not a supported file type. Please upload PDF, image, or spreadsheet files.`,
        variant: "destructive",
      });
      return;
    }
    
    // Check file size (10MB max)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      toast({
        title: "File too large",
        description: `${file.name} exceeds the 10MB size limit.`,
        variant: "destructive",
      });
      return;
    }

    // Generate temporary ID for tracking
    const tempId = Math.random().toString(36).substring(2, 9);
    
    // Add file to the list with uploading status
    setUploadedFiles(prev => [
      ...prev, 
      { 
        name: file.name, 
        id: tempId, 
        status: 'uploading',
        url: '',
        fileType: fileType || `application/${fileExtension}`,
        fileSize: file.size
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

  // Simulate email connection
  const connectEmailAccount = async () => {
    if (!emailAddress.trim() || !emailProvider) {
      toast({
        title: "Invalid input",
        description: "Please enter a valid email address and select a provider",
        variant: "destructive",
      });
      return;
    }
    
    // Simple email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailAddress)) {
      toast({
        title: "Invalid email",
        description: "Please enter a valid email address",
        variant: "destructive",
      });
      return;
    }
    
    setIsConnecting(true);
    setConnectionError(null);
    
    try {
      // Simulate connection delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Simulate success or failure based on pattern
      const shouldFail = emailAddress.includes("fail") || emailAddress.includes("error");
      
      if (shouldFail) {
        throw new Error("Could not connect to email account. Please check your credentials.");
      }
      
      setIsConnected(true);
      toast({
        title: "Connected",
        description: `Successfully connected to ${emailAddress}`,
      });
      
    } catch (error) {
      console.error("Email connection error:", error);
      setConnectionError(error instanceof Error ? error.message : "Unknown connection error");
      toast({
        title: "Connection failed",
        description: error instanceof Error ? error.message : "Failed to connect to email account",
        variant: "destructive",
      });
    } finally {
      setIsConnecting(false);
    }
  };
  
  // Sync emails to find invoices
  const syncEmailInvoices = async () => {
    if (!isConnected) {
      toast({
        title: "Not connected",
        description: "Please connect your email account first",
        variant: "destructive",
      });
      return;
    }
    
    setIsSyncing(true);
    setEmailSyncProgress(0);
    
    // Reset results
    setSyncResults({
      found: 0,
      processed: 0,
      failed: 0,
      invoices: []
    });
    
    try {
      // Simulate finding invoices in email
      const totalSteps = 10;
      
      // Step 1: Connect to mailbox
      setEmailSyncProgress(10);
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Step 2: Search for potential invoices
      setEmailSyncProgress(20);
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Generate random number of found invoices (5-15)
      const foundCount = Math.floor(Math.random() * 10) + 5;
      
      // Step 3-8: Process each invoice
      for (let i = 0; i < foundCount; i++) {
        setEmailSyncProgress(30 + Math.floor((i / foundCount) * 60));
        await new Promise(resolve => setTimeout(resolve, 300));
        
        // Update progress with current invoice
        setSyncResults(prev => {
          const processed = prev.processed + 1;
          const failed = Math.random() > 0.8 ? prev.failed + 1 : prev.failed; // 20% chance of failure
          
          // Generate a mock invoice
          const mockInvoice = {
            id: `email-inv-${i}`,
            subject: `Invoice #${Math.floor(Math.random() * 10000)}`,
            from: ["Amazon", "Microsoft", "Google", "Apple", "Adobe", "Dropbox"][Math.floor(Math.random() * 6)],
            date: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toLocaleDateString(),
            status: Math.random() > 0.2 ? "success" : "error"
          };
          
          return {
            found: foundCount,
            processed,
            failed,
            invoices: [...prev.invoices, mockInvoice]
          };
        });
      }
      
      // Step 9-10: Finalize
      setEmailSyncProgress(100);
      
      toast({
        title: "Sync complete",
        description: `Found ${foundCount} invoices in your email`,
      });
      
    } catch (error) {
      console.error("Email sync error:", error);
      toast({
        title: "Sync failed",
        description: error instanceof Error ? error.message : "Failed to sync email invoices",
        variant: "destructive",
      });
    } finally {
      setIsSyncing(false);
    }
  };

  // Function to handle accounting software connection
  const connectToAccountingSoftware = async (software: string) => {
    setSelectedSoftware(software);
    
    // In a real implementation, this would redirect to the OAuth flow
    // For our demo, we'll simulate a successful connection
    try {
      toast({
        title: "Connecting",
        description: `Connecting to ${software}...`,
      });
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Update integration status
      setIntegrationsStatus(prev => ({
        ...prev,
        [software]: {
          connected: true,
          lastSync: new Date().toLocaleString(),
          invoiceCount: 0
        }
      }));
      
      toast({
        title: "Connected",
        description: `Successfully connected to ${software}`,
      });
    } catch (error) {
      console.error(`Error connecting to ${software}:`, error);
      toast({
        title: "Connection failed",
        description: `Failed to connect to ${software}`,
        variant: "destructive",
      });
    }
  };

  // Function to sync with accounting software
  const syncWithAccountingSoftware = async (software: string) => {
    if (!integrationsStatus[software]?.connected) {
      toast({
        title: "Not connected",
        description: `Please connect to ${software} first`,
        variant: "destructive",
      });
      return;
    }
    
    setIsSyncingSoftware(true);
    setSoftwareSyncProgress(0);
    
    try {
      // Simulate sync process
      for (let i = 0; i <= 10; i++) {
        setSoftwareSyncProgress(i * 10);
        await new Promise(resolve => setTimeout(resolve, 300));
      }
      
      // Generate random number of synced invoices (5-20)
      const syncedCount = Math.floor(Math.random() * 15) + 5;
      
      // Update integration status
      setIntegrationsStatus(prev => ({
        ...prev,
        [software]: {
          ...prev[software],
          lastSync: new Date().toLocaleString(),
          invoiceCount: syncedCount
        }
      }));
      
      toast({
        title: "Sync complete",
        description: `Synchronized ${syncedCount} invoices from ${software}`,
      });
    } catch (error) {
      console.error(`Error syncing with ${software}:`, error);
      toast({
        title: "Sync failed",
        description: `Failed to sync with ${software}`,
        variant: "destructive",
      });
    } finally {
      setIsSyncingSoftware(false);
    }
  };

  // Disconnect from accounting software
  const disconnectFromAccountingSoftware = (software: string) => {
    setIntegrationsStatus(prev => ({
      ...prev,
      [software]: {
        connected: false
      }
    }));
    
    toast({
      title: "Disconnected",
      description: `Disconnected from ${software}`,
    });
  };

  // Modify file upload handler to work with bulk uploads
  const processBulkUpload = async (files: File[]) => {
    if (files.length === 0) return;
    
    setBulkUpload({
      totalFiles: files.length,
      processedFiles: 0,
      failedFiles: 0,
      inProgress: true,
      progress: 0
    });
    
    const validFiles: File[] = [];
    const invalidFiles: string[] = [];
    
    // Validate all files first
    for (const file of files) {
      const fileExtension = file.name.split('.').pop()?.toLowerCase();
      const fileType = file.type;
      
      const validExtensions = ['pdf', 'jpg', 'jpeg', 'png', 'tiff', 'tif', 'xls', 'xlsx', 'csv'];
      const isValidExtension = fileExtension && validExtensions.includes(fileExtension);
      
      const validTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/tiff', 
        'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'text/csv'];
      const isValidType = validTypes.includes(fileType);
      
      if (!isValidType && !isValidExtension) {
        invalidFiles.push(file.name);
      } else if (file.size > 10 * 1024 * 1024) { // 10MB
        invalidFiles.push(`${file.name} (exceeds size limit)`);
      } else {
        validFiles.push(file);
      }
    }
    
    // Report invalid files
    if (invalidFiles.length > 0) {
      toast({
        title: `${invalidFiles.length} invalid file(s)`,
        description: invalidFiles.slice(0, 3).join(", ") + 
                     (invalidFiles.length > 3 ? ` and ${invalidFiles.length - 3} more...` : ""),
        variant: "destructive",
      });
    }
    
    // No valid files to process
    if (validFiles.length === 0) {
      setBulkUpload(prev => ({
        ...prev,
        inProgress: false
      }));
      return;
    }
    
    // Update UI with valid files count
    setBulkUpload(prev => ({
      ...prev,
      totalFiles: validFiles.length
    }));
    
    // Process files sequentially
    for (let i = 0; i < validFiles.length; i++) {
      const file = validFiles[i];
      const progressPerFile = 100 / validFiles.length;
      const baseProgress = (i / validFiles.length) * 100;
      
      // Generate temporary ID for tracking
      const tempId = Math.random().toString(36).substring(2, 9);
      
      // Add file to the list with uploading status
      setUploadedFiles(prev => [
        ...prev, 
        { 
          name: file.name, 
          id: tempId, 
          status: 'uploading',
          url: '',
          fileType: file.type || `application/${file.name.split('.').pop()?.toLowerCase()}`,
          fileSize: file.size
        }
      ]);
      
      try {
        // Update bulk progress
        setBulkUpload(prev => ({
          ...prev,
          progress: baseProgress + (progressPerFile * 0.3), // 30% for upload
        }));
        
        // Create form data for upload
        const formData = new FormData();
        formData.append("file", file);
        
        // Upload the invoice
        const invoice = await uploadInvoice(formData);
        
        // Update file status to processing
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
        
        // Update bulk progress
        setBulkUpload(prev => ({
          ...prev,
          progress: baseProgress + (progressPerFile * 0.6), // 60% for OCR
        }));
        
        // Process with OCR
        const result = await processInvoiceOCR(invoice.id, invoice.originalFileUrl || '');
        
        // Update file status to completed
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
        
        // Update bulk progress and processed count
        setBulkUpload(prev => ({
          ...prev,
          processedFiles: prev.processedFiles + 1,
          progress: baseProgress + progressPerFile
        }));
        
      } catch (error) {
        console.error(`Error processing file ${file.name}:`, error);
        
        // Update status to error
        setUploadedFiles(prev => prev.map(f => 
          f.id === tempId 
            ? { ...f, status: 'error' } 
            : f
        ));
        
        // Update failed count
        setBulkUpload(prev => ({
          ...prev,
          failedFiles: prev.failedFiles + 1,
          progress: baseProgress + progressPerFile
        }));
      }
    }
    
    // All files processed
    setBulkUpload(prev => ({
      ...prev,
      inProgress: false
    }));
    
    // Show completion toast
    toast({
      title: "Bulk upload complete",
      description: `Successfully processed ${bulkUpload.processedFiles} of ${bulkUpload.totalFiles} files.`,
    });
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
                                    {file.fileType?.includes('pdf') ? (
                                      <FileText className="h-4 w-4 text-red-500" />
                                    ) : file.fileType?.includes('image') ? (
                                      <Image className="h-4 w-4 text-blue-500" />
                                    ) : file.fileType?.includes('excel') || file.fileType?.includes('spreadsheet') || file.fileType?.includes('csv') ? (
                                      <Table className="h-4 w-4 text-green-500" />
                                    ) : (
                                      <File className="h-4 w-4 text-muted-foreground" />
                                    )}
                                    <span>{file.name}</span>
                                    {file.fileSize && (
                                      <span className="text-xs text-muted-foreground">
                                        ({(file.fileSize / (1024 * 1024)).toFixed(2)} MB)
                                      </span>
                                    )}
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

                  {bulkUpload.inProgress && (
                    <div className="mt-4 w-full">
                      <div className="flex justify-between text-sm mb-1">
                        <span>
                          Processing {bulkUpload.processedFiles} of {bulkUpload.totalFiles} files
                          {bulkUpload.failedFiles > 0 && ` (${bulkUpload.failedFiles} failed)`}
                        </span>
                        <span>{Math.round(bulkUpload.progress)}%</span>
                      </div>
                      <Progress 
                        value={bulkUpload.progress} 
                        className={`h-2 ${bulkUpload.failedFiles > 0 ? 'bg-amber-100' : ''}`}
                      />
                    </div>
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
                        <Input 
                          id="email" 
                          placeholder="your@email.com" 
                          value={emailAddress}
                          onChange={(e) => setEmailAddress(e.target.value)}
                          disabled={isConnecting || isConnected}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="provider">Email Provider</Label>
                        <Select 
                          value={emailProvider} 
                          onValueChange={setEmailProvider}
                          disabled={isConnecting || isConnected}
                        >
                          <SelectTrigger id="provider">
                            <SelectValue placeholder="Select provider" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="gmail">Gmail</SelectItem>
                            <SelectItem value="outlook">Outlook</SelectItem>
                            <SelectItem value="yahoo">Yahoo</SelectItem>
                            <SelectItem value="imap">Other (IMAP)</SelectItem>
                          </SelectContent>
                        </Select>
                        {emailProvider === "imap" && (
                          <div className="mt-4 space-y-2">
                            <Label htmlFor="imap-server">IMAP Server</Label>
                            <Input id="imap-server" placeholder="imap.example.com" />
                            
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <Label htmlFor="imap-port">Port</Label>
                                <Input id="imap-port" placeholder="993" />
                              </div>
                              <div className="flex items-end">
                                <div className="flex items-center space-x-2">
                                  <Checkbox id="use-ssl" />
                                  <Label htmlFor="use-ssl">Use SSL</Label>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      {connectionError && (
                        <div className="bg-red-50 border border-red-200 rounded-md p-3 text-red-800 dark:bg-red-950/30 dark:border-red-900 dark:text-red-400">
                          <div className="flex items-center gap-2">
                            <AlertTriangle className="h-4 w-4" />
                            <p className="text-sm font-medium">Connection failed</p>
                          </div>
                          <p className="text-sm mt-1">{connectionError}</p>
                        </div>
                      )}

                      <div className="pt-2 flex flex-col md:flex-row gap-2">
                        {!isConnected ? (
                          <Button 
                            onClick={connectEmailAccount}
                            disabled={isConnecting || !emailAddress}
                            className="flex-1"
                          >
                            {isConnecting ? (
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : null}
                            {isConnecting ? "Connecting..." : "Connect Email Account"}
                          </Button>
                        ) : (
                          <>
                            <Button 
                              variant="outline" 
                              onClick={() => setIsConnected(false)}
                              className="flex-1"
                              disabled={isSyncing}
                            >
                              Disconnect
                            </Button>
                            <Button 
                              onClick={syncEmailInvoices}
                              disabled={isSyncing}
                              className="flex-1"
                            >
                              {isSyncing ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              ) : null}
                              {isSyncing ? "Syncing..." : "Sync Invoices"}
                            </Button>
                          </>
                        )}
                      </div>
                    </CardContent>
                    
                    {isConnected && (
                      <CardFooter className="border-t pt-4 flex flex-col items-stretch">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                          <span className="text-sm">Connected to {emailAddress}</span>
                        </div>
                        
                        {isSyncing && (
                          <div className="w-full space-y-1 mb-4">
                            <div className="flex justify-between text-xs text-muted-foreground">
                              <span>Searching for invoices...</span>
                              <span>{emailSyncProgress}%</span>
                            </div>
                            <Progress value={emailSyncProgress} className="h-1" />
                          </div>
                        )}
                        
                        {syncResults.found > 0 && (
                          <div className="space-y-3 mt-2">
                            <div className="flex justify-between text-sm">
                              <div>Found: <span className="font-medium">{syncResults.found}</span></div>
                              <div>Processed: <span className="font-medium">{syncResults.processed}</span></div>
                              {syncResults.failed > 0 && (
                                <div className="text-red-500">Failed: <span className="font-medium">{syncResults.failed}</span></div>
                              )}
                            </div>
                            
                            {syncResults.invoices.length > 0 && (
                              <div className="border rounded-md overflow-hidden">
                                <Table>
                                  <TableHeader>
                                    <TableRow>
                                      <TableHead>From</TableHead>
                                      <TableHead>Subject</TableHead>
                                      <TableHead>Date</TableHead>
                                      <TableHead>Status</TableHead>
                                    </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                    {syncResults.invoices.slice(0, 5).map((invoice) => (
                                      <TableRow key={invoice.id}>
                                        <TableCell className="font-medium">{invoice.from}</TableCell>
                                        <TableCell>{invoice.subject}</TableCell>
                                        <TableCell>{invoice.date}</TableCell>
                                        <TableCell>
                                          {invoice.status === "success" ? (
                                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                              <Check className="h-3 w-3 mr-1" /> Processed
                                            </Badge>
                                          ) : (
                                            <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                                              <AlertTriangle className="h-3 w-3 mr-1" /> Failed
                                            </Badge>
                                          )}
                                        </TableCell>
                                      </TableRow>
                                    ))}
                                  </TableBody>
                                </Table>
                                
                                {syncResults.invoices.length > 5 && (
                                  <div className="p-2 text-center text-sm text-muted-foreground border-t">
                                    + {syncResults.invoices.length - 5} more invoices
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        )}
                      </CardFooter>
                    )}
                  </Card>
                </TabsContent>

                <TabsContent value="software" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">
                        Connect Accounting Software
                      </CardTitle>
                      <CardDescription>
                        Integrate with your existing accounting tools to sync invoices
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pb-2">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Xero */}
                        <div className="border rounded-lg p-4 space-y-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center">
                              <img
                                src="https://upload.wikimedia.org/wikipedia/commons/thumb/d/dd/Xero_logo.svg/1200px-Xero_logo.svg.png"
                                className="h-10 mr-3"
                                alt="Xero"
                              />
                              <div>
                                <h3 className="font-medium">Xero</h3>
                                <p className="text-sm text-muted-foreground">Cloud Accounting Software</p>
                              </div>
                            </div>
                            
                            {integrationsStatus.xero.connected ? (
                              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                <Check className="h-3 w-3 mr-1" />
                                Connected
                              </Badge>
                            ) : (
                              <Badge variant="outline">Not Connected</Badge>
                            )}
                          </div>
                          
                          {integrationsStatus.xero.connected && (
                            <div className="space-y-3">
                              <div className="flex justify-between text-sm">
                                <span>Last synced: {integrationsStatus.xero.lastSync}</span>
                                {integrationsStatus.xero.invoiceCount !== undefined && (
                                  <span>{integrationsStatus.xero.invoiceCount} invoices</span>
                                )}
                              </div>
                              
                              {isSyncingSoftware && selectedSoftware === 'xero' && (
                                <div className="space-y-1">
                                  <div className="flex justify-between text-xs">
                                    <span>Syncing invoices...</span>
                                    <span>{softwareSyncProgress}%</span>
                                  </div>
                                  <Progress value={softwareSyncProgress} className="h-1" />
                                </div>
                              )}
                            </div>
                          )}
                          
                          <div className="flex flex-col sm:flex-row gap-2">
                            {!integrationsStatus.xero.connected ? (
                              <Button 
                                className="w-full" 
                                onClick={() => connectToAccountingSoftware('xero')}
                                disabled={isSyncingSoftware}
                              >
                                Connect
                              </Button>
                            ) : (
                              <>
                                <Button 
                                  variant="outline" 
                                  className="w-full" 
                                  onClick={() => disconnectFromAccountingSoftware('xero')}
                                  disabled={isSyncingSoftware}
                                >
                                  Disconnect
                                </Button>
                                <Button 
                                  className="w-full" 
                                  onClick={() => syncWithAccountingSoftware('xero')}
                                  disabled={isSyncingSoftware}
                                >
                                  {isSyncingSoftware && selectedSoftware === 'xero' ? (
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                  ) : null}
                                  Sync Now
                                </Button>
                              </>
                            )}
                          </div>
                        </div>

                        {/* QuickBooks */}
                        <div className="border rounded-lg p-4 space-y-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center">
                              <img
                                src="https://logodownload.org/wp-content/uploads/2019/06/quickbooks-logo-1.png"
                                className="h-10 mr-3"
                                alt="QuickBooks"
                              />
                              <div>
                                <h3 className="font-medium">QuickBooks</h3>
                                <p className="text-sm text-muted-foreground">Intuit Accounting Platform</p>
                              </div>
                            </div>
                            
                            {integrationsStatus.quickbooks.connected ? (
                              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                <Check className="h-3 w-3 mr-1" />
                                Connected
                              </Badge>
                            ) : (
                              <Badge variant="outline">Not Connected</Badge>
                            )}
                          </div>
                          
                          {integrationsStatus.quickbooks.connected && (
                            <div className="space-y-3">
                              <div className="flex justify-between text-sm">
                                <span>Last synced: {integrationsStatus.quickbooks.lastSync}</span>
                                {integrationsStatus.quickbooks.invoiceCount !== undefined && (
                                  <span>{integrationsStatus.quickbooks.invoiceCount} invoices</span>
                                )}
                              </div>
                              
                              {isSyncingSoftware && selectedSoftware === 'quickbooks' && (
                                <div className="space-y-1">
                                  <div className="flex justify-between text-xs">
                                    <span>Syncing invoices...</span>
                                    <span>{softwareSyncProgress}%</span>
                                  </div>
                                  <Progress value={softwareSyncProgress} className="h-1" />
                                </div>
                              )}
                            </div>
                          )}
                          
                          <div className="flex flex-col sm:flex-row gap-2">
                            {!integrationsStatus.quickbooks.connected ? (
                              <Button 
                                className="w-full" 
                                onClick={() => connectToAccountingSoftware('quickbooks')}
                                disabled={isSyncingSoftware}
                              >
                                Connect
                              </Button>
                            ) : (
                              <>
                                <Button 
                                  variant="outline" 
                                  className="w-full" 
                                  onClick={() => disconnectFromAccountingSoftware('quickbooks')}
                                  disabled={isSyncingSoftware}
                                >
                                  Disconnect
                                </Button>
                                <Button 
                                  className="w-full" 
                                  onClick={() => syncWithAccountingSoftware('quickbooks')}
                                  disabled={isSyncingSoftware}
                                >
                                  {isSyncingSoftware && selectedSoftware === 'quickbooks' ? (
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                  ) : null}
                                  Sync Now
                                </Button>
                              </>
                            )}
                          </div>
                        </div>

                        {/* Zoho Books */}
                        <div className="border rounded-lg p-4 space-y-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center">
                              <img
                                src="https://www.zohowebstatic.com/sites/default/files/styles/product-home-page/public/books-logo.png"
                                className="h-10 mr-3"
                                alt="Zoho"
                              />
                              <div>
                                <h3 className="font-medium">Zoho Books</h3>
                                <p className="text-sm text-muted-foreground">Online Accounting Software</p>
                              </div>
                            </div>
                            
                            {integrationsStatus.zoho.connected ? (
                              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                <Check className="h-3 w-3 mr-1" />
                                Connected
                              </Badge>
                            ) : (
                              <Badge variant="outline">Not Connected</Badge>
                            )}
                          </div>
                          
                          {integrationsStatus.zoho.connected && (
                            <div className="space-y-3">
                              <div className="flex justify-between text-sm">
                                <span>Last synced: {integrationsStatus.zoho.lastSync}</span>
                                {integrationsStatus.zoho.invoiceCount !== undefined && (
                                  <span>{integrationsStatus.zoho.invoiceCount} invoices</span>
                                )}
                              </div>
                              
                              {isSyncingSoftware && selectedSoftware === 'zoho' && (
                                <div className="space-y-1">
                                  <div className="flex justify-between text-xs">
                                    <span>Syncing invoices...</span>
                                    <span>{softwareSyncProgress}%</span>
                                  </div>
                                  <Progress value={softwareSyncProgress} className="h-1" />
                                </div>
                              )}
                            </div>
                          )}
                          
                          <div className="flex flex-col sm:flex-row gap-2">
                            {!integrationsStatus.zoho.connected ? (
                              <Button 
                                className="w-full" 
                                onClick={() => connectToAccountingSoftware('zoho')}
                                disabled={isSyncingSoftware}
                              >
                                Connect
                              </Button>
                            ) : (
                              <>
                                <Button 
                                  variant="outline" 
                                  className="w-full" 
                                  onClick={() => disconnectFromAccountingSoftware('zoho')}
                                  disabled={isSyncingSoftware}
                                >
                                  Disconnect
                                </Button>
                                <Button 
                                  className="w-full" 
                                  onClick={() => syncWithAccountingSoftware('zoho')}
                                  disabled={isSyncingSoftware}
                                >
                                  {isSyncingSoftware && selectedSoftware === 'zoho' ? (
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                  ) : null}
                                  Sync Now
                                </Button>
                              </>
                            )}
                          </div>
                        </div>

                        {/* FreshBooks */}
                        <div className="border rounded-lg p-4 space-y-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center">
                              <img
                                src="https://www.freshbooks.com/wp-content/uploads/2018/12/fb-logo.png"
                                className="h-10 mr-3"
                                alt="FreshBooks"
                              />
                              <div>
                                <h3 className="font-medium">FreshBooks</h3>
                                <p className="text-sm text-muted-foreground">Small Business Accounting</p>
                              </div>
                            </div>
                            
                            {integrationsStatus.freshbooks.connected ? (
                              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                <Check className="h-3 w-3 mr-1" />
                                Connected
                              </Badge>
                            ) : (
                              <Badge variant="outline">Not Connected</Badge>
                            )}
                          </div>
                          
                          {integrationsStatus.freshbooks.connected && (
                            <div className="space-y-3">
                              <div className="flex justify-between text-sm">
                                <span>Last synced: {integrationsStatus.freshbooks.lastSync}</span>
                                {integrationsStatus.freshbooks.invoiceCount !== undefined && (
                                  <span>{integrationsStatus.freshbooks.invoiceCount} invoices</span>
                                )}
                              </div>
                              
                              {isSyncingSoftware && selectedSoftware === 'freshbooks' && (
                                <div className="space-y-1">
                                  <div className="flex justify-between text-xs">
                                    <span>Syncing invoices...</span>
                                    <span>{softwareSyncProgress}%</span>
                                  </div>
                                  <Progress value={softwareSyncProgress} className="h-1" />
                                </div>
                              )}
                            </div>
                          )}
                          
                          <div className="flex flex-col sm:flex-row gap-2">
                            {!integrationsStatus.freshbooks.connected ? (
                              <Button 
                                className="w-full" 
                                onClick={() => connectToAccountingSoftware('freshbooks')}
                                disabled={isSyncingSoftware}
                              >
                                Connect
                              </Button>
                            ) : (
                              <>
                                <Button 
                                  variant="outline" 
                                  className="w-full" 
                                  onClick={() => disconnectFromAccountingSoftware('freshbooks')}
                                  disabled={isSyncingSoftware}
                                >
                                  Disconnect
                                </Button>
                                <Button 
                                  className="w-full" 
                                  onClick={() => syncWithAccountingSoftware('freshbooks')}
                                  disabled={isSyncingSoftware}
                                >
                                  {isSyncingSoftware && selectedSoftware === 'freshbooks' ? (
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                  ) : null}
                                  Sync Now
                                </Button>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter className="border-t pt-4">
                      <div className="w-full text-center text-sm text-muted-foreground">
                        <p>Connecting to an accounting software allows automatic synchronization of invoices.</p>
                        <p className="mt-1">You can manage integration settings in the <a href="#" className="text-primary underline">Settings page</a>.</p>
                      </div>
                    </CardFooter>
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
