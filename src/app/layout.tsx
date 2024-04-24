import type { Metadata } from "next";
import { Montserrat } from "next/font/google";
import "@styles/globals.css";
import { SpeedInsights } from "@vercel/speed-insights/next"
// import RootHeader from "@components/components/RootHeader";
import { UserProvider } from "@auth0/nextjs-auth0/client";
import RootHeader from "@components/RootHeader";
import RootFooter from "@components/RootFooter";
import { Toaster } from "@components/ui/sonner";
// import { Toaster } from "sonner"

const montserrat = Montserrat({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Clinic EZ",
  description: "Optimized Healthcare Management System",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head />
      <body className={`${montserrat.className} mx-4`} >
        <UserProvider>
          <RootHeader className="sticky top-0 z-50"/>
          {children}
          <SpeedInsights />
          <Toaster />
          <RootFooter/>
        </UserProvider>
      </body>
    </html>
  );
}
