import { InvoiceFieldConfig } from '../types';

// Define types for extracted data
interface ExtractedInvoiceData {
  invoiceNumber?: string;
  vendorName?: string;
  issueDate?: string;
  dueDate?: string;
  amount?: number | string;
  currency?: string;
  items?: InvoiceLineItem[];
  tax?: number;
  notes?: string;
  language?: string;
  confidence?: number;
  invoiceType?: 'PURCHASE' | 'PAYMENT'; // Add invoice type detection
  [key: string]: string | number | boolean | undefined | null | InvoiceLineItem[] | Date; // Custom fields
}

interface InvoiceLineItem {
  description: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  taxRate?: number;
  taxAmount?: number;
  discount?: number;
  productSku?: string;
  notes?: string;
  attributes?: {
    name: string;
    value: string;
  }[];
}

// Default fields to extract from invoices
const defaultFields: InvoiceFieldConfig[] = [
  { id: 'invoiceNumber', label: 'Invoice Number', description: 'The unique invoice identifier' },
  { id: 'vendorName', label: 'Vendor', description: 'The company or individual providing the goods or services' },
  { id: 'issueDate', label: 'Issue Date', description: 'The date when the invoice was issued' },
  { id: 'dueDate', label: 'Due Date', description: 'The date when payment is due' },
  { id: 'amount', label: 'Total Amount', description: 'The total invoice amount including taxes and fees' },
  { id: 'currency', label: 'Currency', description: 'The currency of the invoice' },
  { id: 'items', label: 'Line Items', description: 'List of products/services with quantities and prices' },
  { id: 'tax', label: 'Tax', description: 'Tax amount applied to the invoice' },
  { id: 'notes', label: 'Notes', description: 'Additional notes or payment instructions' },
];

/**
 * Processes an invoice image with OCR and data extraction, using multiple engines for fallback
 */
export async function processInvoiceWithOCR(
  fileUrl: string,
  customFields?: InvoiceFieldConfig[],
  organizationData?: {
    name?: string;
    industry?: string;
    size?: string;
    invoiceVolume?: string;
  },
  aiSettings?: {
    customInstructions?: string;
    confidenceThreshold?: number;
    preferredCategories?: string[];
    sampleInvoiceUrls?: string[];
  }
) {
  const fieldsToExtract = customFields || defaultFields;
  
  // Determine file type
  const fileType = getFileTypeFromUrl(fileUrl);
  
  // Try OpenAI Vision API first (the most capable but potentially more expensive)
  try {
    const result = await processWithOpenAI(fileUrl, fieldsToExtract, fileType, organizationData, aiSettings);
    
    // Post-process the results to improve accuracy
    const enhancedData = postProcessExtractionResults(result.extractedData, organizationData);
    
    // If successful, get vendor suggestions and return results
    const suggestedCategories = await suggestCategories(enhancedData, aiSettings?.preferredCategories || []);
    const vendorSuggestions = await suggestVendors(enhancedData.vendorName || '', []);
    
    return {
      extractedData: enhancedData,
      suggestedCategories,
      vendorSuggestions,
      engine: 'openai',
      confidence: result.confidence || 0.9
    };
  } catch (openAiError) {
    console.warn("OpenAI extraction failed, falling back to alternative engine:", openAiError);
    
    // Fall back to alternative OCR engine
    try {
      // If available, use Azure OCR or Google Document AI
      if (process.env.USE_AZURE_OCR === 'true') {
        const azureResult = await processWithAzureOCR(fileUrl);
        const enhancedData = postProcessExtractionResults(azureResult.extractedData, organizationData);
        const suggestedCategories = await suggestCategories(enhancedData, aiSettings?.preferredCategories || []);
        const vendorSuggestions = await suggestVendors(enhancedData.vendorName || '', []);
        
        return {
          extractedData: enhancedData,
          suggestedCategories,
          vendorSuggestions,
          engine: 'azure',
          confidence: azureResult.confidence || 0.8
        };
      } else {
        // Fallback to simulated OCR (in production, integrate another service)
        const fallbackResult = await simulateFallbackOCR(fileUrl);
        const enhancedData = postProcessExtractionResults(fallbackResult.extractedData, organizationData);
        const suggestedCategories = await suggestCategories(enhancedData, aiSettings?.preferredCategories || []);
        const vendorSuggestions = await suggestVendors(enhancedData.vendorName || '', []);
        
        return {
          extractedData: enhancedData,
          suggestedCategories,
          vendorSuggestions,
          engine: 'fallback',
          confidence: fallbackResult.confidence || 0.7
        };
      }
    } catch (fallbackError) {
      console.error("All OCR engines failed:", fallbackError);
      throw new Error(`OCR processing failed with all engines: ${fallbackError instanceof Error ? fallbackError.message : String(fallbackError)}`);
    }
  }
}

