import { SignUp } from '@clerk/nextjs'
import { redirect } from 'next/navigation';
import { auth } from '@clerk/nextjs/server';

export default async function SignUpPage() {
  // Check if user is already signed in
  const { userId } = await auth();
  
  // If user is authenticated, redirect to onboarding
  if (userId) {
    redirect('/onboarding');
  }
  
  return (
    <div className="flex min-h-screen items-center justify-center">
      <SignUp afterSignUpUrl="/onboarding" />
    </div>
  )
}