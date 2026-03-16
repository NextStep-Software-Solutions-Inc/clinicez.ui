"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from "@components/ui/card";
import React, { useEffect, useMemo, useState } from "react";
import Each from "@components/utils/Each";
import Suspend from "@components/Suspend";
import dynamic from "next/dynamic";
import { FileText } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import { useDocumentTemplates } from "@/hooks/useDocumentTemplate";
import { useDocumentTypes } from "@/hooks/useDocumentType";
import DocumentTemplateItem from "./DocumentTemplateItem";
import { useParams } from "next/navigation";
const CreateDocumentTemplateModal = dynamic(
  () => import("@components/prescription/modals/CreateDocumentTemplateModal")
);

export interface DocumentTemplatesProps {
  documentType?: string;
  label?: string;
  clinicUid?: string;
}

export default function DocumentTemplates({documentType, label, clinicUid}: DocumentTemplatesProps) {
  const params = useParams<{ clinicUid?: string }>();
  const resolvedClinicUid = clinicUid ?? params?.clinicUid;
  const { data: docTypesData } = useDocumentTypes();
  const [selectedType, setSelectedType] = useState<string | undefined>(documentType);
  useEffect(() => {
    setSelectedType(documentType);
  }, [documentType]);

  const docTypeOptions = useMemo(() => docTypesData?.data ?? [], [docTypesData?.data]);
  const { data: documentTemplates, mutate } = useDocumentTemplates({
    typeName: selectedType,
    clinicUid: resolvedClinicUid,
  });


  return (
    <Card className="">
      <CardHeader>
        <div className="flex items-center gap-3 flex-wrap sm:flex-nowrap">
          <div>
            <CardTitle className="flex items-center gap-3 text-lg ">
              <FileText className="text-primary" />
              {label || "Document"} Templates
            </CardTitle>
            <CardDescription>
              Build and manage {label?.toLocaleLowerCase() || "document"} templates for your patients.
            </CardDescription>
            <div className="mt-2 flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">Filter by type:</span>
              <Select
                value={selectedType ?? "all"}
                onValueChange={(val) => setSelectedType(val === "all" ? undefined : val)}
              >
                <SelectTrigger className="h-8 w-[180px] text-sm">
                  <SelectValue placeholder="All types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All types</SelectItem>
                  <Each
                    of={docTypeOptions}
                    render={(type) => (
                      <SelectItem key={type.id} value={type.name}>
                        {type.name}
                      </SelectItem>
                    )}
                  />
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="ml-auto flex flex-grow sm:flex-grow-0 items-center gap-2">
            <Suspend>
              <CreateDocumentTemplateModal
                documentType={documentType}
                clinicUid={resolvedClinicUid}
                label={label}
              />
            </Suspend>
          </div>
        </div>
      </CardHeader>
      <CardContent className="h-[25rem] overflow-y-auto no-scrollbar scrollBox">
        <div className="grid gap-1 ">
          <Each
            of={documentTemplates?.data ?? []}
            fallback={
              <p className="text-center text-muted-foreground">
              No {label?.toLocaleLowerCase() || "document"} template to show.
              </p>
            }
            render={(template) => (
              <DocumentTemplateItem documentTemplate={template} clinicUid={resolvedClinicUid} onUpdated={mutate} />
            )}
          />
        </div>
      </CardContent>
      <CardFooter/>
    </Card>
  );
}
