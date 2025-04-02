"use client";

import { useState } from "react";
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
  Brain
} from "lucide-react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { toast } from "sonner";
import { v4 as uuidv4 } from "uuid";
import { useRouter } from "next/navigation";
import { AISettings } from "@/lib/types";

interface AIOnboardingProps {
  onComplete?: (settings: AISettings) => Promise<void>;
}

export default function AIOnboarding({ onComplete }: AIOnboardingProps) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const totalSteps = 5;
  
  // Organization settings
  const [organization, setOrganization] = useState({
    name: "",
    industry: "",
    size: "small" as "small" | "medium" | "large",
    invoiceVolume: "low" as "low" | "medium" | "high",
  });
  
  // Invoice preferences
  const [invoicePreferences, setInvoicePreferences] = useState({
    primaryCategories: ["Utilities", "Software", "Hardware", "Office Supplies"], // Default categories
    customInstructions: "",
    confidenceThreshold: 0.7,
  });
  
  // Sample invoices
  const [sampleInvoices, setSampleInvoices] = useState<{
    id: string;
    name: string;
    url: string;
    uploadProgress: number;
    isUploading: boolean;
  }[]>([]);
  
  // Loading state
  const [isLoading, setIsLoading] = useState(false);
  
  // Handle file upload for sample invoices
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    if (files.length === 0) return;
    
    // Only allow up to 5 sample invoices
    if (sampleInvoices.length + files.length > 5) {
      toast.error("Maximum 5 sample invoices allowed");
      return;
    }
    
    for (const file of files) {
      const fileId = uuidv4();
      
      // Add file to list with uploading status
      setSampleInvoices(prev => [
        ...prev,
        {
          id: fileId,
          name: file.name,
          url: "",
          uploadProgress: 0,
          isUploading: true,
        }
      ]);
      
      try {
        // Generate unique file name
        const uniqueId = uuidv4();
        const fileName = `sample-invoice-${uniqueId}-${file.name}`;
        
        // Simulate progress updates
        const progressInterval = setInterval(() => {
          setSampleInvoices(prev => 
            prev.map(invoice => 
              invoice.id === fileId
                ? { ...invoice, uploadProgress: Math.min(invoice.uploadProgress + 10, 95) }
                : invoice
            )
          );
        }, 300);
        
        // For demo purposes, create a fake URL instead of actually uploading
        // This avoids the Vercel Blob token issue in development
        const fakeUrl = `https://example.com/fake-upload/${fileName}`;
        
        // Wait a bit to simulate upload
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        clearInterval(progressInterval);
        
        // Update sample invoice with URL
        setSampleInvoices(prev => 
          prev.map(invoice => 
            invoice.id === fileId
              ? { ...invoice, url: fakeUrl, uploadProgress: 100, isUploading: false }
              : invoice
          )
        );
        
        toast.success(`Uploaded ${file.name}`);
      } catch (error) {
        console.error("Error uploading file:", error);
        
        // Remove failed upload
        setSampleInvoices(prev => prev.filter(invoice => invoice.id !== fileId));
        
        toast.error(`Failed to upload ${file.name}`);
      }
    }
  };
  
  // Delete a sample invoice
  const handleDeleteSample = (id: string) => {
    setSampleInvoices(prev => prev.filter(invoice => invoice.id !== id));
  };
  
  // Complete onboarding
  const handleComplete = async () => {
    setIsLoading(true);
    
    // Prepare settings object
    const settings: AISettings = {
      customInstructions: `industry: ${organization.industry}\ninvoiceVolume: ${organization.invoiceVolume}\n${invoicePreferences.customInstructions}`,
      confidenceThreshold: invoicePreferences.confidenceThreshold,
      preferredCategories: invoicePreferences.primaryCategories,
      sampleInvoiceUrls: sampleInvoices.map(sample => sample.url),
    };
    
    try {
      // If callback provided, call it with settings
      if (onComplete) {
        await onComplete(settings);
      }
      
      // Show success message
      toast.success("AI setup completed!", {
        description: "Your AI is now personalized to your business needs"
      });
      
      // Redirect to dashboard
      router.push("/dashboard");
    } catch (error) {
      console.error("Error completing onboarding:", error);
      toast.error("Failed to complete setup");
    } finally {
      setIsLoading(false);
    }
  };
  
  // Navigation functions
  const nextStep = () => setStep(prev => Math.min(prev + 1, totalSteps));
  const prevStep = () => setStep(prev => Math.max(prev - 1, 1));
  
  // Validate current step
  const canProceed = () => {
    switch (step) {
      case 1:
        // Welcome step - always can proceed
        return true;
      case 2:
        // Organization step
        return organization.name.trim() !== "";
      case 3:
        // Preferences step - always can proceed
        return true;
      case 4:
        // Sample invoices step - always can proceed
        return true;
      case 5:
        // Completion step - always can proceed
        return true;
      default:
        return true;
    }
  };
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/20 p-4">
      <Card className="w-full max-w-3xl">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="text-2xl flex items-center">
              <Sparkles className="h-6 w-6 mr-2 text-primary" />
              Invoice AI Setup
            </CardTitle>
            <span className="text-sm text-muted-foreground">
              Step {step} of {totalSteps}
            </span>
          </div>
          <Progress value={(step / totalSteps) * 100} className="h-1 mt-2" />
        </CardHeader>
        <CardContent className="min-h-[400px] flex flex-col">
          {/* Step 1: Welcome */}
          {step === 1 && (
            <div className="flex flex-col items-center text-center space-y-6 flex-grow justify-center py-8">
              <div className="h-24 w-24 rounded-full bg-primary/10 flex items-center justify-center">
                <Brain className="h-12 w-12 text-primary" />
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl font-bold">Welcome to Invoice AI</h2>
                <p className="text-muted-foreground max-w-md">
                  Let&apos;s set up your AI-powered invoice processing system.
                  We&apos;ll personalize the AI to your business needs in just a few steps.
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full mt-6">
                <Card className="border-dashed">
                  <CardContent className="p-4 text-center">
                    <Building className="h-8 w-8 text-primary mx-auto mb-2" />
                    <h3 className="font-medium">Organization Details</h3>
                    <p className="text-xs text-muted-foreground">Configure your business profile</p>
                  </CardContent>
                </Card>
                <Card className="border-dashed">
                  <CardContent className="p-4 text-center">
                    <Settings className="h-8 w-8 text-primary mx-auto mb-2" />
                    <h3 className="font-medium">AI Preferences</h3>
                    <p className="text-xs text-muted-foreground">Customize how the AI processes invoices</p>
                  </CardContent>
                </Card>
                <Card className="border-dashed">
                  <CardContent className="p-4 text-center">
                    <FileText className="h-8 w-8 text-primary mx-auto mb-2" />
                    <h3 className="font-medium">Sample Invoices</h3>
                    <p className="text-xs text-muted-foreground">Help the AI learn your invoice formats</p>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
          
          {/* Step 2: Organization Details */}
          {step === 2 && (
            <div className="space-y-6 py-4">
              <div>
                <h2 className="text-xl font-semibold mb-2">Organization Details</h2>
                <p className="text-muted-foreground">
                  Tell us about your business so we can customize the AI to your needs
                </p>
              </div>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="org-name">Organization Name <span className="text-destructive">*</span></Label>
                  <Input 
                    id="org-name" 
                    placeholder="Your company name"
                    value={organization.name}
                    onChange={(e) => setOrganization({ ...organization, name: e.target.value })}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="industry">Industry</Label>
                  <Input 
                    id="industry" 
                    placeholder="e.g., Technology, Healthcare, Education"
                    value={organization.industry}
                    onChange={(e) => setOrganization({ ...organization, industry: e.target.value })}
                  />
                  <p className="text-xs text-muted-foreground">
                    This helps us suggest relevant invoice categories for your business
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label>Organization Size</Label>
                  <RadioGroup 
                    value={organization.size} 
                    onValueChange={(value) => setOrganization({ 
                      ...organization, 
                      size: value as "small" | "medium" | "large" 
                    })}
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="small" id="size-small" />
                      <Label htmlFor="size-small">Small (1-50 employees)</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="medium" id="size-medium" />
                      <Label htmlFor="size-medium">Medium (51-500 employees)</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="large" id="size-large" />
                      <Label htmlFor="size-large">Large (500+ employees)</Label>
                    </div>
                  </RadioGroup>
                </div>
              </div>
            </div>
          )}
          
          {/* Step 3: Invoice Preferences */}
          {step === 3 && (
            <div className="space-y-6 py-4">
              <div>
                <h2 className="text-xl font-semibold mb-2">Invoice Preferences</h2>
                <p className="text-muted-foreground">
                  Customize how the AI processes your invoices
                </p>
              </div>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Invoice Volume</Label>
                  <RadioGroup 
                    value={organization.invoiceVolume} 
                    onValueChange={(value) => setOrganization({ 
                      ...organization, 
                      invoiceVolume: value as "low" | "medium" | "high" 
                    })}
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="low" id="volume-low" />
                      <Label htmlFor="volume-low">Low (1-20 invoices/month)</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="medium" id="volume-medium" />
                      <Label htmlFor="volume-medium">Medium (21-100 invoices/month)</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="high" id="volume-high" />
                      <Label htmlFor="volume-high">High (100+ invoices/month)</Label>
                    </div>
                  </RadioGroup>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="confidence-threshold">AI Confidence Threshold</Label>
                    <span className="text-sm font-medium">
                      {Math.round(invoicePreferences.confidenceThreshold * 100)}%
                    </span>
                  </div>
                  <Slider
                    id="confidence-threshold"
                    value={[invoicePreferences.confidenceThreshold * 100]}
                    min={50}
                    max={95}
                    step={5}
                    onValueChange={(value) => {
                      setInvoicePreferences(prev => ({
                        ...prev,
                        confidenceThreshold: value[0] / 100
                      }));
                    }}
                  />
                  <p className="text-xs text-muted-foreground">
                    Higher values mean more accurate but fewer automatic categorizations.
                    Lower values will categorize more invoices but may require more manual reviews.
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="custom-instructions">Custom Instructions (Optional)</Label>
                  <Textarea
                    id="custom-instructions"
                    placeholder="Add specific instructions for how the AI should process your invoices"
                    value={invoicePreferences.customInstructions}
                    onChange={(e) => setInvoicePreferences({
                      ...invoicePreferences,
                      customInstructions: e.target.value
                    })}
                    rows={4}
                  />
                  <p className="text-xs text-muted-foreground">
                    Examples: &quot;Always categorize AWS invoices as Cloud Services&quot; or 
                    &quot;Set all Adobe subscriptions to Software category&quot;
                  </p>
                </div>
              </div>
            </div>
          )}
          
          {/* Step 4: Sample Invoices */}
          {step === 4 && (
            <div className="space-y-6 py-4">
              <div>
                <h2 className="text-xl font-semibold mb-2">Sample Invoices</h2>
                <p className="text-muted-foreground">
                  Upload sample invoices to help the AI learn your specific formats (optional but recommended)
                </p>
              </div>
              
              <div className="space-y-4">
                <div className="border-2 border-dashed rounded-lg p-6 flex flex-col items-center text-center">
                  <Upload className="h-10 w-10 text-muted-foreground mb-4" />
                  <h3 className="font-medium mb-1">Upload Sample Invoices</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    PDF, JPG, or PNG files (max 5 files)
                  </p>
                  <Button asChild>
                    <label className="cursor-pointer">
                      <input 
                        type="file" 
                        className="hidden" 
                        accept=".pdf,.jpg,.jpeg,.png" 
                        multiple
                        onChange={handleFileUpload}
                      />
                      <Upload className="h-4 w-4 mr-2" /> Browse Files
                    </label>
                  </Button>
                </div>
                
                {sampleInvoices.length > 0 && (
                  <div className="space-y-3 mt-4">
                    <h3 className="text-sm font-medium">Uploaded Samples ({sampleInvoices.length}/5)</h3>
                    <div className="space-y-2">
                      {sampleInvoices.map((invoice) => (
                        <div key={invoice.id} className="border rounded-lg p-3 flex justify-between items-center">
                          <div className="flex items-center">
                            <FileText className="h-5 w-5 text-muted-foreground mr-3" />
                            <div>
                              <p className="text-sm font-medium">{invoice.name}</p>
                              {invoice.isUploading ? (
                                <div className="w-24 h-1 bg-muted mt-1">
                                  <div 
                                    className="h-full bg-primary"
                                    style={{ width: `${invoice.uploadProgress}%` }}
                                  />
                                </div>
                              ) : (
                                <p className="text-xs text-muted-foreground">Uploaded</p>
                              )}
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteSample(invoice.id)}
                            disabled={invoice.isUploading}
                          >
                            <Trash2 className="h-4 w-4 text-muted-foreground" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mt-4">
                  <p className="text-sm text-amber-800">
                    <strong>Why upload samples?</strong> Providing sample invoices helps the AI learn
                    your specific invoice formats, making it more accurate at extracting data from your future uploads.
                  </p>
                </div>
              </div>
            </div>
          )}
          
          {/* Step 5: Complete */}
          {step === 5 && (
            <div className="flex flex-col items-center text-center space-y-6 flex-grow justify-center py-8">
              <div className="h-24 w-24 rounded-full bg-green-100 flex items-center justify-center">
                <Check className="h-12 w-12 text-green-600" />
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl font-bold">Setup Complete!</h2>
                <p className="text-muted-foreground max-w-md">
                  Your AI invoice processing system is now set up and ready to use.
                  You can adjust these settings anytime from the AI Settings page.
                </p>
              </div>
              
              <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 mt-4 text-left w-full">
                <h3 className="text-base font-medium mb-2 flex items-center">
                  <Zap className="h-4 w-4 mr-2 text-primary" />
                  What&apos;s Next?
                </h3>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start">
                    <Check className="h-4 w-4 text-green-600 mr-2 mt-0.5" />
                    <span>Upload your first invoice to start processing</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="h-4 w-4 text-green-600 mr-2 mt-0.5" />
                    <span>Review the AI&apos;s categorization suggestions</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="h-4 w-4 text-green-600 mr-2 mt-0.5" />
                    <span>Explore other features like batch processing and reporting</span>
                  </li>
                </ul>
              </div>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-between border-t pt-6">
          {step > 1 ? (
            <Button variant="outline" onClick={prevStep}>
              <ArrowLeft className="h-4 w-4 mr-2" /> Back
            </Button>
          ) : (
            <Button variant="outline" onClick={() => router.push("/dashboard")}>
              Skip Setup
            </Button>
          )}
          
          {step < totalSteps ? (
            <Button onClick={nextStep} disabled={!canProceed()}>
              Continue <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          ) : (
            <Button onClick={handleComplete} disabled={isLoading}>
              {isLoading ? (
                <>
                  <Sparkles className="h-4 w-4 mr-2 animate-spin" />
                  Finalizing...
                </>
              ) : (
                <>
                  Get Started <Zap className="h-4 w-4 ml-2" />
                </>
              )}
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
} 