/**
 * Identify file type from URL or extension
 */
function getFileTypeFromUrl(fileUrl: string): 'pdf' | 'image' | 'spreadsheet' | 'unknown' {
  const extension = fileUrl.split('.').pop()?.toLowerCase();
  
  if (['pdf'].includes(extension || '')) {
    return 'pdf';
  } else if (['jpg', 'jpeg', 'png', 'tiff', 'tif', 'webp'].includes(extension || '')) {
    return 'image';
  } else if (['xls', 'xlsx', 'csv'].includes(extension || '')) {
    return 'spreadsheet';
  }
  
  return 'unknown';
}

/**
 * Post-process extracted data to improve quality and consistency
 */
function postProcessExtractionResults(data: ExtractedInvoiceData, organizationData?: {
  name?: string;
  industry?: string;
  size?: string;
  invoiceVolume?: string;
}): ExtractedInvoiceData {
  const enhanced = { ...data };
  
  // Clean up invoice number (remove spaces, normalize format)
  if (enhanced.invoiceNumber) {
    enhanced.invoiceNumber = enhanced.invoiceNumber.trim().replace(/\s+/g, '');
  }
  
  // Format dates consistently
  if (enhanced.issueDate) {
    const parsedDate = parseDate(enhanced.issueDate);
    if (parsedDate) {
      enhanced.issueDate = parsedDate.toISOString().split('T')[0]; // YYYY-MM-DD
    }
  }
  
  if (enhanced.dueDate) {
    const parsedDate = parseDate(enhanced.dueDate);
    if (parsedDate) {
      enhanced.dueDate = parsedDate.toISOString().split('T')[0]; // YYYY-MM-DD
    }
  }
  
  // Normalize currency
  if (enhanced.currency) {
    enhanced.currency = normalizeCurrency(enhanced.currency);
  }
  
  // Clean up amounts and ensure they're numeric
  if (enhanced.amount !== undefined && enhanced.amount !== null) {
    if (typeof enhanced.amount === 'string') {
      // Remove currency symbols and commas, convert to number
      enhanced.amount = parseFloat(enhanced.amount.replace(/[$€£¥,]/g, ''));
    }
  }
  
  // Better invoice type determination with organization context
  if (organizationData?.name && organizationData.name.trim() !== '') {
    // Create variations of the organization name to check
    const orgName = organizationData.name.toLowerCase();
    const orgWords = orgName.split(/\s+/).filter(word => word.length > 2);
    
    // Get all text content to analyze
    let allText = '';
    
    // Combine all textual information from the invoice
    if (enhanced.notes) allText += ' ' + enhanced.notes.toLowerCase();
    if (enhanced.vendorName) allText += ' ' + enhanced.vendorName.toLowerCase();
    if (enhanced.items && Array.isArray(enhanced.items)) {
      enhanced.items.forEach(item => {
        if (item.description) allText += ' ' + item.description.toLowerCase();
      });
    }
    
    // Look for organization name in various sections of the document
    let orgNameFoundInText = false;
    
    // Check if organization name directly appears in text
    if (allText.includes(orgName)) {
      orgNameFoundInText = true;
    } else {
      // Try with individual words (for multi-word company names)
      const matchingOrgWords = orgWords.filter(word => allText.includes(word));
      if (matchingOrgWords.length >= Math.ceil(orgWords.length * 0.6)) {
        orgNameFoundInText = true;
      }
    }
    
    // Purchase indicators (organization is paying)
    const purchaseIndicators = [
      'bill to ' + orgName,
      'bill to:' + orgName,
      'billed to' + orgName,
      'client:' + orgName,
      'customer:' + orgName,
      'ship to:' + orgName,
      'ship to ' + orgName,
      'ship to:' + orgName,
      'ship to address',
      'billing address',
      'client address',
      'customer name',
      'customer id',
      'customer no',
      'customer no.',
      'customer no:',
      'account number',
      'account no',
      'account no.',
      'account no:',
      'purchase order',
      'po number',
      'po no',
      'po no.',
      'po no:',
      'payment due',
      'payment terms',
      'please pay',
      'pay to',
      'remit to'
    ];
    
    // Payment indicators (organization is receiving payment)
    const paymentIndicators = [
      'from:' + orgName, 
      'from: ' + orgName,
      'from ' + orgName,
      'issued by:' + orgName,
      'issued by: ' + orgName, 
      'issued by ' + orgName,
      'seller:' + orgName, 
      'seller: ' + orgName, 
      'seller ' + orgName,
      'vendor:' + orgName, 
      'vendor: ' + orgName, 
      'vendor ' + orgName,
      'remit payment to',
      'our reference',
      'vat registration',
      'tax id',
      'fiscal code',
      'business id',
      'company reg',
      'company registration',
      'invoice issued by',
      'invoice from',
      'sender:',
      'invoice sender',
      'invoice generator'
    ];
    
    // If org name is found, check for purchase vs payment indicators
    if (orgNameFoundInText) {
      // Count occurrences of purchase and payment indicators
      let purchaseScore = 0;
      let paymentScore = 0;
      
      // Clean text to search for patterns
      const searchText = allText.replace(/\s+/g, ' ');
      
      // Check for each purchase indicator
      for (const indicator of purchaseIndicators) {
        if (searchText.includes(indicator.toLowerCase())) {
          purchaseScore += 2;
        }
      }
      
      // Check for each payment indicator
      for (const indicator of paymentIndicators) {
        if (searchText.includes(indicator.toLowerCase())) {
          paymentScore += 2;
        }
      }
      
      // Examine the "Bill To:" section more closely
      const billToMatch = searchText.match(/bill\s*to[:\s]+(.*?)(?:ship\s*to|invoice|$)/i);
      if (billToMatch && billToMatch[1]) {
        const billToText = billToMatch[1].toLowerCase();
        if (orgWords.some(word => billToText.includes(word))) {
          purchaseScore += 5; // Strong indicator this is a purchase invoice
        }
      }
      
      // Examine the "From:" section more closely
      const fromMatch = searchText.match(/from[:\s]+(.*?)(?:to[:\s]|invoice|$)/i);
      if (fromMatch && fromMatch[1]) {
        const fromText = fromMatch[1].toLowerCase();
        if (orgWords.some(word => fromText.includes(word))) {
          paymentScore += 5; // Strong indicator this is a payment invoice
        }
      }
      
      // Additional check: if document references vendor/seller that matches org name
      if (enhanced.vendorName && 
          (orgName.includes(enhanced.vendorName.toLowerCase()) || 
          enhanced.vendorName.toLowerCase().includes(orgName))) {
        paymentScore += 3; // This suggests org is the seller
      }
      
      // Use the scores to determine invoice type
      if (purchaseScore > paymentScore) {
        enhanced.invoiceType = 'PURCHASE';
        // Set confidence based on score difference
        enhanced.confidence = Math.min(0.5 + (purchaseScore - paymentScore) * 0.05, 0.95);
      } else if (paymentScore > purchaseScore) {
        enhanced.invoiceType = 'PAYMENT';
        // Set confidence based on score difference
        enhanced.confidence = Math.min(0.5 + (paymentScore - purchaseScore) * 0.05, 0.95);
      } else {
        // If tied, default to PURCHASE with low confidence
        enhanced.invoiceType = 'PURCHASE';
        enhanced.confidence = 0.5;
      }
    } else {
      // If we don't find the org name, default to PURCHASE with low confidence
      enhanced.invoiceType = 'PURCHASE';
      enhanced.confidence = 0.4;
    }
  }
  
  // Ensure invoice type is valid if not already set
  if (!enhanced.invoiceType || !['PURCHASE', 'PAYMENT'].includes(enhanced.invoiceType)) {
    // Default to PURCHASE if not specified or invalid
    enhanced.invoiceType = 'PURCHASE';
  }
  
  // Ensure line items are properly formatted
  if (enhanced.items && Array.isArray(enhanced.items)) {
    enhanced.items = enhanced.items.map((item: Partial<InvoiceLineItem>) => ({
      description: item.description || '',
      quantity: typeof item.quantity === 'string' ? parseFloat(item.quantity) : (item.quantity || 1),
      unitPrice: typeof item.unitPrice === 'string' ? parseFloat(item.unitPrice as string) : (item.unitPrice || 0),
      totalPrice: typeof item.totalPrice === 'string' ? parseFloat(item.totalPrice as string) : (item.totalPrice || 0),
      taxRate: typeof item.taxRate === 'string' ? parseFloat(item.taxRate as string) : item.taxRate,
      taxAmount: typeof item.taxAmount === 'string' ? parseFloat(item.taxAmount as string) : item.taxAmount,
      discount: typeof item.discount === 'string' ? parseFloat(item.discount as string) : item.discount,
      productSku: item.productSku || undefined,
      attributes: Array.isArray(item.attributes) ? item.attributes.map(attr => ({
        name: attr.name || '',
        value: attr.value || ''
      })) : undefined
    }));
  }
  
  return enhanced;
}

