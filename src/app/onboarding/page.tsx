'use client';

import { UserButton, useUser } from '@clerk/nextjs';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AIOnboarding from '@/components/dashboard/onboarding/AIOnboarding';
import { completeOnboarding } from '@/lib/actions/onboarding-actions';
import { AISettings, OnboardingData } from '@/lib/types';
import { toast } from 'sonner';

export default function OnboardingPage() {
  const { isLoaded, isSignedIn, user } = useUser();
  const router = useRouter();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Wait for auth to be loaded
    if (isLoaded) {
      // If user is not signed in, redirect to sign-in
      if (!isSignedIn) {
        router.push('/sign-in');
        return;
      }
      setIsReady(true);
    }
  }, [isLoaded, isSignedIn, router]);

  if (!isReady) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-pulse text-center">
          <div className="h-10 w-10 rounded-full bg-primary/20 mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  const handleComplete = async (settings: AISettings) => {
    try {
      // Get organization data from the settings
      const onboardingData: OnboardingData = {
        organization: {
          name: user?.organizationMemberships?.[0]?.organization?.name || user?.fullName || 'My Organization',
          industry: settings.customInstructions?.includes('industry') ? settings.customInstructions.split('industry:')[1]?.split('\n')[0]?.trim() : undefined,
          size: 'small', // Default
          invoiceVolume: 'low', // Default
        },
        aiSettings: settings
      };

      // Submit onboarding data
      const result = await completeOnboarding(onboardingData);

      if (result.error) {
        throw new Error(result.error);
      }

      // Show success toast
      toast.success('Onboarding completed successfully!', {
        description: 'Your organization and AI settings have been saved.'
      });

      // Redirect to dashboard
      router.push('/dashboard');
    } catch (error) {
      console.error('Error completing onboarding:', error);
      toast.error('Failed to complete onboarding');
    }
  };

  return (
    <div className="min-h-screen">
      <header className="p-4 border-b flex justify-end">
        <UserButton afterSignOutUrl="/" />
      </header>
      
      <main>
        <AIOnboarding onComplete={handleComplete} />
      </main>
    </div>
  );
} 