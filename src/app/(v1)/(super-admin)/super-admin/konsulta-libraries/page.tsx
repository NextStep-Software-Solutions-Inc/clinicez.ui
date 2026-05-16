import { KonsultaLibrariesConsole } from "@/components/super-admin/KonsultaLibrariesConsole";

export const metadata = {
  title: "PhilHealth Konsulta Libraries",
  description:
    "Manage PhilHealth Konsulta library tabs with browser-only Excel import and CRUD-style row workflows",
};

export default function KonsultaLibrariesPage() {
  return <KonsultaLibrariesConsole />;
}
