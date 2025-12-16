import { redirect } from "next/navigation";

// Default super admin landing page redirects to permissions
export default function SuperAdminPage() {
  redirect("/super-admin/permissions");
}
