import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DatePicker } from "@/components/ui/date-picker";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Download, File, CheckCircle, Calendar, ListFilter, FolderPlus, Plus } from "lucide-react";
import * as exportService from "@/lib/services/export-service";

export interface ExportOptions {
  format: 'pdf' | 'excel';
  fields: string[];
  includeAll: boolean;
  dateFrom?: string;
  dateTo?: string;
  folderName?: string;
}

interface ExportModalProps {
  open: boolean;
  onClose: () => void;
  onExport: (options: ExportOptions) => Promise<void>;
  selectedCount: number;
}

export function ExportModal({
  open,
  onClose,
  onExport,
  selectedCount,
}: ExportModalProps) {
  const [exportFormat, setExportFormat] = useState<'pdf' | 'excel'>('excel');
  const [includeAllInvoices, setIncludeAllInvoices] = useState(false);
  const [selectedFields, setSelectedFields] = useState<string[]>([
    'invoiceNumber',
    'vendorName',
    'amount',
    'currency',
    'status',
    'issueDate',
    'dueDate',
  ]);
  const [isExporting, setIsExporting] = useState(false);
  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>({});
  const [folderName, setFolderName] = useState("");
  const [isCreatingNewFolder, setIsCreatingNewFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [existingFolders, setExistingFolders] = useState<string[]>([]);
  const [folderCreated, setFolderCreated] = useState(false);
  const [folderCreationMessage, setFolderCreationMessage] = useState("");
  
  // Fetch existing export folders when modal opens
  useEffect(() => {
    if (open) {
      const fetchFolders = async () => {
        try {
          const { folders } = await exportService.getExportHistory();
          setExistingFolders(folders || []);
          setFolderName("none");
          setIsCreatingNewFolder(false);
          setNewFolderName("");
        } catch (error) {
          console.error("Failed to fetch folders:", error);
        }
      };
      
      fetchFolders();
    }
  }, [open]);

  const handleFieldToggle = (field: string) => {
    if (selectedFields.includes(field)) {
      setSelectedFields(selectedFields.filter(f => f !== field));
    } else {
      setSelectedFields([...selectedFields, field]);
    }
  };

  const handleFolderChange = (value: string) => {
    if (value === "new") {
      setIsCreatingNewFolder(true);
      setFolderName("");
    } else {
      setIsCreatingNewFolder(false);
      setFolderName(value);
    }
  };

  const handleCreateFolder = () => {
    if (newFolderName.trim()) {
      const folderNameTrimmed = newFolderName.trim();
      setFolderName(folderNameTrimmed);
      setIsCreatingNewFolder(false);
      setFolderCreated(true);
      setFolderCreationMessage(`Folder "${folderNameTrimmed}" created`);
      
      // Clear the success message after 3 seconds
      setTimeout(() => {
        setFolderCreated(false);
        setFolderCreationMessage("");
      }, 3000);
    }
  };

  const handleExport = async () => {
    setIsExporting(true);
    
    try {
      // Determine the folder name to use
      let finalFolderName: string | undefined = undefined;
      
      if (folderName && folderName !== 'none') {
        finalFolderName = folderName;
      } else if (isCreatingNewFolder && newFolderName.trim()) {
        finalFolderName = newFolderName.trim();
      }
      
      console.log('Exporting with folder name:', finalFolderName);
      
      const options: ExportOptions = {
        format: exportFormat,
        fields: selectedFields,
        includeAll: includeAllInvoices,
        dateFrom: dateRange.from?.toISOString().split('T')[0],
        dateTo: dateRange.to?.toISOString().split('T')[0],
        folderName: finalFolderName
      };
      
      await onExport(options);
      onClose();
    } catch (error) {
      console.error("Export failed:", error);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Export Invoices</DialogTitle>
          <DialogDescription>
            Export your invoices as a spreadsheet or PDF document.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label className="flex items-center gap-1.5">
              <FolderPlus className="h-4 w-4 text-muted-foreground" />
              Export to Folder
            </Label>
            {folderCreated && (
              <div className="bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400 text-sm py-1.5 px-3 rounded-md mb-2 flex items-center">
                <CheckCircle className="h-4 w-4 mr-2" />
                {folderCreationMessage}
              </div>
            )}
            <div className="grid gap-2">
              {!isCreatingNewFolder ? (
                <Select 
                  value={folderName} 
                  onValueChange={handleFolderChange}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a folder" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No folder</SelectItem>
                    {existingFolders.map((folder) => (
                      <SelectItem key={folder} value={folder}>{folder}</SelectItem>
                    ))}
                    <SelectItem value="new" className="text-primary">
                      <div className="flex items-center gap-2">
                        <span className="size-4 rounded-full bg-primary/10 flex items-center justify-center">
                          <Plus className="h-3 w-3" />
                        </span>
                        Create new folder
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <div className="flex flex-col gap-2">
                  <div className="text-xs text-muted-foreground mb-1">Enter a name for your new folder</div>
                  <div className="flex gap-2">
                    <Input 
                      placeholder="New folder name" 
                      value={newFolderName}
                      onChange={(e) => setNewFolderName(e.target.value)}
                      className="flex-1"
                      autoFocus
                    />
                    <Button 
                      size="sm" 
                      onClick={handleCreateFolder}
                      disabled={!newFolderName.trim()}
                      type="button"
                    >
                      Create
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          <div className="space-y-2">
            <Label className="flex items-center gap-1.5">
              <Download className="h-4 w-4 text-muted-foreground" />
              Export Format
            </Label>
            <div className="flex items-center space-x-2">
              <Tabs defaultValue="excel" onValueChange={(v) => setExportFormat(v as 'excel' | 'pdf')} className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="excel" className="flex items-center gap-2">
                    <File className="h-4 w-4" />
                    Excel
                  </TabsTrigger>
                  <TabsTrigger value="pdf" className="flex items-center gap-2">
                    <Download className="h-4 w-4" />
                    PDF Report
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </div>
          
          {exportFormat === 'pdf' && (
            <div className="mt-2 text-xs text-muted-foreground bg-blue-50 dark:bg-blue-950/30 p-2 rounded-md">
              <p>We'll generate an HTML report that will open in a new tab. You can then use your browser's print function (Ctrl+P or ⌘+P) to save it as a PDF.</p>
            </div>
          )}
          
          <div className="space-y-2">
            <Label className="flex items-center gap-1.5">
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
              Invoices to Include
            </Label>
            <div className="flex items-center p-2 border rounded-md bg-muted/20">
              <Checkbox 
                id="includeAll" 
                checked={includeAllInvoices}
                onCheckedChange={(checked) => setIncludeAllInvoices(checked === true)}
                className="mr-3"
              />
              <Label htmlFor="includeAll" className="cursor-pointer font-normal flex-1">
                {includeAllInvoices
                  ? "Include all invoices"
                  : `Include selected invoices (${selectedCount})`}
              </Label>
            </div>
          </div>
          
          {includeAllInvoices && (
            <div className="space-y-2 p-3 border rounded-md bg-muted/10">
              <Label className="flex items-center gap-1.5 mb-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                Date Range Filter
              </Label>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs mb-1 block">From</Label>
                  <DatePicker
                    date={dateRange.from}
                    setDate={(date: Date | undefined) => 
                      setDateRange(prev => ({ ...prev, from: date || undefined }))
                    }
                  />
                </div>
                <div>
                  <Label className="text-xs mb-1 block">To</Label>
                  <DatePicker
                    date={dateRange.to}
                    setDate={(date: Date | undefined) => 
                      setDateRange(prev => ({ ...prev, to: date || undefined }))
                    }
                  />
                </div>
              </div>
            </div>
          )}
          
          <div className="space-y-2">
            <Label className="flex items-center gap-1.5">
              <ListFilter className="h-4 w-4 text-muted-foreground" />
              Fields to Include
            </Label>
            <div className="border rounded-md p-3 bg-muted/5">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground">Basic Details</p>
                  {[
                    { id: 'invoiceNumber', label: 'Invoice Number' },
                    { id: 'vendorName', label: 'Vendor' },
                    { id: 'amount', label: 'Amount' },
                    { id: 'currency', label: 'Currency' },
                    { id: 'status', label: 'Status' },
                  ].map((field) => (
                    <div key={field.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`field-${field.id}`}
                        checked={selectedFields.includes(field.id)}
                        onCheckedChange={() => handleFieldToggle(field.id)}
                      />
                      <Label
                        htmlFor={`field-${field.id}`}
                        className="cursor-pointer font-normal text-sm"
                      >
                        {field.label}
                      </Label>
                    </div>
                  ))}
                </div>
                
                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground">Additional Information</p>
                  {[
                    { id: 'issueDate', label: 'Issue Date' },
                    { id: 'dueDate', label: 'Due Date' },
                    { id: 'category', label: 'Category' },
                    { id: 'tags', label: 'Tags' },
                    { id: 'notes', label: 'Notes' },
                  ].map((field) => (
                    <div key={field.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`field-${field.id}`}
                        checked={selectedFields.includes(field.id)}
                        onCheckedChange={() => handleFieldToggle(field.id)}
                      />
                      <Label
                        htmlFor={`field-${field.id}`}
                        className="cursor-pointer font-normal text-sm"
                      >
                        {field.label}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="flex justify-between mt-3 pt-3 border-t">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setSelectedFields([])}
                  className="text-xs"
                >
                  Clear all
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setSelectedFields([
                    'invoiceNumber', 'vendorName', 'amount', 'currency', 'status', 
                    'issueDate', 'dueDate', 'category', 'tags', 'notes'
                  ])}
                  className="text-xs"
                >
                  Select all
                </Button>
              </div>
            </div>
          </div>
        </div>
        
        <DialogFooter className="border-t mt-2 pt-4 flex flex-col sm:flex-row gap-2">
          <div className="flex-1 text-sm text-muted-foreground flex gap-2 items-center flex-wrap">
            {selectedFields.length > 0 && (
              <>
                <div className="bg-primary/10 text-primary rounded-full px-2 py-0.5 text-xs font-medium">
                  {selectedFields.length} fields
                </div>
                <span>•</span>
              </>
            )}
            <span>{folderName && folderName !== 'none' ? `Folder: ${folderName}` : 'No folder'}</span>
            {includeAllInvoices && (
              <>
                <span>•</span>
                <span>All invoices</span>
              </>
            )}
            {exportFormat === 'pdf' && (
              <>
                <span>•</span>
                <span className="text-blue-600 dark:text-blue-400">PDF Report</span>
              </>
            )}
          </div>
          <div className="flex gap-2 justify-end">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={isExporting}
              size="sm"
            >
              Cancel
            </Button>
            <Button
              onClick={handleExport}
              disabled={isExporting || selectedFields.length === 0 || (!includeAllInvoices && selectedCount === 0)}
              size="sm"
              className="flex gap-2 items-center"
            >
              {isExporting ? (
                <>
                  <span className="size-4 border-2 border-background/30 border-t-background rounded-full animate-spin"></span>
                  Exporting...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4" />
                  Export {exportFormat === 'excel' ? 'Spreadsheet' : 'PDF Report'}
                </>
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 