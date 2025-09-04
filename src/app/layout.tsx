import {
  ClerkProvider
} from "@clerk/nextjs";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Plus_Jakarta_Sans } from "next/font/google";
import { Toaster as SonnerToaster } from "sonner";
import { Toaster } from "@components/ui/toaster";

import { SWRProvider } from "../provider/swr-provider";
import JotaiProvider from "../provider/JotaiProvider";
import SyncTokenClient from "@components/SyncTokenClient";
import { getCachedSession } from "@actions/session.action";
import BypassAutoplay from "@components/BypassAutoplay";
import dynamic from "next/dynamic";
import { Analytics } from "@vercel/analytics/react";

import "@styles/globals.css";
import { findOrCreateUserAction } from "@actions/users/user.action";
import { redirect } from "next/navigation";
const HotJar = dynamic(() => import("@components/HotJar"), { ssr: true });

const plusJakartaSans = Plus_Jakarta_Sans({ subsets: ["latin"] });

export const maxDuration = 40;
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
    if (!dbUser.data) redirect(`/sign-in?error=user-sync-error`);
  }

  return (
    <ClerkProvider>
      <html lang="en">
        <body className={`${plusJakartaSans.className}`}>
          <BypassAutoplay />
          <JotaiProvider>
            <SyncTokenClient />
            {/* {!!session && <SyncSessionClinic/>} */}
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

  // return (
  //   <html lang="en">
  //     <HotJar />
  //     <body className={`${plusJakartaSans.className}`}>
  //       <BypassAutoplay />
  //       <JotaiProvider>
  //         <SyncTokenClient />
  //         {/* {!!session && <SyncSessionClinic/>} */}
  //         <SWRProvider>
  //           {children}
  //           <SpeedInsights />
  //           <Analytics />
  //           <SonnerToaster richColors />
  //           <Toaster />
  //         </SWRProvider>
  //       </JotaiProvider>
  //     </body>
  //   </html>
  // );
}
