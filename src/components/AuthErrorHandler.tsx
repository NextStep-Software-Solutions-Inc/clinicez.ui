"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';

interface AuthErrorHandlerProps {
  error?: string;
}

export default function AuthErrorHandler({ error }: AuthErrorHandlerProps) {
  const router = useRouter();
  const { signOut } = useAuth();

  useEffect(() => {
    if (error && (
      error.includes('failed_to_refresh_token') ||
      error.includes('invalid_grant') ||
      error.includes('expired') ||
      error.includes('refresh token')
    )) {
      console.warn('Authentication error detected, redirecting to sign in...');
      // Use Clerk's signOut method instead of Auth0 logout
      signOut(() => router.push('/sign-in'));
    }
  }, [error, router, signOut]);

  return null;
}
