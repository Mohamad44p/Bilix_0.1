import { SignIn } from '@clerk/nextjs'
import { redirect } from 'next/navigation';
import { auth } from '@clerk/nextjs/server';

export default async function SignInPage() {
  // Check if user is already signed in
  const { userId } = await auth();
  
  // If user is authenticated, redirect to dashboard
  if (userId) {
    redirect('/dashboard');
  }
  
  return (
    <div className="flex min-h-screen items-center justify-center">
      <SignIn />
    </div>
  )
}