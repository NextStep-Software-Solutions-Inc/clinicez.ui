"use client";

import {
  GetRegionsResult,
  GetProvincesResult,
  GetMunicipalitiesResult,
  GetBarangaysResult,
} from "@actions/super-admin/locations.action";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@components/ui/tabs";
import { RegionsTab } from "./RegionsTab";
import { ProvincesTab } from "./ProvincesTab";
import { MunicipalitiesTab } from "./MunicipalitiesTab";
import { BarangaysTab } from "./BarangaysTab";

interface LocationsConsoleProps {
  initialRegions: GetRegionsResult;
  initialProvinces: GetProvincesResult;
  initialMunicipalities: GetMunicipalitiesResult;
  initialBarangays: GetBarangaysResult;
}

export function LocationsConsole({
  initialRegions,
  initialProvinces,
  initialMunicipalities,
  initialBarangays,
}: LocationsConsoleProps) {
  return (
    <div className="space-y-6">
      <div className="border-b pb-4">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Location Management</h1>
        <p className="text-muted-foreground mt-2">
          Manage Philippine address options: regions, provinces, municipalities, and barangays.
        </p>
      </div>

      <Tabs defaultValue="regions">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="regions">Regions</TabsTrigger>
          <TabsTrigger value="provinces">Provinces</TabsTrigger>
          <TabsTrigger value="municipalities">Municipalities</TabsTrigger>
          <TabsTrigger value="barangays">Barangays</TabsTrigger>
        </TabsList>

        <TabsContent value="regions" className="mt-4">
          <RegionsTab initialData={initialRegions} />
        </TabsContent>

        <TabsContent value="provinces" className="mt-4">
          <ProvincesTab initialData={initialProvinces} />
        </TabsContent>

        <TabsContent value="municipalities" className="mt-4">
          <MunicipalitiesTab initialData={initialMunicipalities} />
        </TabsContent>

        <TabsContent value="barangays" className="mt-4">
          <BarangaysTab initialData={initialBarangays} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
