import "@styles/globals.css";
import RootFooter from "@components/RootFooter";
import Header from "../activate/Header";


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
