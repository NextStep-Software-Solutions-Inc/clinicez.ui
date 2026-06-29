import SetupWizardForm from "@components/super-admin/SetupWizardForm";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@components/ui/breadcrumb";

export default function SetupWizardPage() {
  return (
    <div className="space-y-6">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/super-admin/tenants">Tenants</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Setup Wizard</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Tenant Setup Wizard</h1>
        <p className="text-muted-foreground mt-2">
          Create a new tenant, an initial organization, and a clinic in one simple flow.
        </p>
      </div>
      
      <div className="py-6">
        <SetupWizardForm />
      </div>
    </div>
  );
}
