import { Card, CardContent } from "@components/ui/card";
import {
  getRegionsAction,
  getProvincesAction,
  getMunicipalitiesAction,
  getBarangaysAction,
} from "@actions/super-admin/locations.action";
import { LocationsConsole } from "@components/super-admin/locations/LocationsConsole";

export const metadata = {
  title: "Location Management",
  description: "Manage Philippine address options: regions, provinces, municipalities, and barangays",
};

export default async function LocationsPage() {
  const [initialRegions, initialProvinces, initialMunicipalities, initialBarangays] =
    await Promise.all([
      getRegionsAction({ pageSize: 20, pageNumber: 1 }),
      getProvincesAction({ pageSize: 20, pageNumber: 1 }),
      getMunicipalitiesAction({ pageSize: 20, pageNumber: 1 }),
      getBarangaysAction({ pageSize: 20, pageNumber: 1 }),
    ]);

  return (
    <Card>
      <CardContent className="pt-6">
        <LocationsConsole
          initialRegions={initialRegions}
          initialProvinces={initialProvinces}
          initialMunicipalities={initialMunicipalities}
          initialBarangays={initialBarangays}
        />
      </CardContent>
    </Card>
  );
}
