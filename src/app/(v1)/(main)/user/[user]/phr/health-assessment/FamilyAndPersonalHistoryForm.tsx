
"use client"

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MedicalHistorySection } from "./sections/MedicalHistorySection";
import { FamilyHistorySection } from "./sections/FamilyHistorySection";
import { SurgicalHistorySection } from "./sections/SurgicalHistorySection";
import { PersonalHistorySection } from "./sections/PersonalHistorySection";
import { ObGyneHistorySection } from "./sections/ObGyneHistorySection";
import type { Prisma } from "@prisma/client";

// Serialized type for the health history data with Decimal fields converted to numbers
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
    VitalSigns: true;
  }
}> & {
  VitalSigns: Array<{
    id: number;
    userId: number;
    createdAt: Date;
    updatedAt: Date;
    deletedAt: Date | null;
    dateTaken: Date;
    notes: string | null;
    length: number | null;
    headCircumference: number | null;
    skinfoldThickness: number | null;
    waistCircumference: number | null;
    hipCircumference: number | null;
    limbCircumference: number | null;
    midUpperArmCircumference: number | null;
  }>;
};

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
    </Tabs>
  );
};
