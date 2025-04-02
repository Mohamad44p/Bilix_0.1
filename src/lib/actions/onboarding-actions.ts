'use server';

import { auth } from '@clerk/nextjs/server';
import { createOrUpdateOrganization } from '../services/user-service';
import { OnboardingData } from '../types';
import { revalidatePath } from 'next/cache';

export async function completeOnboarding(data: OnboardingData) {
  try {
    const { userId: clerkUserId } = await auth();
    
    if (!clerkUserId) {
      throw new Error('Unauthorized: User not authenticated');
    }
    
    console.log("Starting onboarding process for user:", clerkUserId);
    console.log("Onboarding data:", data);

    // First make sure the user exists in our database
    const { syncUserWithDatabase } = await import('./user');
    const dbUser = await syncUserWithDatabase();
    
    if (!dbUser || !dbUser.id) {
      throw new Error('Failed to find or create user in database');
    }

    console.log("Database user synchronized:", dbUser.id);

    // Create or update organization
    const organization = await createOrUpdateOrganization(dbUser.id, {
      name: data.organization.name,
      industry: data.organization.industry,
      size: data.organization.size,
      invoiceVolume: data.organization.invoiceVolume,
    });
    
    console.log("Organization created/updated:", organization.id);

    // Save AI settings directly to database instead of using the API
    const db = (await import('@/db/db')).default;
    
    const aiSettings = {
      customInstructions: data.aiSettings.customInstructions,
      confidenceThreshold: data.aiSettings.confidenceThreshold,
      preferredCategories: data.aiSettings.preferredCategories || [],
      sampleInvoiceUrls: data.aiSettings.sampleInvoiceUrls || [],
      userId: dbUser.id
    };
    
    console.log("Saving AI settings for user:", dbUser.id);
    console.log("AI settings:", aiSettings);
    
    // Check if settings already exist
    const existingSettings = await db.aISettings.findUnique({
      where: { userId: dbUser.id }
    });
    
    let savedSettings;
    if (existingSettings) {
      // Update existing settings
      savedSettings = await db.aISettings.update({
        where: { userId: dbUser.id },
        data: aiSettings
      });
    } else {
      // Create new settings
      savedSettings = await db.aISettings.create({
        data: aiSettings
      });
    }
    
    console.log("AI settings saved successfully:", savedSettings.id);

    // Revalidate paths to ensure fresh data
    revalidatePath('/dashboard');
    revalidatePath('/settings');

    console.log("Onboarding completed successfully");
    return { success: true, organizationId: organization.id };
  } catch (error) {
    console.error('Error completing onboarding:', error);
    return { error: error instanceof Error ? error.message : 'Failed to complete onboarding process' };
  }
} 