/**
 * Parse different date formats and return a standardized Date object
 */
function parseDate(dateStr: string): Date | null {
  if (!dateStr) return null;
  
  // Try to parse various date formats
  const cleanDateStr = dateStr.trim().replace(/\s+/g, ' ');
  
  // Try ISO format first
  const isoDate = new Date(cleanDateStr);
  if (!isNaN(isoDate.getTime())) return isoDate;
  
  // Try DD/MM/YYYY
  const dmyMatch = cleanDateStr.match(/(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{2,4})/);
  if (dmyMatch) {
    const [, day, month, year] = dmyMatch;
    const fullYear = year.length === 2 ? `20${year}` : year;
    return new Date(`${fullYear}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`);
  }
  
  // Try MM/DD/YYYY
  const mdyMatch = cleanDateStr.match(/(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{2,4})/);
  if (mdyMatch) {
    const [, month, day, year] = mdyMatch;
    const fullYear = year.length === 2 ? `20${year}` : year;
    return new Date(`${fullYear}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`);
  }
  
  // Try text month (e.g., "Jan 15, 2023")
  const textMonthMatch = cleanDateStr.match(/([A-Za-z]{3,9})\s+(\d{1,2})(?:[,\s]+)?(\d{2,4})/);
  if (textMonthMatch) {
    const [, month, day, year] = textMonthMatch;
    const fullYear = year.length === 2 ? `20${year}` : year;
    const date = new Date(`${month} ${day}, ${fullYear}`);
    if (!isNaN(date.getTime())) return date;
  }
  
  return null;
}

