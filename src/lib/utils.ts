import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * A utility for constructing className strings conditionally.
 * Combines clsx and tailwind-merge for optimal class handling
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatDate(date: Date | string): string {
  if (!date) return '';
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  // Check if date is valid
  if (isNaN(dateObj.getTime())) return '';
  
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(dateObj);
}

export function truncateText(text: string, maxLength: number): string {
  if (!text || text.length <= maxLength) return text;
  return `${text.substring(0, maxLength)}...`;
}

export function generateTagsFromText(text: string): string[] {
  // This is a simple example - in a real app, you'd want more sophisticated logic,
  // possibly involving AI for better tag extraction
  if (!text) return [];
  
  // Extract potential tag words (excluding common words)
  const commonWords = new Set([
    'the', 'and', 'or', 'a', 'an', 'in', 'on', 'at', 'to', 'for', 'with',
    'by', 'about', 'as', 'of', 'from', 'invoice', 'document', 'receipt',
  ]);
  
  // Split by non-alphanumeric characters, filter, and take unique values
  return [...new Set(
    text.toLowerCase()
      .split(/[^a-z0-9]/)
      .filter(word => word.length > 3 && !commonWords.has(word))
      .slice(0, 5) // Limit to 5 tags
  )];
}
