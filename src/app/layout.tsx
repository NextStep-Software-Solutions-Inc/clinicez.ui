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
import { getCurrentUserAction } from "@actions/users/user.action";
import { redirect } from "next/navigation";
import OnboardingGuard from "@components/onboarding/OnboardingGuard";
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
  const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

  const [session, dbUser] = await Promise.all([getCachedSession(), getCurrentUserAction()])
  let onboardingStatus = "COMPLETED";
  let firstName: string | null = null;
  let lastName: string | null = null;
  let dob: Date | null = null;
  let gender: string | null = null;
  let mobile: string | null = null;
  if (session) {
    if (!dbUser.data) {
      // User not found in database - redirect to error page
      // This should not happen if Clerk webhook is properly configured
      redirect(`/sign-in?error=user-not-found`);
    }
    onboardingStatus = dbUser.data.onboardingStatus;
    firstName = dbUser.data.firstName;
    lastName = dbUser.data.lastName;
    dob = dbUser.data.dob ? new Date(dbUser.data.dob) : null;
    gender = dbUser.data.gender;
    mobile = dbUser.data.mobile;
  }

  return (
    <ClerkProvider publishableKey={publishableKey} >
      <html lang="en">
        <HotJar />
        <body className={`${plusJakartaSans.className}`}>
          <BypassAutoplay />
          <JotaiProvider>
            <SyncTokenClient />
            {/* {!!session && <SyncSessionClinic/>} */}
            <SWRProvider>
              {!!session && (
                <OnboardingGuard
                  onboardingStatus={onboardingStatus}
                  firstName={firstName}
                  lastName={lastName}
                  dob={dob}
                  gender={gender}
                  mobile={mobile}
                />
              )}
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