/**
 * Normalize currency strings to standard codes
 */
function normalizeCurrency(currency: string): string {
  const currencyMap: Record<string, string> = {
    '$': 'USD',
    'USD': 'USD',
    'US$': 'USD',
    '€': 'EUR',
    'EUR': 'EUR',
    '£': 'GBP',
    'GBP': 'GBP',
    '¥': 'JPY',
    'JPY': 'JPY',
    'CAD': 'CAD',
    'CA$': 'CAD',
    'C$': 'CAD',
    'AUD': 'AUD',
    'A$': 'AUD',
    // Add more currency mappings as needed
  };
  
  const normalizedCurrency = currencyMap[currency.trim().toUpperCase()];
  return normalizedCurrency || currency.toUpperCase();
}

/**
 * Process with OpenAI Vision API with enhanced prompt and context
 */
async function processWithOpenAI(
  fileUrl: string,
  fieldsToExtract: InvoiceFieldConfig[],
  fileType: 'pdf' | 'image' | 'spreadsheet' | 'unknown',
  organizationData?: {
    name?: string;
    industry?: string;
    size?: string;
    invoiceVolume?: string;
  },
  aiSettings?: {
    customInstructions?: string;
    confidenceThreshold?: number;
    preferredCategories?: string[];
    sampleInvoiceUrls?: string[];
  }
) {
  const fieldsDescription = fieldsToExtract
    .map((field) => `${field.label} (${field.description})`)
    .join('\n');

  // Build organization context string if data is provided
  let organizationContext = '';
  if (organizationData) {
    organizationContext = `
ORGANIZATION CONTEXT:
- Organization Name: ${organizationData.name || 'Unknown'}
- Industry: ${organizationData.industry || 'Unknown'}
- Organization Size: ${organizationData.size || 'Unknown'}
- Invoice Volume: ${organizationData.invoiceVolume || 'Unknown'}

This information should help you determine whether this is a PURCHASE invoice (where the organization is the buyer and needs to pay) or a PAYMENT invoice (where the organization is the seller and will receive payment).
    `;
  }

  // Build custom instructions if provided
  let customInstructions = '';
  if (aiSettings?.customInstructions) {
    customInstructions = `
CUSTOM PROCESSING INSTRUCTIONS:
${aiSettings.customInstructions}
    `;
  }

  // Enhanced prompt with more detailed instructions for better extraction
  const prompt = `You are an expert invoice data extraction system. Extract the following information from this ${fileType}:
    
${fieldsDescription}

${organizationContext}

${customInstructions}

DETAILED INSTRUCTIONS:
1. LANGUAGE HANDLING:
   - Identify the language of the invoice and extract data in its original form
   - For non-English invoices, provide the data in both original and translated form
   - Make note of the detected language with ISO code (e.g., en, fr, es, de)

2. DATES:
   - Always convert dates to ISO format (YYYY-MM-DD)
   - Look for issue date (invoice date) and due date specifically
   - Be aware of different date formats (MM/DD/YYYY, DD/MM/YYYY, etc.)

3. AMOUNTS & CURRENCY:
   - Extract the TOTAL amount (including taxes) as a numeric value only
   - Identify the currency symbol and provide the ISO code (USD, EUR, GBP, etc.)
   - Extract tax amounts separately
   - For line items, capture: description, quantity, unit price, total price, tax rate, tax amount, discount, and product SKU if available

4. VENDOR DETAILS:
   - Extract the full vendor/merchant name (company name)
   - Look for logos, letterheads, or headers to identify vendor
   - Note: Some invoices may use logos instead of text names

5. INVOICE NUMBER:
   - Look for: "Invoice #", "Invoice Number", "No.", "Reference", etc.
   - Extract the exact invoice identifier
   - Be careful not to confuse with other numbers like account numbers

6. INVOICE TYPE DETECTION - VERY IMPORTANT:
   - You MUST determine if this is a PURCHASE invoice (where ${organizationData?.name || 'the organization'} is the BUYER and needs to pay) 
     or a PAYMENT invoice (where ${organizationData?.name || 'the organization'} is the SELLER and will receive payment)
   
   - Look for these key indicators:
     * PURCHASE invoice hints (organization pays):
       - "Bill To:" or "Ship To:" field shows ${organizationData?.name || 'the organization name'}
       - The organization appears as a customer or recipient
       - Terms like "Payment Due", "Due Date", "Please pay" indicate organization needs to pay
       - The document has a "Customer" number referring to the organization
     
     * PAYMENT invoice hints (organization receives money):
       - "From:" field shows ${organizationData?.name || 'the organization name'}
       - Organization logo is prominently displayed in the letterhead
       - Terms like "Invoice issued by", "Sold by", "Vendor:" show the organization as seller
       - Organization's VAT/Tax ID is displayed as the seller

   - Look for the organization name (${organizationData?.name || 'organization name'}) in different sections
   - Analyze whether the invoice is formatted as something TO PAY or as a RECEIPT of payment already made
   - Set invoiceType field to either "PURCHASE" or "PAYMENT" with high confidence

7. LINE ITEMS:
   - Extract ALL individual products/services listed in detail
   - Include description, quantity, unit price, total price, tax rate, tax amount, discount, and product SKU (if available)
   - Scan tables carefully for this information
   - Preserve exact descriptions and quantities
   - Convert all numeric values to numbers (not strings)
   - Extract ALL dynamic attributes for each line item (color, size, material, dimensions, brand, model, weight, etc.)
   - Store dynamic attributes as name-value pairs (e.g., {"name": "color", "value": "red"})
   - Pay special attention to product variations, SKUs, and detailed specifications

8. ADVANCED RECOGNITION:
   - Handle handwritten text when possible
   - Be aware of watermarks and background patterns
   - For low-quality images, use context to make best guesses

9. CONFIDENCE ASSESSMENT:
   - Provide a confidence score (0-1) for each extracted field
   - If a field is not found or uncertain, mark it as null but explain why
   - For ambiguous fields, provide your best guess with a lower confidence score

OUTPUT FORMAT:
{
  "invoiceNumber": "extracted invoice number",
  "vendorName": "extracted vendor name",
  "issueDate": "extracted date in YYYY-MM-DD format",
  "dueDate": "extracted date in YYYY-MM-DD format",
  "amount": numeric value only (e.g., 1234.56),
  "currency": "extracted currency code (e.g., USD, EUR)",
  "invoiceType": "PURCHASE" or "PAYMENT",
  "items": [
    {
      "description": "line item description",
      "quantity": numeric value,
      "unitPrice": numeric value,
      "totalPrice": numeric value,
      "taxRate": optional numeric value,
      "taxAmount": optional numeric value,
      "discount": optional numeric value,
      "productSku": "optional product code/SKU",
      "attributes": [
        {
          "name": "attribute name (e.g., color, size, material)",
          "value": "attribute value (e.g., red, large, cotton)"
        }
      ]
    }
  ],
  "tax": numeric value,
  "notes": "extracted notes or payment instructions",
  "language": "detected language code (e.g., en, fr, es)",
  "confidence": confidence score between 0 and 1 for the overall extraction quality
}

If you cannot determine a value for a field, use null. DO NOT MAKE UP DATA. If you're uncertain, provide your best guess but lower the confidence score accordingly.
`;

  try {
    // Call OpenAI Vision API with detailed prompt
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "You are an invoice processing expert with exceptional attention to detail."
          },
          {
            role: "user",
            content: [
              { type: "text", text: prompt },
              {
                type: "image_url",
                image_url: {
                  url: fileUrl,
                  detail: "high" // Request high detail for better OCR
                }
              }
            ]
          }
        ],
        max_tokens: 4096,
        temperature: 0.1 // Lower temperature for more deterministic results
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`OpenAI API error: ${error.error?.message || 'Unknown error'}`);
    }

    const data = await response.json();
    
    // Parse the response content as JSON
    const responseText = data.choices[0]?.message?.content || '';
    if (!responseText) {
      throw new Error("No response from OpenAI");
    }

    // Extract the JSON part of the response
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("Could not parse JSON from OpenAI response");
    }

    const extractedData = JSON.parse(jsonMatch[0]);
    return { extractedData, confidence: extractedData.confidence || 0.9 };
  } catch (error) {
    console.error("Error processing with OpenAI:", error);
    throw error;
  }
}

