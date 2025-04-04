import db from "../../db/db";
import { ExtractedInvoiceData } from "../types";

/**
 * Get personalized category suggestions based on user's feedback history
 */
export async function getPersonalizedCategorySuggestions(
  userId: string,
  vendorName: string,
  extractedData: ExtractedInvoiceData,
  defaultSuggestions: string[]
): Promise<string[]> {
  try {
    const categoryFeedback = await db.aIFeedback.findMany({
      where: {
        userId,
        feedbackType: 'CATEGORY',
        vendorName: {
          contains: vendorName,
          mode: 'insensitive'
        }
      },
      orderBy: {
        timestamp: 'desc'
      },
      take: 10
    });

    if (categoryFeedback.length === 0) {
      return defaultSuggestions;
    }

    const categoryCounts: Record<string, number> = {};
    categoryFeedback.forEach((feedback: any) => {
      const category = feedback.correctedValue;
      categoryCounts[category] = (categoryCounts[category] || 0) + 1;
    });

    const sortedCategories = Object.entries(categoryCounts)
      .sort((a, b) => b[1] - a[1])
      .map(([category]) => category);

    const combinedSuggestions = [...sortedCategories];
    
    defaultSuggestions.forEach(category => {
      if (!combinedSuggestions.includes(category)) {
        combinedSuggestions.push(category);
      }
    });

    return combinedSuggestions.slice(0, 8);
  } catch (error) {
    console.error("Error in getPersonalizedCategorySuggestions:", error);
    return defaultSuggestions;
  }
}

/**
 * Get personalized vendor suggestions based on user's feedback history
 */
export async function getPersonalizedVendorSuggestions(
  userId: string,
  extractedVendor: string,
  existingVendors: string[]
): Promise<string[]> {
  try {
    const vendorFeedback = await db.aIFeedback.findMany({
      where: {
        userId,
        feedbackType: 'VENDOR',
        originalValue: {
          contains: extractedVendor,
          mode: 'insensitive'
        }
      },
      orderBy: {
        timestamp: 'desc'
      },
      take: 10
    });

    if (vendorFeedback.length === 0) {
      return [];
    }

    const vendorCounts: Record<string, number> = {};
    vendorFeedback.forEach((feedback: any) => {
      const vendor = feedback.correctedValue;
      vendorCounts[vendor] = (vendorCounts[vendor] || 0) + 1;
    });

    const sortedVendors = Object.entries(vendorCounts)
      .sort((a, b) => b[1] - a[1])
      .map(([vendor]) => vendor);

    const combinedSuggestions = [...sortedVendors];
    
    if (!combinedSuggestions.includes(extractedVendor)) {
      combinedSuggestions.push(extractedVendor);
    }

    if (combinedSuggestions.length < 5) {
      existingVendors.forEach(vendor => {
        if (!combinedSuggestions.includes(vendor)) {
          combinedSuggestions.push(vendor);
          if (combinedSuggestions.length >= 5) return;
        }
      });
    }

    return combinedSuggestions.slice(0, 5);
  } catch (error) {
    console.error("Error in getPersonalizedVendorSuggestions:", error);
    return [];
  }
}

/**
 * Store user feedback about AI extraction
 */
export async function storeExtractionFeedback(
  userId: string,
  invoiceId: string,
  feedback: {
    originalValue: any;
    correctedValue: any;
    field: string;
    confidence: number;
  }
): Promise<void> {
  await db.aIFeedback.create({
    data: {
      userId,
      invoiceId,
      field: feedback.field,
      originalValue: JSON.stringify(feedback.originalValue),
      correctedValue: JSON.stringify(feedback.correctedValue),
      confidence: feedback.confidence,
      feedbackType: 'EXTRACTION'
    }
  });
}

/**
 * Store user feedback about category suggestions
 */
export async function storeCategoryFeedback(
  userId: string,
  invoiceId: string,
  vendorName: string,
  suggestedCategories: string[],
  selectedCategory: string,
  confidence: number
): Promise<void> {
  await db.aIFeedback.create({
    data: {
      userId,
      invoiceId,
      field: 'category',
      originalValue: JSON.stringify(suggestedCategories),
      correctedValue: selectedCategory,
      vendorName,
      confidence,
      feedbackType: 'CATEGORY'
    }
  });
}

/**
 * Store user feedback about vendor suggestions
 */
export async function storeVendorFeedback(
  userId: string,
  invoiceId: string,
  suggestedVendors: string[],
  selectedVendor: string,
  confidence: number
): Promise<void> {
  await db.aIFeedback.create({
    data: {
      userId,
      invoiceId,
      field: 'vendor',
      originalValue: JSON.stringify(suggestedVendors),
      correctedValue: selectedVendor,
      vendorName: selectedVendor,
      confidence,
      feedbackType: 'VENDOR'
    }
  });
}

/**
 * Store user feedback about line item attribute extraction
 */
export async function storeAttributeFeedback(
  userId: string,
  invoiceId: string,
  lineItemDescription: string,
  attributeName: string,
  originalValue: string,
  correctedValue: string,
  confidence: number
): Promise<void> {
  await db.aIFeedback.create({
    data: {
      userId,
      invoiceId,
      field: `attribute_${attributeName}`,
      originalValue: originalValue,
      correctedValue: correctedValue,
      vendorName: lineItemDescription,
      confidence,
      feedbackType: 'ATTRIBUTE'
    }
  });
}

/**
 * Store user feedback for AI learning (generic version)
 */
export async function storeAIFeedback(
  userId: string,
  invoiceId: string,
  field: string,
  originalValue: string,
  correctedValue: string,
  vendorName?: string,
  feedbackType: 'EXTRACTION' | 'CATEGORY' | 'VENDOR' | 'ATTRIBUTE' = 'EXTRACTION',
  confidence: number = 0.5
) {
  try {
    await db.aIFeedback.create({
      data: {
        userId,
        invoiceId,
        field,
        originalValue,
        correctedValue,
        vendorName,
        feedbackType,
        confidence
      }
    });
    
    console.log(`Stored AI feedback for ${feedbackType} from user ${userId}`);
    return true;
  } catch (error) {
    console.error("Error storing AI feedback:", error);
    return false;
  }
}

/**
 * Get learning statistics for a user
 */
export async function getUserLearningStats(userId: string) {
  try {
    const totalFeedback = await db.aIFeedback.count({
      where: { userId }
    });
    
    const feedbackByType = await db.aIFeedback.groupBy({
      by: ['feedbackType'],
      where: { userId },
      _count: true
    });
    
    const recentFeedback = await db.aIFeedback.findMany({
      where: { userId },
      orderBy: { timestamp: 'desc' },
      take: 5
    });
    
    return {
      totalFeedback,
      feedbackByType: feedbackByType.map((item: any) => ({
        type: item.feedbackType,
        count: item._count
      })),
      recentFeedback: recentFeedback.map((item: any) => ({
        field: item.field,
        originalValue: item.originalValue,
        correctedValue: item.correctedValue,
        timestamp: item.timestamp
      }))
    };
  } catch (error) {
    console.error("Error getting user learning stats:", error);
    return null;
  }
}
