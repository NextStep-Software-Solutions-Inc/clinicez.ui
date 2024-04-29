import "@styles/globals.css";
import RootHeader from "@components/RootHeader";
import RootFooter from "@components/RootFooter";


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <RootHeader className="sticky top-0 z-50"/>
      <div className="content">{children}</div>
      <RootFooter/>
    </>
  );
}
