import { UserProvider } from "@auth0/nextjs-auth0/client";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Montserrat } from "next/font/google";
import { Toaster as SonnerToaster } from "sonner"
import { Toaster } from "@components/ui/toaster"
import "@styles/globals.css";
import Hotjar from "@components/Hotjar";
import { SWRProvider } from "../provider/swr-provider";
import JotaiProvider from "../provider/JotaiProvider";
import SyncToken from "@components/SyncToken";
import { getCachedSession } from "@actions/session.action";

const montserrat = Montserrat({ subsets: ["latin"] });

export const metadata = {
  title: 'Clinic EZ',
  description: 'Optimized Healthcare Management System',
}
interface Props {
  children: React.ReactNode
}

export default async function RootLayout({children}:Props) {
  const session = await getCachedSession();
  
  return (
    <html lang="en">
      <Hotjar/>
      <body className={`${montserrat.className}`}>
        <JotaiProvider>
          <SyncToken token={{
            type: session?.token_type,
            accessToken: session?.accessToken ?? ""
          }}/>
          <SWRProvider>
            <UserProvider>
              {children}
              <SpeedInsights />
              <SonnerToaster />
              <Toaster />
              
            </UserProvider>
          </SWRProvider>
        </JotaiProvider>
      </body>
    </html>
  )
}
