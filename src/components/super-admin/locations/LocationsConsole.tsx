"use client";

import { useState } from "react";
import {
  GetRegionsResult,
  GetProvincesResult,
  GetMunicipalitiesResult,
  GetBarangaysResult,
  seedLocationsFromJsonAction,
} from "@actions/super-admin/locations.action";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@components/ui/tabs";
import { Button } from "@components/ui/button";
import { Database } from "lucide-react";
import { toast } from "sonner";
import { getActionErrorMessage } from "@/lib/action-error";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@components/ui/alert-dialog";
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
  const [showSeedDialog, setShowSeedDialog] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);

  const handleSeed = async () => {
    setIsSeeding(true);
    setShowSeedDialog(false);
    try {
      const result = await seedLocationsFromJsonAction();
      toast.success(
        `Seeded successfully: ${result.regions} regions, ${result.provinces} provinces, ${result.municipalities} municipalities, ${result.barangays} barangays.`
      );
    } catch (error) {
      toast.error(getActionErrorMessage(error, "Failed to seed location data"));
    } finally {
      setIsSeeding(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="border-b pb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Location Management</h1>
          <p className="text-muted-foreground mt-2">
            Manage Philippine address options: regions, provinces, municipalities, and barangays.
          </p>
        </div>
        <Button
          variant="outline"
          className="gap-2 shrink-0"
          onClick={() => setShowSeedDialog(true)}
          disabled={isSeeding}
        >
          <Database className="h-4 w-4" />
          {isSeeding ? "Seeding..." : "Seed from PSGC Data"}
        </Button>
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

      {/* Seed Confirmation Dialog */}
      <AlertDialog open={showSeedDialog} onOpenChange={setShowSeedDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Seed Location Data</AlertDialogTitle>
            <AlertDialogDescription>
              This will import all Philippine Standard Geographic Code (PSGC) data including 17 regions, 81 provinces,
              1,615 municipalities/cities, and 40,254 barangays. Existing records will be updated (upsert) — no data
              will be lost.
              <br />
              <br />
              This operation may take a few minutes to complete.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleSeed}>Start Seeding</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
