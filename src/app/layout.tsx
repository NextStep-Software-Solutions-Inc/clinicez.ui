import { UserProvider } from "@auth0/nextjs-auth0/client";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Montserrat } from "next/font/google";
import { Toaster } from "sonner"
import "@styles/globals.css";
const montserrat = Montserrat({ subsets: ["latin"] });


export const metadata = {
  title: 'Clinic EZ',
  description: 'Optimized Healthcare Management System',
}
interface Props {
  children: React.ReactNode
}
export default function RootLayout({children}:Props) {
  return (
    <html lang="en">
      <body className={`${montserrat.className} mx-4`}>
        <UserProvider>
          {children}
          <SpeedInsights />
          <Toaster />
        </UserProvider>
      </body>
    </html>
  )
}
