"use client";

import { useState } from "react";
import {
  FileText,
  History,
  ShieldCheck,
  ClipboardList,
  FileUp,
  UserPlus,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import PhilHealthBatchReports from "./PhilHealthBatchReports";
import PhilHealthSubmissionHistory from "./PhilHealthSubmissionHistory";
import PhilHealthMemberRegistration from "./PhilHealthMemberRegistration";
import PhilHealthATCVerification from "./PhilHealthATCVerification";
import PhilHealthRegistrationList from "./PhilHealthRegistrationList";
import PhilHealthXmlImport from "./PhilHealthXmlImport";

interface PhilHealthYakapClientProps {
  clinicUid: string;
}

export function PhilHealthYakapClient({ clinicUid }: PhilHealthYakapClientProps) {
  const [activeTab, setActiveTab] = useState("batch-reports");

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-600 shadow-lg shadow-teal-500/20">
          <ShieldCheck className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">PhilHealth Yakap</h1>
          <p className="text-sm text-muted-foreground">Konsulta Package — XML Report Generation & Submission</p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="w-full flex overflow-x-auto bg-muted/50 p-1 rounded-xl gap-1 h-auto flex-wrap sm:flex-nowrap">
          <TabsTrigger
            value="batch-reports"
            className="flex-1 min-w-[140px] gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-lg text-xs sm:text-sm py-2.5"
          >
            <FileText className="h-4 w-4" />
            Batch Reports
          </TabsTrigger>
          <TabsTrigger
            value="submission-history"
            className="flex-1 min-w-[140px] gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-lg text-xs sm:text-sm py-2.5"
          >
            <History className="h-4 w-4" />
            Submission History
          </TabsTrigger>
          <TabsTrigger
            value="member-registration"
            className="flex-1 min-w-[140px] gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-lg text-xs sm:text-sm py-2.5"
          >
            <UserPlus className="h-4 w-4" />
            Member Registration
          </TabsTrigger>
          <TabsTrigger
            value="atc-verification"
            className="flex-1 min-w-[140px] gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-lg text-xs sm:text-sm py-2.5"
          >
            <ShieldCheck className="h-4 w-4" />
            ATC Verification
          </TabsTrigger>
          <TabsTrigger
            value="registration-list"
            className="flex-1 min-w-[140px] gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-lg text-xs sm:text-sm py-2.5"
          >
            <ClipboardList className="h-4 w-4" />
            Registration List
          </TabsTrigger>
          <TabsTrigger
            value="xml-import"
            className="flex-1 min-w-[140px] gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-lg text-xs sm:text-sm py-2.5"
          >
            <FileUp className="h-4 w-4" />
            XML Import
          </TabsTrigger>
        </TabsList>

        <TabsContent value="batch-reports" className="mt-6">
          <PhilHealthBatchReports clinicUid={clinicUid} />
        </TabsContent>

        <TabsContent value="submission-history" className="mt-6">
          <PhilHealthSubmissionHistory clinicUid={clinicUid} />
        </TabsContent>

        <TabsContent value="member-registration" className="mt-6">
          <PhilHealthMemberRegistration clinicUid={clinicUid} />
        </TabsContent>

        <TabsContent value="atc-verification" className="mt-6">
          <PhilHealthATCVerification clinicUid={clinicUid} />
        </TabsContent>

        <TabsContent value="registration-list" className="mt-6">
          <PhilHealthRegistrationList clinicUid={clinicUid} />
        </TabsContent>

        <TabsContent value="xml-import" className="mt-6">
          <PhilHealthXmlImport clinicUid={clinicUid} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
