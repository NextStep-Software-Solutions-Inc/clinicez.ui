import { KonsultaRecommendedServicesTable } from "./konsulta-recommended-services-table";

export const metadata = {
  title: "Konsulta Recommended Services | Super Admin",
};

export default function KonsultaRecommendedServicesPage() {
  return (
    <div className="space-y-6 max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
      <div className="border-b pb-4">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          Konsulta Recommended Services
        </h1>
        <p className="text-muted-foreground mt-2">
          Manage age and gender based rules for PhilHealth Yakap recommended diagnostic guidelines.
        </p>
      </div>

      <KonsultaRecommendedServicesTable />
    </div>
  );
}
