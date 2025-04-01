export type InvoiceStatus = 'PENDING' | 'PAID' | 'OVERDUE' | 'CANCELLED';
export type InvoiceCategory = Category;

export interface Invoice {
  id: string;
  invoiceNumber?: string | null;
  title?: string | null;
  vendorName?: string | null;
  issueDate?: Date | null;
  dueDate?: Date | null;
  amount?: number | null;
  totalAmount?: number | null; // Alias for amount for backward compatibility
  taxAmount?: number | null;
  description?: string | null;
  currency?: string | null;
  status: InvoiceStatus;
  notes?: string | null;
  tags?: string[];
  categoryId?: string | null;
  category?: Category | null;
  vendorId?: string | null;
  vendor?: Vendor | null;
  originalFileUrl?: string | null;
  thumbnailUrl?: string | null;
  extractedData?: Record<string, unknown>;
  languageCode?: string | null;
  createdAt: Date;
  updatedAt: Date;
  userId: string;
  organizationId?: string | null;
}

export interface Category {
  id: string;
  name: string;
  description?: string | null;
  color?: string | null;
  icon?: string | null;
  createdAt: Date;
  updatedAt: Date;
  userId: string;
  organizationId?: string | null;
}

export interface Vendor {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  website?: string | null;
  address?: string | null;
  notes?: string | null;
  logoUrl?: string | null;
  createdAt: Date;
  updatedAt: Date;
  userId: string;
  organizationId?: string | null;
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

export interface ExtractedInvoiceData {
  invoiceNumber?: string;
  vendorName?: string;
  issueDate?: string;
  dueDate?: string;
  amount?: number;
  currency?: string;
  items?: InvoiceItem[];
  tax?: number;
  notes?: string;
  language?: string;
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