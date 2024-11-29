"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from "@components/ui/card";
import React from "react";
import Each from "@components/utils/Each";
import Suspend from "@components/Suspend";
import dynamic from "next/dynamic";
import { Car, File } from "lucide-react";

import { useDocumentTemplates } from "@/hooks/useDocumentTemplate";
import DocumentTemplateItem from "./DocumentTemplateItem";
const CreateDocumentTemplateModal = dynamic(
  () => import("@components/prescription/modals/CreateDocumentTemplateModal")
);

export interface DocumentTemplatesProps {
  documentType?: string;
  label?: string;
}

export default function DocumentTemplates({documentType, label}: DocumentTemplatesProps) {
  const { data: documentTemplates, mutate } = useDocumentTemplates({
    typeName: documentType
  });


  return (
    <Card className="">
      <CardHeader>
        <div className="flex flex-wrap gap-2 items-center">
          <div>
            <CardTitle className="flex items-center gap-3 text-lg ">
              <File className="text-primary" />
              {label || "Document"} Templates
            </CardTitle>
            <CardDescription>
              Build and manage {label?.toLocaleLowerCase() || "document"} templates for your patients.
            </CardDescription>
          </div>
          <div className="ml-auto flex flex-grow sm:flex-grow-0 items-center gap-2">
            <Suspend>
              <CreateDocumentTemplateModal
                onCreated={mutate}
                documentType={documentType}
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
              <DocumentTemplateItem documentTemplate={template} onUpdated={mutate} />
            )}
          />
        </div>
      </CardContent>
      <CardFooter/>
    </Card>
  );
}
