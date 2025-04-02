"use client";

import { useState, useEffect } from "react";
import { v4 as uuidv4 } from "uuid";
import { 
  Sparkles, 
  ArrowRight, 
  ArrowLeft, 
  Upload, 
  Zap, 
  Check, 
  Settings, 
  Building,
  FileText,
  Trash2,
  Brain,
  FileIcon, 
  Eye, 
  X, 
  ArrowDownCircle,
  ArrowUpCircle,
  AlertCircle,
  FolderOpen,
  CheckCircle,
  RefreshCw,
  PlusCircle,
  FileX
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { uploadInvoice, processInvoiceOCR, getUserCategories, getUserVendors, updateInvoiceType } from "@/lib/actions/invoice";
import { Category, Vendor, ExtractedInvoiceData, InvoiceType, AISettings } from "@/lib/types";
import OCRResultsPanel from "@/components/dashboard/invoice/OCRResultsPanel";
import AISettingsComponent from "@/components/dashboard/settings/AISettings";
import InvoiceTypeConfirmation from "@/components/dashboard/invoice/InvoiceTypeConfirmation";
import { loadAISettings } from "@/lib/services/ai-service";
import { getUserProfile } from "@/lib/services/user-service";

// File upload status type
type FileStatus = "uploading" | "processed" | "error";

// File information type
interface FileInfo {
  id: string;
  name: string;
  size: number;
  status: FileStatus;
  progress: number;
  error: string | null;
  invoiceId?: string;
  previewUrl?: string;
}

const EnhancedInvoiceUpload = () => {
  const { toast } = useToast();
  
  // Upload states
  const [dragging, setDragging] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<Record<string, FileInfo>>({});
  const [selectedInvoice, setSelectedInvoice] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("upload");
  
  // OCR results
  const [ocrResults, setOcrResults] = useState<Record<string, {
    extractedData: ExtractedInvoiceData;
    suggestedCategories: string[];
    vendorSuggestions: string[];
    invoiceType: InvoiceType;
    confidence?: number;
  }>>({});
  
  // Categories and vendors
  const [categories, setCategories] = useState<Category[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  
  // Batch upload state
  const [bulkUpload, setBulkUpload] = useState<{
    total: number;
    processed: number;
    succeeded: number;
    failed: number;
    inProgress: boolean;
  }>({
    total: 0,
    processed: 0,
    succeeded: 0, 
    failed: 0,
    inProgress: false
  });
  
  // User organization data and AI settings
  const [organizationData, setOrganizationData] = useState<{
    name?: string;
    industry?: string;
    size?: string;
    invoiceVolume?: string;
  }>({});

  const [aiSettings, setAISettings] = useState<AISettings | null>(null);

  // Invoice type confirmation dialog
  const [invoiceTypeConfirmation, setInvoiceTypeConfirmation] = useState<{
    open: boolean;
    invoiceId: string;
    invoiceName: string;
    detectedType: InvoiceType;
    confidence?: number;
  }>({
    open: false,
    invoiceId: '',
    invoiceName: '',
    detectedType: 'PURCHASE',
  });

  // Queue for processing confirmations for multiple invoices
  const [confirmationQueue, setConfirmationQueue] = useState<string[]>([]);
  
  // Load user data, categories, vendors, and AI settings
  useEffect(() => {
    const loadData = async () => {
      try {
        // Load user profile and organization data
        const userProfile = await getUserProfile();
        if (userProfile && userProfile.organization) {
          setOrganizationData({
            name: userProfile.organization.name,
            // If more fields were available, they would be set here
          });
        }
        
        // Load AI settings
        const settings = await loadAISettings();
        if (settings) {
          setAISettings(settings);
        }
        
        // Load categories and vendors
        const [categoriesData, vendorsData] = await Promise.all([
          getUserCategories(),
          getUserVendors()
        ]);
        
        setCategories(categoriesData || []);
        setVendors(vendorsData || []);
      } catch (error) {
        console.error("Error loading data:", error);
      }
    };
    
    loadData();
  }, []);
  
  // Process the next invoice in the confirmation queue
  useEffect(() => {
    if (confirmationQueue.length > 0 && !invoiceTypeConfirmation.open) {
      const nextInvoiceId = confirmationQueue[0];
      const fileInfo = Object.values(uploadedFiles).find(f => f.invoiceId === nextInvoiceId);
      
      if (fileInfo && fileInfo.invoiceId) {
        const ocrResult = ocrResults[fileInfo.invoiceId];
        
        if (ocrResult) {
          setInvoiceTypeConfirmation({
            open: true,
            invoiceId: fileInfo.invoiceId,
            invoiceName: fileInfo.name,
            detectedType: ocrResult.invoiceType || 'PURCHASE',
            confidence: ocrResult.confidence
          });
        }
      }
    }
  }, [confirmationQueue, invoiceTypeConfirmation.open, uploadedFiles, ocrResults]);

  // Handle confirmation of invoice type
  const handleConfirmInvoiceType = async (invoiceId: string, confirmedType: InvoiceType) => {
    try {
      // Update the invoice type in the database
      await updateInvoiceType(invoiceId, confirmedType);
      
      // Update local state
      setOcrResults(prev => {
        if (prev[invoiceId]) {
          return {
            ...prev,
            [invoiceId]: {
              ...prev[invoiceId],
              invoiceType: confirmedType
            }
          };
        }
        return prev;
      });
      
      // Remove this invoice from the queue
      setConfirmationQueue(prev => prev.filter(id => id !== invoiceId));
      
      // Show success message
      toast({
        title: "Invoice type confirmed",
        description: `Invoice has been marked as ${confirmedType === 'PURCHASE' ? 'Purchase' : 'Payment'} invoice`,
      });
    } catch (error) {
      console.error("Error confirming invoice type:", error);
      toast({
        title: "Error",
        description: "Failed to update invoice type",
        variant: "destructive"
      });
    }
  };
  
  // Handle file drag events
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(true);
  };
  
  const handleDragLeave = () => {
    setDragging(false);
  };
  
  // Handle file drop
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    
    const droppedFiles = Array.from(e.dataTransfer.files);
    
    // Check for maximum files
    if (droppedFiles.length > 10) {
      toast({
        title: "Too many files",
        description: "Maximum 10 files allowed at once",
        variant: "destructive"
      });
      return;
    }
    
    if (droppedFiles.length === 1) {
      // Single file upload
      handleFileUpload(droppedFiles[0]);
    } else if (droppedFiles.length > 1) {
      // Batch upload
      processBulkUpload(droppedFiles);
    }
  };
  
  // Handle file input change
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    setDragging(false);
    
    const files = Array.from(e.target.files || []);
    
    // Check for maximum files
    if (files.length > 10) {
      toast({
        title: "Too many files",
        description: "Maximum 10 files allowed at once",
        variant: "destructive"
      });
      return;
    }
    
    if (files.length === 1) {
      // Single file upload
      handleFileUpload(files[0]);
    } else if (files.length > 1) {
      // Batch upload
      processBulkUpload(files);
    }
  };
  
  // Process a single file upload
  const handleFileUpload = (file: File) => {
    // Generate file preview URL
    const previewUrl = URL.createObjectURL(file);
    
    // Set the file as uploading
    const fileId = uuidv4();
    setUploadedFiles(prev => ({
      ...prev,
      [fileId]: {
        id: fileId,
        name: file.name,
        size: file.size,
        status: "uploading",
        progress: 0,
        error: null,
        previewUrl,
      }
    }));
    
    // Start a timer to simulate upload progress
    const startTime = Date.now();
    const progressInterval = setInterval(() => {
      setUploadedFiles(prev => {
        const fileInfo = prev[fileId];
        if (!fileInfo || fileInfo.status !== "uploading") {
          clearInterval(progressInterval);
          return prev;
        }
        
        const progress = Math.min(fileInfo.progress + 10, 99);
        return {
          ...prev,
          [fileId]: {
            ...fileInfo,
            progress
          }
        };
      });
    }, 300);
    
    // Upload the file and process it
    uploadInvoice(file)
      .then(invoice => {
        clearInterval(progressInterval);
        
        // Update file status to processed
        setUploadedFiles(prev => ({
          ...prev,
          [fileId]: {
            ...prev[fileId],
            status: "processed",
            progress: 100,
            invoiceId: invoice.id,
          }
        }));
        
        // Automatically show the OCR results for the uploaded invoice
        setSelectedInvoice(invoice.id);
        
        // Get the OCR results for this invoice
        processInvoiceOCR(
          invoice.id, 
          invoice.originalFileUrl || "",
          organizationData,
          aiSettings || undefined
        )
          .then(results => {
            // Store the OCR results
            setOcrResults(prev => ({
              ...prev,
              [invoice.id]: {
                extractedData: results.extractedData,
                suggestedCategories: results.suggestedCategories || [],
                vendorSuggestions: results.vendorSuggestions || [],
                invoiceType: results.extractedData.invoiceType as InvoiceType || 'PURCHASE',
                confidence: results.extractedData.confidence
              }
            }));

            // After processing OCR results add to confirmation queue
            setConfirmationQueue(prev => [...prev, invoice.id]);
          })
          .catch(error => {
            console.error("Error processing invoice with OCR:", error);
            setUploadedFiles(prev => ({
              ...prev,
              [fileId]: {
                ...prev[fileId],
                status: "error",
                error: "Failed to process with OCR"
              }
            }));
          });
      })
      .catch(error => {
        clearInterval(progressInterval);
        console.error("Error uploading invoice:", error);
        setUploadedFiles(prev => ({
          ...prev,
          [fileId]: {
            ...prev[fileId],
            status: "error",
            error: "Failed to upload"
          }
        }));
      });
  };
  
  // Process multiple files upload
  const processBulkUpload = async (files: File[]) => {
    // Set bulk upload status
    setBulkUpload({
      total: files.length,
      processed: 0,
      succeeded: 0,
      failed: 0,
      inProgress: true
    });
    
    // Process each file sequentially
    for (const file of files) {
      try {
        // Generate file preview URL
        const previewUrl = URL.createObjectURL(file);
        
        // Add file to the list with uploading status
        const fileId = uuidv4();
        setUploadedFiles(prev => ({
          ...prev,
          [fileId]: {
            id: fileId,
            name: file.name,
            size: file.size,
            status: "uploading",
            progress: 0,
            error: null,
            previewUrl,
          }
        }));
        
        // Upload progress simulation
        let progress = 0;
        const progressInterval = setInterval(() => {
          progress = Math.min(progress + 5, 95);
          setUploadedFiles(prev => ({
            ...prev,
            [fileId]: {
              ...prev[fileId],
              progress
            }
          }));
        }, 200);
        
        // Actual upload
        const invoice = await uploadInvoice(file);
        clearInterval(progressInterval);
        
        // Process with OCR
        processInvoiceOCR(
          invoice.id, 
          invoice.originalFileUrl || "",
          organizationData,
          aiSettings || undefined
        )
          .then(results => {
            // Update file status
            setUploadedFiles(prev => ({
              ...prev,
              [fileId]: {
                ...prev[fileId],
                status: "processed",
                progress: 100,
                invoiceId: invoice.id
              }
            }));
            
            // Store OCR results
            setOcrResults(prev => ({
              ...prev,
              [invoice.id]: {
                extractedData: results.extractedData,
                suggestedCategories: results.suggestedCategories || [],
                vendorSuggestions: results.vendorSuggestions || [],
                invoiceType: results.extractedData.invoiceType as InvoiceType || 'PURCHASE',
                confidence: results.extractedData.confidence
              }
            }));
            
            // Update bulk upload progress
            setBulkUpload(prev => ({
              ...prev,
              processed: prev.processed + 1,
              succeeded: prev.succeeded + 1
            }));

            // After processing OCR results add to confirmation queue
            setConfirmationQueue(prev => [...prev, invoice.id]);
          })
          .catch(error => {
            console.error(`Error processing ${file.name}:`, error);
            
            // Update file as failed
            const fileId = Object.keys(uploadedFiles).find(
              id => uploadedFiles[id].name === file.name && uploadedFiles[id].status === "uploading"
            );
            
            if (fileId) {
              setUploadedFiles(prev => ({
                ...prev,
                [fileId]: {
                  ...prev[fileId],
                  status: "error",
                  error: "Failed to process",
                  progress: 100
                }
              }));
            }
            
            // Update bulk upload progress
            setBulkUpload(prev => ({
              ...prev,
              processed: prev.processed + 1,
              failed: prev.failed + 1
            }));
          });
      } catch (error) {
        console.error(`Error processing ${file.name}:`, error);
        
        // Update file as failed
        const fileId = Object.keys(uploadedFiles).find(
          id => uploadedFiles[id].name === file.name && uploadedFiles[id].status === "uploading"
        );
        
        if (fileId) {
          setUploadedFiles(prev => ({
            ...prev,
            [fileId]: {
              ...prev[fileId],
              status: "error",
              error: "Failed to process",
              progress: 100
            }
          }));
        }
        
        // Update bulk upload progress
        setBulkUpload(prev => ({
          ...prev,
          processed: prev.processed + 1,
          failed: prev.failed + 1
        }));
      }
    }
    
    // Mark bulk upload as completed
    setBulkUpload(prev => ({
      ...prev,
      inProgress: false
    }));
    
    // Show notification of completion
    toast({
      title: "Batch upload complete",
      description: `Successfully processed ${bulkUpload.succeeded} of ${bulkUpload.total} invoices`
    });
  };
  
  // Retry processing a failed invoice
  const handleRetryProcessing = (invoiceId: string, fileUrl: string) => {
    // Find the file ID for this invoice
    const fileId = Object.keys(uploadedFiles).find(
      id => uploadedFiles[id].invoiceId === invoiceId
    );
    
    if (!fileId) return;
    
    // Update status to uploading
    setUploadedFiles(prev => ({
      ...prev,
      [fileId]: {
        ...prev[fileId],
        status: "uploading",
        progress: 50,
        error: null
      }
    }));
    
    // Retry OCR processing
    processInvoiceOCR(invoiceId, fileUrl)
      .then(results => {
        // Update status to processed
        setUploadedFiles(prev => ({
          ...prev,
          [fileId]: {
            ...prev[fileId],
            status: "processed",
            progress: 100,
            error: null
          }
        }));
        
        // Store OCR results
        setOcrResults(prev => ({
          ...prev,
          [invoiceId]: {
            extractedData: results.extractedData,
            suggestedCategories: results.suggestedCategories || [],
            vendorSuggestions: results.vendorSuggestions || [],
            invoiceType: results.extractedData.invoiceType as InvoiceType || 'PURCHASE',
            confidence: results.extractedData.confidence
          }
        }));
      })
      .catch(error => {
        console.error("Error retrying OCR:", error);
        setUploadedFiles(prev => ({
          ...prev,
          [fileId]: {
            ...prev[fileId],
            status: "error",
            error: "Retry failed"
          }
        }));
      });
  };
  
  // Refresh data
  const handleRefreshData = async () => {
    try {
      const [categoriesData, vendorsData] = await Promise.all([
        getUserCategories(),
        getUserVendors()
      ]);
      
      setCategories(categoriesData || []);
      setVendors(vendorsData || []);
      
      toast({
        title: "Data refreshed",
        description: "Categories and vendors updated"
      });
    } catch (error) {
      console.error("Error refreshing data:", error);
      toast({
        title: "Error",
        description: "Failed to refresh data",
        variant: "destructive"
      });
    }
  };
  
  // Helper to format file size
  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };
  
  // Get status badge for a file
  const getStatusBadge = (status: string, confidence?: number) => {
    switch (status) {
      case "uploading":
        return <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">Processing</Badge>;
      case "processed":
        return confidence && confidence < 0.7 ? (
          <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
            <AlertCircle className="h-3 w-3 mr-1" /> Low confidence
          </Badge>
        ) : (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            <Check className="h-3 w-3 mr-1" /> Processed
          </Badge>
        );
      case "error":
        return <Badge variant="destructive">Failed</Badge>;
      default:
        return null;
    }
  };
  
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Invoice Upload</h1>
        <p className="text-muted-foreground">
          Upload and process your invoices using AI-powered OCR
        </p>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3 mb-6">
          <TabsTrigger value="upload">
            <Upload className="h-4 w-4 mr-2" /> Upload Invoices
          </TabsTrigger>
          <TabsTrigger value="processing">
            <RefreshCw className="h-4 w-4 mr-2" /> Processing
          </TabsTrigger>
          <TabsTrigger value="settings">
            <Settings className="h-4 w-4 mr-2" /> AI Settings
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="upload" className="space-y-4">
          {/* Upload Area */}
          <Card>
            <CardHeader>
              <CardTitle>Upload Invoices</CardTitle>
              <CardDescription>
                Upload invoice files to process with AI. Supported formats: PDF, PNG, JPG
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div 
                className={cn(
                  "border-2 border-dashed rounded-lg p-10 text-center",
                  dragging ? "border-primary bg-primary/5" : "border-muted-foreground/20"
                )}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <div className="flex flex-col items-center justify-center space-y-4">
                  <div className="rounded-full bg-primary/10 p-4">
                    <Upload className="h-10 w-10 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold mb-1">
                      {dragging ? "Drop your files here" : "Drag and drop your files here"}
                    </h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      or click to browse (max 10 files)
                    </p>
                    <Button asChild>
                      <label>
                        <input 
                          type="file" 
                          className="hidden" 
                          onChange={handleFileChange}
                          multiple
                          accept=".pdf,.png,.jpg,.jpeg"
                        />
                        <FolderOpen className="h-4 w-4 mr-2" /> 
                        Browse Files
                      </label>
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Batch Upload Progress */}
          {bulkUpload.inProgress && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Batch Upload Progress</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">
                        Processing {bulkUpload.processed} of {bulkUpload.total} files
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {bulkUpload.succeeded} succeeded, {bulkUpload.failed} failed
                      </p>
                    </div>
                    <Badge variant={bulkUpload.inProgress ? "outline" : "secondary"}>
                      {bulkUpload.inProgress ? (
                        <>
                          <RefreshCw className="h-3 w-3 mr-1 animate-spin" /> 
                          In Progress
                        </>
                      ) : "Complete"}
                    </Badge>
                  </div>
                  <Progress 
                    value={(bulkUpload.processed / bulkUpload.total) * 100} 
                    className="h-2"
                  />
                </div>
              </CardContent>
            </Card>
          )}
          
          {/* Uploaded Files */}
          {Object.keys(uploadedFiles).length > 0 && (
            <Card>
              <CardHeader className="pb-3 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-lg">Uploaded Files</CardTitle>
                  <CardDescription>
                    {Object.values(uploadedFiles).filter(f => f.status === "processed").length} processed, 
                    {Object.values(uploadedFiles).filter(f => f.status === "error").length} failed
                  </CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    // Clear files that are not in uploading state
                    setUploadedFiles(prev => {
                      const filtered: Record<string, FileInfo> = {};
                      Object.entries(prev).forEach(([id, file]) => {
                        if (file.status === "uploading") {
                          filtered[id] = file;
                        }
                      });
                      return filtered;
                    });
                  }}
                  disabled={Object.values(uploadedFiles).some(f => f.status === "uploading")}
                >
                  <X className="h-4 w-4 mr-2" /> Clear Completed
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {/* File Cards with Preview */}
                  {Object.values(uploadedFiles).map(file => (
                    <div 
                      key={file.id}
                      className={cn(
                        "flex overflow-hidden rounded-lg border bg-card text-card-foreground shadow-sm transition-colors",
                        {
                          "border-amber-300 bg-amber-50": file.status === "uploading",
                          "border-red-300 bg-red-50": file.status === "error",
                          "border-green-300 bg-green-50": file.status === "processed",
                          "border-primary": selectedInvoice === file.invoiceId
                        }
                      )}
                    >
                      {/* File Preview */}
                      <div className="flex-shrink-0 w-16 h-16 border-r">
                        {file.previewUrl ? (
                          <img
                            src={file.previewUrl}
                            alt={file.name}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                            <FileIcon className="h-8 w-8" />
                          </div>
                        )}
                      </div>
                      
                      {/* File Info */}
                      <div className="flex flex-1 flex-col p-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="text-sm font-medium">{file.name}</h3>
                            <p className="text-xs text-muted-foreground">{formatBytes(file.size)}</p>
                          </div>
                          
                          {file.status === "processed" && file.invoiceId && ocrResults[file.invoiceId] && (
                            <Badge 
                              variant="outline" 
                              className={
                                ocrResults[file.invoiceId]?.invoiceType === 'PAYMENT'
                                  ? "bg-green-100 text-green-800 border-green-300 flex items-center"
                                  : "bg-amber-100 text-amber-800 border-amber-300 flex items-center"
                              }
                            >
                              {ocrResults[file.invoiceId]?.invoiceType === 'PAYMENT' ? (
                                <>
                                  <ArrowUpCircle className="h-3 w-3 mr-1" />
                                  Payment Invoice
                                </>
                              ) : (
                                <>
                                  <ArrowDownCircle className="h-3 w-3 mr-1" />
                                  Purchase Invoice
                                </>
                              )}
                            </Badge>
                          )}
                        </div>
                        
                        {file.status === "uploading" && (
                          <div className="mt-2">
                            <Progress value={file.progress} className="h-1" />
                            <p className="text-xs text-muted-foreground mt-1">
                              Uploading {file.progress}%
                            </p>
                          </div>
                        )}
                      </div>
                      
                      {/* Actions */}
                      <div className="flex flex-col justify-center border-l p-3">
                        {file.status === "processed" && file.invoiceId && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className={cn({
                              "text-primary": selectedInvoice === file.invoiceId
                            })}
                            onClick={() => setSelectedInvoice(file.invoiceId)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        )}
                        
                        {file.status === "error" && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive"
                            onClick={() => {
                              const newFiles = { ...uploadedFiles };
                              delete newFiles[file.id];
                              setUploadedFiles(newFiles);
                            }}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
          
          {/* OCR Results */}
          {selectedInvoice && ocrResults[selectedInvoice] && (
            <OCRResultsPanel
              invoiceId={selectedInvoice}
              extractedData={ocrResults[selectedInvoice].extractedData}
              suggestedCategories={ocrResults[selectedInvoice].suggestedCategories}
              vendorSuggestions={ocrResults[selectedInvoice].vendorSuggestions}
              existingCategories={categories}
              existingVendors={vendors}
              onRefresh={handleRefreshData}
              confidence={ocrResults[selectedInvoice].confidence || 0.8}
            />
          )}
        </TabsContent>
        
        <TabsContent value="processing">
          <Card>
            <CardHeader>
              <CardTitle>Processing Options</CardTitle>
              <CardDescription>
                Configure how your invoices are processed with AI
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-primary/5 p-6 rounded-lg text-center">
                <PlusCircle className="h-12 w-12 text-primary mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">Batch Processing</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Process up to 10 invoices at once with our enhanced AI capabilities.
                  Upload multiple files to automatically extract data, categorize, and organize them.
                </p>
                <div className="grid grid-cols-2 gap-4 max-w-md mx-auto">
                  <Button asChild variant="outline">
                    <label className="cursor-pointer">
                      <input 
                        type="file" 
                        className="hidden" 
                        onChange={handleFileChange}
                        multiple
                        accept=".pdf,.png,.jpg,.jpeg"
                      />
                      <Upload className="h-4 w-4 mr-2" /> 
                      Upload Batch
                    </label>
                  </Button>
                  <Button variant="default" onClick={handleRefreshData}>
                    <RefreshCw className="h-4 w-4 mr-2" /> Refresh Data
                  </Button>
                </div>
              </div>
              
              <div className="grid md:grid-cols-2 gap-4">
                <div className="border rounded-lg p-4">
                  <h3 className="text-base font-medium mb-2 flex items-center">
                    <ArrowDownCircle className="h-4 w-4 mr-2 text-amber-500" />
                    Purchase Invoice Detection
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    The AI will automatically detect when an invoice represents a purchase (money paid) 
                    based on the layout, terminology, and data in the document.
                  </p>
                </div>
                
                <div className="border rounded-lg p-4">
                  <h3 className="text-base font-medium mb-2 flex items-center">
                    <ArrowUpCircle className="h-4 w-4 mr-2 text-green-500" />
                    Payment Invoice Detection
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    The AI will identify when an invoice represents a payment (money received)
                    by analyzing key indicators like "Bill To" vs "Ship To" fields.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="settings">
          <AISettingsComponent
            existingCategories={categories.map(c => c.name)}
          />
        </TabsContent>
      </Tabs>
      
      {/* Invoice Type Confirmation Dialog */}
      <InvoiceTypeConfirmation
        open={invoiceTypeConfirmation.open}
        onOpenChange={(open) => {
          setInvoiceTypeConfirmation(prev => ({ ...prev, open }));
          // If closing without confirmation, remove from queue
          if (!open) {
            setConfirmationQueue(prev => prev.filter(id => id !== invoiceTypeConfirmation.invoiceId));
          }
        }}
        invoiceId={invoiceTypeConfirmation.invoiceId}
        invoiceName={invoiceTypeConfirmation.invoiceName}
        detectedType={invoiceTypeConfirmation.detectedType}
        confidence={invoiceTypeConfirmation.confidence}
        onConfirm={handleConfirmInvoiceType}
      />
    </div>
  );
};

export default EnhancedInvoiceUpload; 