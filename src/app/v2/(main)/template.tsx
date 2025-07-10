import "@styles/globals.css";
import RootHeader from "@components/RootHeader";
import RootFooter from "@components/RootFooter";

const APP_EMAIL = process.env.NEXT_PUBLIC_APP_EMAIL;

export default function RootLayoutV2({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="relative min-h-screen">
      <RootHeader version="v2" className="sticky top-0 left-0 right-0 z-50"/>
      <div className="min-h-screen">
        {children}
      </div>
      <RootFooter version="v2"/>
    </div>
  );
}