export type InvoiceStatus = 'PENDING' | 'PAID' | 'OVERDUE' | 'CANCELLED';

export type InvoiceType = 'PURCHASE' | 'PAYMENT';

export interface InvoiceLineItem {
  id?: string;
  description: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  taxRate?: number;
  taxAmount?: number;
  discount?: number;
  productSku?: string;
  notes?: string;
  invoiceId?: string;
  attributes?: LineItemAttribute[];
}

export interface LineItemAttribute {
  id?: string;
  name: string;
  value: string;
  lineItemId?: string;
}

export interface AISettings {
  id?: string;
  customInstructions?: string;
  confidenceThreshold: number;
  preferredCategories: string[];
  sampleInvoiceUrls: string[];
  userId?: string;
}

export interface ExtractedInvoiceData {
  invoiceNumber?: string;
  vendorName?: string;
  issueDate?: string;
  dueDate?: string;
  amount?: number;
  currency?: string;
  items?: InvoiceLineItem[];
  tax?: number;
  notes?: string;
  language?: string;
  confidence?: number;
  invoiceType?: InvoiceType;
  [key: string]: string | number | boolean | undefined | null | InvoiceLineItem[] | Date; // Custom fields with specific types
}

export interface Category {
  id: string;
  name: string;
  description?: string;
  color?: string;
  icon?: string;
}

export interface Vendor {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  website?: string;
  address?: string;
  notes?: string;
  logoUrl?: string;
}

export interface Invoice {
  id: string;
  invoiceNumber?: string;
  title?: string;
  vendorName?: string;
  issueDate?: Date;
  dueDate?: Date;
  amount?: number;
  currency?: string;
  status: InvoiceStatus;
  invoiceType: InvoiceType;
  notes?: string;
  tags?: string[];
  category?: Category;
  vendor?: Vendor;
  originalFileUrl?: string;
  thumbnailUrl?: string;
  extractedData?: ExtractedInvoiceData;
  languageCode?: string;
  lineItems?: InvoiceLineItem[];
  createdAt?: Date;
  updatedAt?: Date;
}

export interface User {
  id: string;
  clerkId: string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  profileImageUrl?: string | null;
  createdAt: Date;
  updatedAt: Date;
  role: 'ADMIN' | 'EDITOR' | 'USER' | 'VIEWER';
}

export interface Organization {
  id: string;
  name: string;
  logoUrl?: string | null;
  industry?: string | null;
  size?: 'small' | 'medium' | 'large';
  invoiceVolume?: 'low' | 'medium' | 'high';
  createdAt: Date;
  updatedAt: Date;
}

// OCR related types
export interface InvoiceFieldConfig {
  id: string;
  label: string;
  description: string;
  required?: boolean;
}

export interface InvoiceItem {
  description: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface OCRResult {
  extractedData: ExtractedInvoiceData;
  suggestedCategories: string[];
}

// Onboarding data type
export interface OnboardingData {
  organization: {
    name: string;
    industry?: string;
    size: 'small' | 'medium' | 'large';
    invoiceVolume: 'low' | 'medium' | 'high';
  };
  aiSettings: AISettings;
}

export interface InventoryItem {
  id: string;
  productName: string;
  description?: string;
  sku?: string;
  currentQuantity: number;
  unitOfMeasure?: string;
  category?: string;
  lastUpdated: Date;
  createdAt: Date;
  attributes?: InventoryAttribute[];
}

export interface InventoryAttribute {
  id: string;
  name: string;
  value: string;
  inventoryId: string;
}

export interface InventoryHistory {
  id: string;
  inventoryId: string;
  previousQuantity: number;
  newQuantity: number;
  changeReason: 'PURCHASE' | 'SALE' | 'ADJUSTMENT' | 'RETURN';
  invoiceId?: string;
  timestamp: Date;
  notes?: string;
}

export interface AIFeedbackData {
  id: string;
  userId: string;
  invoiceId: string;
  field: string;
  originalValue: string;
  correctedValue: string;
  vendorName?: string;
  confidence: number;
  feedbackType: 'EXTRACTION' | 'CATEGORY' | 'VENDOR' | 'ATTRIBUTE';
  timestamp: Date;
}          