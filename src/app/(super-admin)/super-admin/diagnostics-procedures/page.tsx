import { DiagnosticsProceduresConsole } from "./diagnostics-procedures-console";

export const metadata = {
  title: "Master Procedures Management",
  description: "Manage system-wide master diagnostic and procedure definitions",
};

export default function DiagnosticsProceduresPage() {
  return <DiagnosticsProceduresConsole />;
}
