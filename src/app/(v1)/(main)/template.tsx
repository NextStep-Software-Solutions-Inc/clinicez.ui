"use client"

import "@styles/globals.css";
import RootHeader from "@components/RootHeader";
import RootFooter from "@components/RootFooter";
import Link from "next/link";
import { Separator } from "@components/ui/separator";
import { NotificationBanner } from "@/components/ui/notification-banner";
import ClassicButton from "@/components/ClassicButton";

const APP_EMAIL = process.env.NEXT_PUBLIC_APP_EMAIL;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex flex-col min-h-screen">
      <NotificationBanner />
      <div className="bg-primary text-primary-foreground py-2">
        <div className="container flex items-center ~text-xs/sm">
          <span className="flex-1"></span>
          <div className="flex h-5 items-center space-x-4">
            <Link href={`mailto:${APP_EMAIL}`} >{APP_EMAIL}</Link>
            <Separator orientation="vertical"/>
            <Link href="/tenants/register">Become a Tenant</Link>
            <Separator orientation="vertical"/>
            <ClassicButton />
          </div>
        </div>
      </div>
      <RootHeader className="sticky top-0 z-50"/>
      <div className="flex-1">{children}</div>
      <RootFooter/>
    </div>
  );
}
