import { UserProvider } from "@auth0/nextjs-auth0/client";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Montserrat } from "next/font/google";
import { Toaster as SonnerToaster } from "sonner";
import { Toaster } from "@components/ui/toaster";

import { SWRProvider } from "../provider/swr-provider";
import JotaiProvider from "../provider/JotaiProvider";
import SyncToken from "@components/SyncToken";
import { getCachedSession } from "@actions/session.action";
import BypassAutoplay from "@components/BypassAutoplay";
import dynamic from "next/dynamic";
import { Analytics } from "@vercel/analytics/react";

import "@styles/globals.css";
import { findOrCreateUserAction } from "@actions/users/user.action";
import { redirect } from "next/navigation";
import SyncSessionClinic from "@components/SyncSessionClinic";
const HotJar = dynamic(() => import("@components/HotJar"), { ssr: true });

const montserrat = Montserrat({ subsets: ["latin"] });

export const maxDuration = 40; // page timeout in seconds
export const metadata = {
  title: "Clinic EZ",
  description: "Optimized Healthcare Management System"
};
interface Props {
  children: React.ReactNode;
}

export default async function RootLayout({ children }: Props) {
  
  const session = await getCachedSession();
  if (session) {
    const dbUser = await findOrCreateUserAction();
    if (!dbUser.data) redirect(`/api/auth/logout?returnTo=/email-is-taken`);
  }

  return (
    <html lang="en">
      <HotJar />
      <body className={`${montserrat.className}`}>
        <BypassAutoplay />
        <JotaiProvider>
          <SyncToken
            token={{
              type: session?.token_type,
              accessToken: session?.accessToken ?? ""
            }}
          />
          {!!session && <SyncSessionClinic/>}
          <SWRProvider>
            <UserProvider>
              {children}
              <SpeedInsights />
              <Analytics />
              <SonnerToaster />
              <Toaster />
            </UserProvider>
          </SWRProvider>
        </JotaiProvider>
      </body>
    </html>
  );
}
