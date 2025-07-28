"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface AuthErrorHandlerProps {
  error?: string;
}

export default function AuthErrorHandler({ error }: AuthErrorHandlerProps) {
  const router = useRouter();

  useEffect(() => {
    if (error && (
      error.includes('failed_to_refresh_token') ||
      error.includes('invalid_grant') ||
      error.includes('expired') ||
      error.includes('refresh token')
    )) {
      console.warn('Authentication error detected, redirecting to login...');
      window.location.href = '/auth/logout?returnTo=' + encodeURIComponent(window.location.origin);
    }
  }, [error, router]);

  return null;
}
