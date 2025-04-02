"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Upload, Trash2, X, RefreshCw, Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import { AISettings } from "@/lib/types";
import { saveAISettings, loadAISettings, uploadSampleInvoice, deleteSampleInvoice } from "@/lib/services/ai-service";

interface AISettingsProps {
  initialSettings?: AISettings;
  existingCategories: string[];
}

export default function AISettingsComponent({ initialSettings, existingCategories }: AISettingsProps) {
  const [settings, setSettings] = useState<AISettings>({
    customInstructions: initialSettings?.customInstructions || '',
    confidenceThreshold: initialSettings?.confidenceThreshold || 0.7,
    preferredCategories: initialSettings?.preferredCategories || [],
    sampleInvoiceUrls: initialSettings?.sampleInvoiceUrls || []
  });
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [newCategory, setNewCategory] = useState('');
  const [sampleFile, setSampleFile] = useState<File | null>(null);
  const [sampleFilePreview, setSampleFilePreview] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [newInstruction, setNewInstruction] = useState('');
  
  // Sample instructions for users to choose from
  const sampleInstructions = [
    "Always categorize utilities to 'Utilities'",
    "Treat all Adobe subscriptions as 'Software'",
    "Mark all invoices above $1000 as high priority",
    "For vendors containing 'AWS' or 'Amazon', categorize as 'Cloud Services'",
    "Set invoice type to PAYMENT when the document has 'Invoice to' field"
  ];
  
  // Load settings from backend when component mounts
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setLoading(true);
        const aiSettings = await loadAISettings();
        
        if (aiSettings) {
          setSettings(aiSettings);
        }
      } catch (error) {
        console.error("Error loading AI settings:", error);
        toast.error("Failed to load AI settings");
      } finally {
        setLoading(false);
      }
    };
    
    fetchSettings();
  }, []);
  
  // Handle file upload for sample invoices
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    const file = e.target.files[0];
    setSampleFile(file);
    
    // Create preview URL
    setSampleFilePreview(URL.createObjectURL(file));
    
    // Start upload immediately if auto-upload is enabled
    if (true) {
      await handleUploadInvoice(file);
    }
  };
  
  // Handle upload of sample invoice
  const handleUploadInvoice = async (file: File) => {
    if (!file) return;
    
    setUploading(true);
    setUploadProgress(0);
    
    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          const newProgress = prev + 10;
          if (newProgress >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return newProgress;
        });
      }, 300);
      
      // Upload to server using the imported function
      const fileUrl = await uploadSampleInvoice(file);
      clearInterval(progressInterval);
      setUploadProgress(100);
      
      if (fileUrl) {
        // Add to settings
        setSettings(prev => ({
          ...prev,
          sampleInvoiceUrls: [...prev.sampleInvoiceUrls, fileUrl]
        }));
        
        // Reset state
        setSampleFile(null);
        setSampleFilePreview(null);
        
        toast.success("Sample invoice uploaded successfully");
      }
    } catch (error) {
      console.error("Error uploading sample invoice:", error);
      toast.error("Failed to upload sample invoice");
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };
  
  // Handle deletion of sample invoice
  const handleDeleteSampleInvoice = async (url: string) => {
    try {
      setUploading(true);
      
      // Delete the sample invoice
      const success = await deleteSampleInvoice(url);
      
      if (success) {
        // Remove from settings
        setSettings(prev => ({
          ...prev,
          sampleInvoiceUrls: prev.sampleInvoiceUrls.filter(u => u !== url)
        }));
        
        toast.success("Sample invoice deleted successfully");
      }
    } catch (error) {
      console.error("Error deleting sample invoice:", error);
      toast.error("Failed to delete sample invoice");
    } finally {
      setUploading(false);
    }
  };
  
  // Add a preferred category
  const addPreferredCategory = () => {
    if (!newCategory) return;
    
    if (!settings.preferredCategories.includes(newCategory)) {
      setSettings(prev => ({
        ...prev,
        preferredCategories: [...prev.preferredCategories, newCategory]
      }));
      setNewCategory("");
    }
  };
  
  // Remove a preferred category
  const removePreferredCategory = (category: string) => {
    setSettings(prev => ({
      ...prev,
      preferredCategories: prev.preferredCategories.filter(c => c !== category)
    }));
  };
  
  // Add a custom instruction
  const addCustomInstruction = () => {
    if (!newInstruction) return;
    
    const currentInstructions = settings.customInstructions || "";
    const updatedInstructions = currentInstructions 
      ? `${currentInstructions}\n- ${newInstruction}`
      : `- ${newInstruction}`;
    
    setSettings(prev => ({
      ...prev,
      customInstructions: updatedInstructions
    }));
    
    setNewInstruction("");
  };
  
  // Add a sample instruction
  const addSampleInstruction = (instruction: string) => {
    const currentInstructions = settings.customInstructions || "";
    const updatedInstructions = currentInstructions 
      ? `${currentInstructions}\n- ${instruction}`
      : `- ${instruction}`;
    
    setSettings(prev => ({
      ...prev,
      customInstructions: updatedInstructions
    }));
  };
  
  // Reset AI settings to default
  const resetSettings = async () => {
    if (confirm("Are you sure you want to reset all AI settings to default?")) {
      try {
        setLoading(true);
        
        const defaultSettings = {
          customInstructions: "",
          confidenceThreshold: 0.7,
          preferredCategories: [],
          sampleInvoiceUrls: [],
        };
        
        setSettings(defaultSettings);
        
        // Save the default settings
        await saveAISettings(defaultSettings);
        
        toast.info("AI settings have been reset to default");
      } catch (error) {
        console.error("Error resetting AI settings:", error);
        toast.error("Failed to reset AI settings");
      } finally {
        setLoading(false);
      }
    }
  };
  
  // Save settings to backend
  const handleSaveSettings = async () => {
    try {
      setLoading(true);
      
      // Save the settings using the API service
      const success = await saveAISettings(settings);
      
      if (success) {
        toast.success("AI settings saved successfully");
      } else {
        throw new Error("Failed to save settings");
      }
    } catch (error) {
      console.error("Error saving AI settings:", error);
      toast.error("Failed to save AI settings");
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            AI Processing Configuration
          </CardTitle>
          <CardDescription>
            Customize how the AI processes your invoices and learns from your data
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Confidence Threshold */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="confidence-threshold" className="text-base">
                Confidence Threshold
              </Label>
              <span className="text-sm font-medium">
                {Math.round(settings.confidenceThreshold * 100)}%
              </span>
            </div>
            <div className="px-1">
              <Slider
                id="confidence-threshold"
                value={[settings.confidenceThreshold * 100]}
                min={50}
                max={95}
                step={5}
                onValueChange={(value) => {
                  setSettings(prev => ({
                    ...prev,
                    confidenceThreshold: value[0] / 100
                  }));
                }}
              />
            </div>
            <p className="text-sm text-muted-foreground">
              Set how confident the AI needs to be before automatically categorizing invoices. 
              Higher values mean fewer automatic categorizations but higher accuracy.
            </p>
          </div>
          
          {/* Preferred Categories */}
          <div className="space-y-4 border-t pt-6">
            <div>
              <Label htmlFor="preferred-categories" className="text-base">Preferred Categories</Label>
              <p className="text-sm text-muted-foreground mt-1 mb-4">
                Specify categories the AI should prioritize when categorizing invoices
              </p>
            </div>
            
            <div className="flex flex-wrap gap-2 mb-4">
              {settings.preferredCategories.map((category, index) => (
                <Badge key={index} variant="secondary" className="flex items-center gap-1">
                  {category}
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-4 w-4 p-0 ml-1 text-muted-foreground hover:text-foreground"
                    onClick={() => removePreferredCategory(category)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              ))}
              {settings.preferredCategories.length === 0 && (
                <p className="text-sm text-muted-foreground">No preferred categories selected</p>
              )}
            </div>
            
            <div className="flex gap-2">
              <Input
                id="new-category"
                placeholder="New category..."
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                list="category-suggestions"
              />
              <datalist id="category-suggestions">
                {existingCategories.map((category, index) => (
                  <option key={index} value={category} />
                ))}
              </datalist>
              <Button 
                variant="outline" 
                onClick={addPreferredCategory}
                disabled={!newCategory}
              >
                Add
              </Button>
            </div>
          </div>
          
          {/* Custom Instructions */}
          <div className="space-y-4 border-t pt-6">
            <div>
              <Label htmlFor="custom-instructions" className="text-base">Custom Instructions</Label>
              <p className="text-sm text-muted-foreground mt-1 mb-4">
                Add specific instructions for how the AI should process your invoices
              </p>
            </div>
            
            <Textarea
              id="custom-instructions"
              value={settings.customInstructions || ""}
              onChange={(e) => setSettings(prev => ({
                ...prev,
                customInstructions: e.target.value
              }))}
              placeholder="Enter custom instructions for the AI..."
              rows={6}
            />
            
            <div>
              <div className="flex gap-2">
                <Input
                  placeholder="Add instruction..."
                  value={newInstruction}
                  onChange={(e) => setNewInstruction(e.target.value)}
                />
                <Button 
                  variant="outline" 
                  onClick={addCustomInstruction}
                  disabled={!newInstruction}
                >
                  Add
                </Button>
              </div>
              
              <div className="mt-4">
                <p className="text-sm font-medium mb-2">Quick Instructions:</p>
                <div className="flex flex-wrap gap-2">
                  {sampleInstructions.map((instruction, index) => (
                    <Badge 
                      key={index} 
                      variant="outline" 
                      className="cursor-pointer hover:bg-primary/10"
                      onClick={() => addSampleInstruction(instruction)}
                    >
                      + {instruction}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </div>
          
          {/* Sample Invoices for Learning */}
          <div className="space-y-4 border-t pt-6">
            <div>
              <Label className="text-base">Sample Invoices</Label>
              <p className="text-sm text-muted-foreground mt-1 mb-4">
                Upload examples of your invoices to help the AI learn your specific formats
              </p>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {/* Existing sample invoices */}
              {settings.sampleInvoiceUrls.map((url, index) => (
                <div key={index} className="border rounded-md p-2 flex flex-col">
                  <div className="aspect-[4/5] bg-slate-100 rounded-md mb-2 overflow-hidden">
                    <img 
                      src={url} 
                      alt={`Sample invoice ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs self-end text-red-500 hover:text-red-700 hover:bg-red-50"
                    onClick={() => handleDeleteSampleInvoice(url)}
                    disabled={loading}
                  >
                    <Trash2 className="h-3 w-3 mr-1" /> Remove
                  </Button>
                </div>
              ))}
              
              {/* Upload new sample */}
              {sampleFilePreview ? (
                <div className="border rounded-md p-2 flex flex-col">
                  <div className="aspect-[4/5] bg-slate-100 rounded-md mb-2 overflow-hidden">
                    <img 
                      src={sampleFilePreview} 
                      alt="New sample preview"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex justify-between items-center">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs"
                      onClick={() => {
                        setSampleFile(null);
                        setSampleFilePreview(null);
                      }}
                    >
                      <X className="h-3 w-3 mr-1" /> Cancel
                    </Button>
                    <Button
                      variant="outline" 
                      size="sm"
                      className="text-xs"
                      onClick={() => handleUploadInvoice(sampleFile!)}
                      disabled={uploading || !sampleFile}
                    >
                      {uploading ? (
                        <>
                          <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                          Uploading...
                        </>
                      ) : (
                        <>
                          <Upload className="mr-2 h-3 w-3" />
                          Upload
                        </>
                      )}
                    </Button>
                  </div>
                  {uploadProgress > 0 && (
                    <div className="w-full bg-slate-200 h-1 mt-2 rounded-full overflow-hidden">
                      <div 
                        className="bg-primary h-full transition-all duration-300 ease-in-out" 
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                  )}
                </div>
              ) : (
                <label className="border border-dashed rounded-md p-4 flex flex-col items-center justify-center cursor-pointer hover:bg-muted/50 transition-colors">
                  <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                  <p className="text-sm font-medium">Upload Sample</p>
                  <p className="text-xs text-muted-foreground">PDF, JPG, or PNG</p>
                  <input 
                    type="file" 
                    accept=".pdf,.jpg,.jpeg,.png" 
                    className="hidden" 
                    onChange={handleFileUpload}
                  />
                </label>
              )}
            </div>
            
            <p className="text-sm text-muted-foreground">
              Add examples of your typical invoices so the AI can learn your specific formats. 
              We recommend at least 3 samples for optimal results.
            </p>
          </div>
        </CardContent>
        <CardFooter className="flex justify-end gap-2">
          <Button variant="outline" onClick={resetSettings} disabled={loading}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Reset to Default
          </Button>
          <Button onClick={handleSaveSettings} disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Settings
              </>
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
} 