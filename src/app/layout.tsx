import { ClerkProvider } from "@clerk/nextjs";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Toaster as SonnerToaster } from "sonner";
import { Toaster } from "@components/ui/toaster";
import dynamic from "next/dynamic";
import { Analytics } from "@vercel/analytics/react";
import type { Metadata } from "next";

import { SWRProvider } from "@provider/swr-provider";
import JotaiProvider from "@provider/JotaiProvider";
import SyncTokenClient from "@components/SyncTokenClient";
import BypassAutoplay from "@components/BypassAutoplay";

const HotJar = dynamic(() => import("@components/HotJar"), { ssr: true });

export const metadata: Metadata = {
  title: "Clinic EZ",
  description: "Optimized Healthcare Management System"
};

interface Props {
  children: React.ReactNode;
}

/**
 * Root Layout
 * 
 * Global layout wrapping all routes (v1 and v2).
 * Contains:
 * - Clerk authentication
 * - Global CSS
 * - Global providers: Jotai, SWR, Sonner
 * - Analytics: HotJar, Speed Insights, Vercel Analytics
 * - UI: Toasters for notifications
 * 
 * Route-specific layouts (v1, v2) inherit these providers.
 */
export default function RootLayout({ children }: Props) {
  const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

  return (
    <ClerkProvider publishableKey={publishableKey}>
      <html lang="en">
        <HotJar />
        <body>
          <BypassAutoplay />
          <JotaiProvider>
            <SyncTokenClient />
            <SWRProvider>
              {children}
              <SpeedInsights />
              <Analytics />
              <SonnerToaster richColors />
              <Toaster />
            </SWRProvider>
          </JotaiProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
