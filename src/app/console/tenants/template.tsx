import RootHeader from "@components/RootHeader";
import RootFooter from "@components/RootFooter";
import Link from "next/link";
import { Separator } from "@components/ui/separator";

const APP_EMAIL = process.env.NEXT_PUBLIC_APP_EMAIL;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex flex-col min-h-screen">
      <RootHeader className="sticky top-0 z-50"/>
      <div className="flex-1">{children}</div>
      <RootFooter/>
    </div>
  );
}
