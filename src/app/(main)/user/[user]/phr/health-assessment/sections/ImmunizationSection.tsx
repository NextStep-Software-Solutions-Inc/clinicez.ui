"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Info } from "lucide-react";
import Link from "next/link";
import type { ImmunizationSummary } from "@/lib/utils/immunization-mapping";

interface ImmunizationSectionProps {
  userId: string;
  readOnly?: boolean;
  initialData: ImmunizationSummary;
}

interface ImmunizationCheckItemProps {
  label: string;
  checked: boolean;
}

const ImmunizationCheckItem = ({ label, checked }: ImmunizationCheckItemProps) => (
  <div className="flex items-center space-x-2">
    <Checkbox checked={checked} disabled className="cursor-default" />
    <label className={`text-sm ${checked ? "font-medium" : "text-muted-foreground"}`}>
      {label}
    </label>
  </div>
);

export const ImmunizationSection = ({
  userId,
  readOnly = false,
  initialData
}: ImmunizationSectionProps) => {
  const totalVaccinations = [
    initialData.children.bcg,
    initialData.children.hepatitisB1,
    initialData.children.hepatitisB2,
    initialData.children.hepatitisB3,
    initialData.children.dpt1,
    initialData.children.dpt2,
    initialData.children.dpt3,
    initialData.children.opv1,
    initialData.children.opv2,
    initialData.children.opv3,
    initialData.children.measles,
    initialData.children.hepatitisA,
    initialData.children.varicella,
    initialData.adult.hpv,
    initialData.adult.mmr,
    initialData.pregnant.tetanusToxoid,
    initialData.elderly.fluVaccine,
    initialData.elderly.pneumococcalVaccine,
  ].filter(Boolean).length + initialData.others.length;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Immunization Record</span>
          <Badge variant="secondary">{totalVaccinations} vaccines</Badge>
        </CardTitle>
        <CardDescription>
          Vaccination history automatically populated from your vaccination records
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            This data is pulled from your{" "}
            <Link href={`/user/${userId}/phr/vaccination-immunization`} className="underline font-medium">
              Vaccination & Immunization records
            </Link>
            . To add or update vaccinations, visit that page.
          </AlertDescription>
        </Alert>

        {/* Children Immunizations */}
        <div>
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            Children (0-12 years)
            {!initialData.children.none && (
              <Badge variant="outline" className="font-normal">
                {[
                  initialData.children.bcg,
                  initialData.children.hepatitisB1,
                  initialData.children.hepatitisB2,
                  initialData.children.hepatitisB3,
                  initialData.children.dpt1,
                  initialData.children.dpt2,
                  initialData.children.dpt3,
                  initialData.children.opv1,
                  initialData.children.opv2,
                  initialData.children.opv3,
                  initialData.children.measles,
                  initialData.children.hepatitisA,
                  initialData.children.varicella,
                ].filter(Boolean).length}{" "}
                recorded
              </Badge>
            )}
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 pl-4">
            <ImmunizationCheckItem label="BCG" checked={initialData.children.bcg} />
            <ImmunizationCheckItem label="Hepatitis B (1st dose)" checked={initialData.children.hepatitisB1} />
            <ImmunizationCheckItem label="Hepatitis B (2nd dose)" checked={initialData.children.hepatitisB2} />
            <ImmunizationCheckItem label="Hepatitis B (3rd dose)" checked={initialData.children.hepatitisB3} />
            <ImmunizationCheckItem label="DPT (1st dose)" checked={initialData.children.dpt1} />
            <ImmunizationCheckItem label="DPT (2nd dose)" checked={initialData.children.dpt2} />
            <ImmunizationCheckItem label="DPT (3rd dose)" checked={initialData.children.dpt3} />
            <ImmunizationCheckItem label="OPV (1st dose)" checked={initialData.children.opv1} />
            <ImmunizationCheckItem label="OPV (2nd dose)" checked={initialData.children.opv2} />
            <ImmunizationCheckItem label="OPV (3rd dose)" checked={initialData.children.opv3} />
            <ImmunizationCheckItem label="Measles" checked={initialData.children.measles} />
            <ImmunizationCheckItem label="Hepatitis A" checked={initialData.children.hepatitisA} />
            <ImmunizationCheckItem label="Varicella" checked={initialData.children.varicella} />
            {initialData.children.none && (
              <div className="col-span-full">
                <ImmunizationCheckItem label="None" checked={true} />
              </div>
            )}
          </div>
        </div>

        {/* Adult Immunizations */}
        <div>
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            Adult (13-59 years)
            {!initialData.adult.none && (
              <Badge variant="outline" className="font-normal">
                {[initialData.adult.hpv, initialData.adult.mmr].filter(Boolean).length} recorded
              </Badge>
            )}
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 pl-4">
            <ImmunizationCheckItem label="HPV" checked={initialData.adult.hpv} />
            <ImmunizationCheckItem label="MMR" checked={initialData.adult.mmr} />
            {initialData.adult.none && (
              <ImmunizationCheckItem label="None" checked={true} />
            )}
          </div>
        </div>

        {/* Pregnant Women Immunizations */}
        <div>
          <h3 className="font-semibold mb-3">Pregnant Women</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 pl-4">
            <ImmunizationCheckItem label="Tetanus Toxoid" checked={initialData.pregnant.tetanusToxoid} />
            {initialData.pregnant.none && (
              <ImmunizationCheckItem label="None" checked={true} />
            )}
          </div>
        </div>

        {/* Elderly Immunizations */}
        <div>
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            Elderly (60+ years)
            {!initialData.elderly.none && (
              <Badge variant="outline" className="font-normal">
                {[initialData.elderly.fluVaccine, initialData.elderly.pneumococcalVaccine].filter(Boolean).length} recorded
              </Badge>
            )}
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 pl-4">
            <ImmunizationCheckItem label="Flu Vaccine" checked={initialData.elderly.fluVaccine} />
            <ImmunizationCheckItem label="Pneumococcal Vaccine" checked={initialData.elderly.pneumococcalVaccine} />
            {initialData.elderly.none && (
              <ImmunizationCheckItem label="None" checked={true} />
            )}
          </div>
        </div>

        {/* Other Vaccinations */}
        {initialData.others.length > 0 && (
          <div>
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              Other Vaccinations
              <Badge variant="outline" className="font-normal">
                {initialData.others.length}
              </Badge>
            </h3>
            <div className="pl-4">
              <p className="text-sm text-muted-foreground">
                {initialData.others.join(", ")}
              </p>
            </div>
          </div>
        )}

        {totalVaccinations === 0 && (
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              No vaccination records found. Visit the{" "}
              <Link href={`/user/${userId}/phr/vaccination-immunization`} className="underline font-medium">
                Vaccination & Immunization page
              </Link>{" "}
              to add your vaccination history.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};
