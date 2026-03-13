import { Suspense } from "react";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getDocumentTypesAction } from "@/actions/document-type.action";
import TemplateEditorPage from "@/components/prescription/TemplateEditorPage";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "New Document Template",
  description: "Create a new document template",
};

interface NewDocumentTemplatePageProps {
  params: Promise<{ clinicUid: string }>;
  searchParams: Promise<{ type?: string; label?: string }>;
}

export default async function NewDocumentTemplatePage({
  params,
  searchParams,
}: NewDocumentTemplatePageProps) {
  const { clinicUid } = await params;
  const { type, label } = await searchParams;

  const docTypesResult = await getDocumentTypesAction({ name: type });
  if (!docTypesResult.status) notFound();

  const documentTypes = docTypesResult.data ?? [];

  // If a specific type was pre-selected, find its ID
  const preSelectedType = type
    ? documentTypes.find((t) => t.name.toLowerCase() === type.toLowerCase())
    : undefined;

  return (
    <Suspense>
      <TemplateEditorPage
        documentTypes={documentTypes}
        defaultValues={{ typeId: preSelectedType?.id }}
        defaultDocumentTypeName={preSelectedType?.name ?? type}
        clinicUid={clinicUid}
        backHref={`/v2/clinic/${clinicUid}/settings`}
        label={label}
      />
    </Suspense>
  );
}
