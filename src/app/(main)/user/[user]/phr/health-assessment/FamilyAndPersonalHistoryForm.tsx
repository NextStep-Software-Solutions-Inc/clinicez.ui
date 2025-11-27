
"use client"

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MedicalHistorySection } from "./sections/MedicalHistorySection";
import { FamilyHistorySection } from "./sections/FamilyHistorySection";
import { SurgicalHistorySection } from "./sections/SurgicalHistorySection";
import { PersonalHistorySection } from "./sections/PersonalHistorySection";
import { ImmunizationSection } from "./sections/ImmunizationSection";
import { ObGyneHistorySection } from "./sections/ObGyneHistorySection";
import { NCDRiskSection } from "./sections/NCDRiskSection";
import type { Prisma } from "@prisma/client";

// Type for the health history data returned from getHealthHistoryAction
type HealthHistoryData = Prisma.UserGetPayload<{
  select: {
    id: true;
    MedicalHistories: {
      include: {
        Condition: true;
      }
    };
    FamilyMedicalHistory: true;
    SurgicalHistories: true;
    PersonalHistory: true;
    ObGyneHistory: true;
    PhysicalExaminations: true;
    PediatricMeasurements: true;
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

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
      <TabsList className="grid w-full grid-cols-5">
        <TabsTrigger value="medical">Medical History</TabsTrigger>
        <TabsTrigger value="family">Family History</TabsTrigger>
        <TabsTrigger value="surgical">Surgical History</TabsTrigger>
        <TabsTrigger value="personal">Personal History</TabsTrigger>
        <TabsTrigger value="obgyne">OB-Gyne</TabsTrigger>
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
          initialData={initialData?.FamilyMedicalHistory ?? null}
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
    </Tabs>
  );
};
