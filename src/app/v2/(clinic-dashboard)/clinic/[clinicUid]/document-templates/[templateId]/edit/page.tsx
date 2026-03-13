import { Suspense } from "react";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getDocumentTypesAction } from "@/actions/document-type.action";
import { getDocumentTemplateByIdAction } from "@/actions/document-template.action";
import TemplateEditorPage from "@/components/prescription/TemplateEditorPage";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Edit Document Template",
  description: "Edit an existing document template",
};

interface EditDocumentTemplatePageProps {
  params: Promise<{ clinicUid: string; templateId: string }>;
  searchParams: Promise<{ label?: string }>;
}

export default async function EditDocumentTemplatePage({
  params,
  searchParams,
}: EditDocumentTemplatePageProps) {
  const { clinicUid, templateId } = await params;
  const { label } = await searchParams;

  const id = parseInt(templateId, 10);
  if (isNaN(id)) notFound();

  const [templateResult, docTypesResult] = await Promise.all([
    getDocumentTemplateByIdAction(id),
    getDocumentTypesAction({}),
  ]);

  if (!templateResult.status || !templateResult.data) notFound();
  if (!docTypesResult.status) notFound();

  const template = templateResult.data;
  const documentTypes = docTypesResult.data ?? [];

  return (
    <Suspense>
      <TemplateEditorPage
        templateId={template.id}
        defaultValues={{
          name: template.name,
          htmlContent: template.htmlContent,
          typeId: template.DocumentTemplateType.id,
        }}
        defaultDocumentTypeName={template.DocumentTemplateType.name}
        documentTypes={documentTypes}
        clinicUid={clinicUid}
        backHref={`/v2/clinic/${clinicUid}/settings`}
        label={label ?? template.DocumentTemplateType.name}
      />
    </Suspense>
  );
}
