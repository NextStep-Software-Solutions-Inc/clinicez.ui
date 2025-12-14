
"use client"

import { useState, useMemo } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MedicalHistorySection } from "./sections/MedicalHistorySection";
import { FamilyHistorySection } from "./sections/FamilyHistorySection";
import { SurgicalHistorySection } from "./sections/SurgicalHistorySection";
import { PersonalHistorySection } from "./sections/PersonalHistorySection";
import { ObGyneHistorySection } from "./sections/ObGyneHistorySection";
import { ImmunizationSection } from "./sections/ImmunizationSection";
// import { NCDRiskSection } from "./sections/NCDRiskSection";
import { summarizeImmunizations } from "@/lib/utils/immunization-mapping";
import type { Prisma } from "@prisma/client";

// Type for the health history data returned from getHealthHistoryAction
type HealthHistoryData = Prisma.UserGetPayload<{
  select: {
    id: true;
    dob: true;
    MedicalHistories: {
      include: {
        Condition: true;
      }
    };
    FamilyMedicalHistories: {
      include: {
        Condition: true;
      }
    };
    SurgicalHistories: true;
    PersonalHistory: true;
    ObGyneHistory: true;
    PhysicalExaminations: true;
    PediatricMeasurements: true;
    UserVaccinations: {
      include: {
        Vaccine: true;
        Dose: true;
      }
    };
  }
}>;

interface FamilyAndPersonalHistoryFormProps {
  userId: string;
  readOnly?: boolean;
  initialData: HealthHistoryData | null;
}

export const FamilyAndPersonalHistoryForm = ({
  userId,
  readOnly = true,
  initialData
}: FamilyAndPersonalHistoryFormProps) => {
  const [activeTab, setActiveTab] = useState("medical");

  // Compute immunization summary from vaccination records
  const immunizationSummary = useMemo(() => {
    if (!initialData?.UserVaccinations || !initialData?.dob) {
      return {
        children: {
          bcg: false, hepatitisB1: false, hepatitisB2: false, hepatitisB3: false,
          dpt1: false, dpt2: false, dpt3: false,
          opv1: false, opv2: false, opv3: false,
          measles: false, hepatitisA: false, varicella: false, none: true
        },
        adult: { hpv: false, mmr: false, none: true },
        pregnant: { tetanusToxoid: false, none: true },
        elderly: { fluVaccine: false, pneumococcalVaccine: false, none: true },
        others: []
      };
    }

    return summarizeImmunizations(
      initialData.UserVaccinations,
      initialData.dob,
      initialData.ObGyneHistory?.hasPreEclampsia || false
    );
  }, [initialData]);

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
      <TabsList className="grid w-full grid-cols-6">
        <TabsTrigger value="medical">Medical History</TabsTrigger>
        <TabsTrigger value="family">Family History</TabsTrigger>
        <TabsTrigger value="surgical">Surgical History</TabsTrigger>
        <TabsTrigger value="personal">Personal History</TabsTrigger>
        <TabsTrigger value="obgyne">OB-Gyne</TabsTrigger>
        <TabsTrigger value="immunization">Immunization</TabsTrigger>
      </TabsList>

      <TabsContent value="medical">
        <MedicalHistorySection
          userId={userId}
          readOnly={readOnly}
          initialData={initialData?.MedicalHistories || []}
        />
      </TabsContent>

      <TabsContent value="family">
        <FamilyHistorySection
          userId={userId}
          readOnly={readOnly}
          initialData={initialData?.FamilyMedicalHistories || []}
        />
      </TabsContent>

      <TabsContent value="surgical">
        <SurgicalHistorySection
          userId={userId}
          readOnly={readOnly}
          initialData={initialData?.SurgicalHistories || []}
        />
      </TabsContent>

      <TabsContent value="personal">
        <PersonalHistorySection
          userId={userId}
          readOnly={readOnly}
          initialData={initialData?.PersonalHistory ?? null}
        />
      </TabsContent>

      <TabsContent value="obgyne">
        <ObGyneHistorySection
          userId={userId}
          readOnly={readOnly}
          initialData={initialData?.ObGyneHistory ?? null}
        />
      </TabsContent>

      <TabsContent value="immunization">
        <ImmunizationSection
          userId={userId}
          readOnly={readOnly}
          initialData={immunizationSummary}
        />
      </TabsContent>
    </Tabs>
  );
};
