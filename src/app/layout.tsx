import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { SpeedInsights } from "@vercel/speed-insights/next"
import RootHeader from "@components/components/RootHeader";
import { UserProvider } from "@auth0/nextjs-auth0/client";
import RootFooter from "@components/components/RootFooter";

const inter = Inter({ subsets: ["latin"] });

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
    <html lang="en">
      <body className={inter.className}>
        <UserProvider>
          <RootHeader className="sticky top-0"/>
          <main className="container mx-auto">
            {children}
            <SpeedInsights />
          </main>
          <RootFooter/>
        </UserProvider>
      </body>
    </html>
  );
}
