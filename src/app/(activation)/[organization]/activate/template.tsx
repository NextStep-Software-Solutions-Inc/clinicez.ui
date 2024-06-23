import "@styles/globals.css";
import ActivationHeader from "./ActivationHeader";
import RootFooter from "@components/RootFooter";


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <ActivationHeader className="sticky top-0 z-50"/>
      <div className="content">{children}</div>
      <RootFooter/>
    </>
  );
}
