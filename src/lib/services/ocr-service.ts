import { InvoiceFieldConfig } from '../types';

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
 * Processes an invoice image with OpenAI Vision API for OCR and data extraction
 */
export async function processInvoiceWithOCR(
  fileUrl: string,
  customFields?: InvoiceFieldConfig[]
) {
  try {
    const fieldsToExtract = customFields || defaultFields;
    const fieldsDescription = fieldsToExtract
      .map((field) => `${field.label} (${field.description})`)
      .join('\n');

    // Construct the prompt for OpenAI's Vision API
    const prompt = `Extract the following information from this invoice image:
      
${fieldsDescription}

Also, identify the language of the invoice.

Format your response as a JSON object with the following structure:
{
  "invoiceNumber": "extracted invoice number",
  "vendorName": "extracted vendor name",
  "issueDate": "extracted date in YYYY-MM-DD format",
  "dueDate": "extracted date in YYYY-MM-DD format",
  "amount": numeric value only (e.g., 1234.56),
  "currency": "extracted currency code (e.g., USD, EUR)",
  "items": [
    {
      "description": "line item description",
      "quantity": numeric value,
      "unitPrice": numeric value,
      "totalPrice": numeric value
    }
  ],
  "tax": numeric value,
  "notes": "extracted notes",
  "language": "detected language code (e.g., en, fr, es)"
}

If any field is not found in the invoice, use null for that field. For dates, convert to YYYY-MM-DD format.
Suggest appropriate categories for this invoice based on the vendor and line items (e.g., "Utilities", "Software Subscription", "Office Supplies").
`;

    // Call OpenAI Vision API directly with fetch
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-4-vision-preview",
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: prompt },
              {
                type: "image_url",
                image_url: {
                  url: fileUrl,
                }
              }
            ]
          }
        ],
        max_tokens: 4096
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

    // Extract the JSON part of the response, handling potential text before or after the JSON
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("Could not parse JSON from OpenAI response");
    }

    try {
      const extractedData = JSON.parse(jsonMatch[0]);
      
      // Suggest categories based on the extracted data
      const suggestedCategories = await suggestCategories(extractedData);
      
      return {
        extractedData,
        suggestedCategories,
      };
    } catch (error) {
      console.error("Error parsing JSON:", error);
      throw new Error("Failed to parse extracted data");
    }
  } catch (error) {
    console.error("Error processing invoice with OCR:", error);
    throw new Error(`OCR processing failed: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Suggests categories based on the extracted invoice data
 */
async function suggestCategories(extractedData: Record<string, unknown>) {
  try {
    // Use OpenAI to suggest categories based on vendor and items
    const prompt = `Based on the following invoice data, suggest 3-5 appropriate categories for this invoice. 
    The invoice is from vendor "${extractedData.vendorName || 'Unknown'}" with the following line items: 
    ${JSON.stringify(extractedData.items || [])}
    
    Format your response as a JSON array of category names only, e.g.:
    ["Category1", "Category2", "Category3"]
    `;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-4",
        messages: [
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 150
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`OpenAI API error: ${error.error?.message || 'Unknown error'}`);
    }

    const data = await response.json();
    const responseText = data.choices[0]?.message?.content || '';
    
    if (!responseText) {
      throw new Error("No response from OpenAI");
    }

    // Extract the JSON part of the response
    const jsonMatch = responseText.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      throw new Error("Could not parse JSON from OpenAI response");
    }

    return JSON.parse(jsonMatch[0]);
  } catch (error) {
    console.error("Error suggesting categories:", error);
    return ["General", "Uncategorized"];
  }
}

/**
 * Suggests vendors based on existing vendors and the extracted invoice data
 */
export async function suggestVendors(
  extractedVendorName: string,
  existingVendors: string[]
) {
  try {
    // First check for close matches in existing vendors
    const closeMatches = existingVendors.filter(
      (vendor) => 
        vendor.toLowerCase().includes(extractedVendorName.toLowerCase()) ||
        extractedVendorName.toLowerCase().includes(vendor.toLowerCase())
    );
    
    if (closeMatches.length > 0) {
      return closeMatches;
    }
    
    // If no close matches, return the extracted name as a suggestion
    return [extractedVendorName];
  } catch (error) {
    console.error("Error suggesting vendors:", error);
    return [extractedVendorName];
  }
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