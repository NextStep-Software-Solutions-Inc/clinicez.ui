import { KonsultaLibrariesConsole } from "@/components/super-admin/KonsultaLibrariesConsole";

export const metadata = {
  title: "PhilHealth Konsulta Libraries",
  description: "Upload, parse, and preview PhilHealth Konsulta Excel library files",
};

export default function KonsultaLibrariesPage() {
  return <KonsultaLibrariesConsole />;
}
