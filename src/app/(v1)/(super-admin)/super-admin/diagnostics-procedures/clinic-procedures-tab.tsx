"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ClinicProceduresSelector } from "./clinic-procedures-selector";

export function ClinicProceduresTab() {
  const [activeTab, setActiveTab] = useState("imaging");

  return (
    <div className="space-y-4">
      <ClinicProceduresSelector defaultType="imaging" />
    </div>
  );
}