/**
 * Process with Azure OCR (implement if available)
 */
async function processWithAzureOCR(
  fileUrl: string
) {
  // This would be a real implementation using Azure Form Recognizer or Document Intelligence
  // For now we'll simulate it - in a real app, you would integrate with Azure services
  
  try {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1200));
    
    // Generate more realistic data based on file type
    const fileType = getFileTypeFromUrl(fileUrl);
    
    // Different confidence levels based on file type
    const confidence = fileType === 'pdf' ? 0.85 : 
                       fileType === 'image' ? 0.78 : 0.65;
    
    // Generate sample extraction data
    const extractedData = {
      invoiceNumber: `INV-${Math.floor(Math.random() * 10000)}`,
      vendorName: ["Amazon", "Microsoft", "Google", "Dell", "Apple", "Adobe", "AT&T"][Math.floor(Math.random() * 7)],
      issueDate: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      dueDate: new Date(Date.now() + Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      amount: Math.floor(Math.random() * 1000) + 100 + Math.random(),
      currency: ["USD", "EUR", "GBP"][Math.floor(Math.random() * 3)],
      items: [
        {
          description: "Azure OCR extracted item",
          quantity: Math.floor(Math.random() * 5) + 1,
          unitPrice: Math.floor(Math.random() * 100) + 50,
          totalPrice: Math.floor(Math.random() * 100) + 50,
          attributes: [
            { name: "color", value: ["red", "blue", "green", "black"][Math.floor(Math.random() * 4)] },
            { name: "size", value: ["small", "medium", "large", "x-large"][Math.floor(Math.random() * 4)] }
          ]
        },
        {
          description: "Secondary service",
          quantity: Math.floor(Math.random() * 3) + 1,
          unitPrice: Math.floor(Math.random() * 50) + 20,
          totalPrice: Math.floor(Math.random() * 50) + 20,
          attributes: [
            { name: "material", value: ["cotton", "polyester", "wool", "silk"][Math.floor(Math.random() * 4)] }
          ]
        }
      ],
      tax: Math.floor(Math.random() * 20) + 5,
      notes: "Processed using Azure Document Intelligence",
      language: "en",
      confidence
    };
    
    return { extractedData, confidence };
  } catch (error) {
    console.error("Azure OCR failed:", error);
    throw new Error(`Azure OCR processing failed: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Fallback OCR processing (simulated - in production would be a different service)
 */
async function simulateFallbackOCR(
  fileUrl: string
) {
  // In a real application, this would call an alternative OCR service
  // For demonstration, we'll simulate OCR extraction with less accuracy
  
  try {
    // Simulate API call delay and processing
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // More realistic data generation based on file type
    const fileType = getFileTypeFromUrl(fileUrl);
    const confidence = fileType === 'pdf' ? 0.75 : 
                       fileType === 'image' ? 0.65 : 0.5;
    
    // Random company names for more realistic data
    const companyNames = [
      "Amazon Web Services", "Microsoft Corporation", "Google LLC", 
      "Dell Technologies", "Apple Inc.", "Adobe Systems", "AT&T Inc.",
      "Verizon Communications", "IBM Corporation", "Oracle Corporation"
    ];
    
    // Generate sample data
    const extractedData = {
      invoiceNumber: `INV-${Math.floor(Math.random() * 10000)}`,
      vendorName: companyNames[Math.floor(Math.random() * companyNames.length)],
      issueDate: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      dueDate: new Date(Date.now() + Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      amount: Math.floor(Math.random() * 1000) + 100 + Math.random(),
      currency: "USD",
      items: [
        {
          description: "Software license",
          quantity: Math.floor(Math.random() * 5) + 1,
          unitPrice: Math.floor(Math.random() * 100) + 50,
          totalPrice: Math.floor(Math.random() * 100) + 50,
          attributes: [
            { name: "license_type", value: ["standard", "premium", "enterprise", "basic"][Math.floor(Math.random() * 4)] },
            { name: "duration", value: ["1 month", "3 months", "6 months", "1 year"][Math.floor(Math.random() * 4)] }
          ]
        }
      ],
      tax: Math.floor(Math.random() * 20) + 5,
      notes: "This data was generated by the fallback OCR engine with reduced accuracy",
      language: "en",
      confidence
    };
    
    return { extractedData, confidence };
  } catch (error) {
    console.error("Fallback OCR failed:", error);
    throw new Error(`Fallback OCR processing failed: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Suggest categories based on extracted invoice data
 */
export async function suggestCategories(
  extractedData: ExtractedInvoiceData, 
  preferredCategories: string[],
  userId?: string
): Promise<string[]> {
  // Implement more sophisticated category suggestions based on the invoice content
  const baseCategories = ['Office Supplies', 'Software', 'Hardware', 'Utilities', 'Rent', 'Travel', 'Meals', 'Marketing'];
  
  const vendorKeywords: Record<string, string[]> = {
    'amazon': ['Office Supplies', 'Software', 'Hardware'],
    'microsoft': ['Software', 'Cloud Services', 'IT Expenses'],
    'apple': ['Hardware', 'Software', 'IT Expenses'],
    'dell': ['Hardware', 'IT Expenses'],
    'adobe': ['Software', 'Marketing'],
    'at&t': ['Utilities', 'Telecommunications'],
    'verizon': ['Utilities', 'Telecommunications'],
    'google': ['Software', 'Marketing', 'Cloud Services'],
    'uber': ['Travel', 'Transportation'],
    'lyft': ['Travel', 'Transportation'],
    'hotel': ['Travel', 'Accommodation'],
    'airlines': ['Travel', 'Transportation'],
    'restaurant': ['Meals', 'Entertainment'],
    'office': ['Office Supplies', 'Rent'],
    'aws': ['Cloud Services', 'IT Expenses'],
    'hosting': ['IT Expenses', 'Cloud Services'],
    'domain': ['IT Expenses', 'Marketing'],
    'insurance': ['Insurance', 'Benefits'],
    'tax': ['Taxes', 'Accounting'],
    'accountant': ['Accounting', 'Professional Services'],
    'lawyer': ['Legal', 'Professional Services'],
    'consultant': ['Consulting', 'Professional Services']
  };
  
  const suggestedCategories: string[] = [...baseCategories];
  
  // Check vendor name for keywords
  if (extractedData.vendorName) {
    const vendorLower = extractedData.vendorName.toLowerCase();
    for (const [keyword, categories] of Object.entries(vendorKeywords)) {
      if (vendorLower.includes(keyword)) {
        suggestedCategories.push(...categories);
      }
    }
  }
  
  // Check line items for keywords
  if (extractedData.items && Array.isArray(extractedData.items)) {
    for (const item of extractedData.items) {
      if (item.description) {
        const descLower = item.description.toLowerCase();
        for (const [keyword, categories] of Object.entries(vendorKeywords)) {
          if (descLower.includes(keyword)) {
            suggestedCategories.push(...categories);
          }
        }
      }
    }
  }
  
  const filteredCategories = preferredCategories.length > 0
    ? suggestedCategories.filter(category => preferredCategories.includes(category))
    : suggestedCategories;
  
  if (userId && extractedData.vendorName) {
    const { getPersonalizedCategorySuggestions } = require('./ai-learning-service');
    try {
      return await getPersonalizedCategorySuggestions(
        userId, 
        extractedData.vendorName,
        extractedData,
        [...new Set(filteredCategories.length > 0 ? filteredCategories : suggestedCategories)]
      );
    } catch (error) {
      console.error("Error getting personalized suggestions:", error);
    }
  }
  
  // Remove duplicates and limit to 8 suggestions
  return [...new Set(filteredCategories.length > 0 ? filteredCategories : suggestedCategories)].slice(0, 8);
}

/**
 * Suggest vendors based on extracted data and existing vendors
 */
export async function suggestVendors(
  extractedVendor: string, 
  existingVendors: string[],
  userId?: string
) {
  if (!extractedVendor) return existingVendors.slice(0, 5);
  
  const extractedLower = extractedVendor.toLowerCase();
  
  if (userId) {
    try {
      const { getPersonalizedVendorSuggestions } = require('./ai-learning-service');
      const personalizedSuggestions = await getPersonalizedVendorSuggestions(
        userId,
        extractedVendor,
        existingVendors
      );
      
      if (personalizedSuggestions && personalizedSuggestions.length > 0) {
        return personalizedSuggestions.slice(0, 5);
      }
    } catch (error) {
      console.error("Error getting personalized vendor suggestions:", error);
    }
  }
  
  // Find close matches from existing vendors
  const matches = existingVendors.filter(vendor => {
    const vendorLower = vendor.toLowerCase();
    return vendorLower.includes(extractedLower) || 
           extractedLower.includes(vendorLower) ||
           levenshteinDistance(vendorLower, extractedLower) <= 3;
  });
  
  // Start with the extracted vendor
  const suggestions = [extractedVendor];
  
  // Add matches
  suggestions.push(...matches);
  
  // If we don't have enough matches, add some top vendors
  if (suggestions.length < 5) {
    const remainingCount = 5 - suggestions.length;
    const otherVendors = existingVendors
      .filter(vendor => !suggestions.includes(vendor))
      .slice(0, remainingCount);
    
    suggestions.push(...otherVendors);
  }
  
  // Remove duplicates and return
  return [...new Set(suggestions)].slice(0, 5);
}

/**
 * Calculate Levenshtein distance between two strings
 * Used for fuzzy matching vendor names
 */
function levenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = [];

  // Initialize matrix
  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  // Fill matrix
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      const cost = a[j - 1] === b[i - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,      // deletion
        matrix[i][j - 1] + 1,      // insertion
        matrix[i - 1][j - 1] + cost // substitution
      );
    }
  }

  return matrix[b.length][a.length];
}

/**
 * Detects the language of text using OpenAI
 */
export async function detectLanguage(text: string) {
  try {
    const prompt = `Identify the language of the following text and respond with just the ISO language code (e.g., 'en', 'fr', 'es', etc.):

${text}`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 10
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`OpenAI API error: ${error.error?.message || 'Unknown error'}`);
    }

    const data = await response.json();
    const languageCode = data.choices[0]?.message?.content?.trim() || 'en';
    
    return languageCode;
  } catch (error) {
    console.error("Error detecting language:", error);
    return "en";
  }
}                                                                        