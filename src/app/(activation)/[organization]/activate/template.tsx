import "@styles/globals.css";
import Header from "./header";
import RootFooter from "@components/RootFooter";


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <Header className="sticky top-0 z-50"/>
      <div className="content">{children}</div>
      <RootFooter/>
    </>
  );
}
