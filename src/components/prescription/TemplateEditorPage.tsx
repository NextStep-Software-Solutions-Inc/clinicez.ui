"use client";

import { useState, useTransition } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowLeft, Eye, Loader2 } from "lucide-react";

import { Button } from "@components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@components/ui/form";
import { Input } from "@components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@components/ui/sheet";
import Each from "@components/utils/Each";
import HtmlTemplateEditor from "./HtmlTemplateEditor";
import { renderPreviewTemplate } from "@/lib/document-template-preview";
import { promiseWrapper } from "@/lib/with-error-handling";
import {
  createDocumentTemplateAction,
  updateDocumentTemplateAction,
} from "@/actions/document-template.action";
import type { GetDocumentTypes } from "@/actions/document-type.action";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type DocumentType = NonNullable<GetDocumentTypes["data"]>[number];

const templateFormSchema = z.object({
  name: z.string({ required_error: "Template name is required" }).trim().min(1, "Template name is required"),
  htmlContent: z.string({ required_error: "HTML content is required" }).trim(),
  typeId: z.number({ coerce: true, required_error: "Document type is required" }),
});

type TemplateForm = z.infer<typeof templateFormSchema>;

export interface TemplateEditorPageProps {
  /** Existing template ID — if provided, the editor is in "edit" mode */
  templateId?: number;
  /** Pre-populated default values when editing an existing template */
  defaultValues?: Partial<TemplateForm>;
  /** The document type name (used for variable reference schema lookup) */
  defaultDocumentTypeName?: string;
  /** Available document types for the type selector */
  documentTypes: DocumentType[];
  /** Clinic UID — used when creating a new template */
  clinicUid: string;
  /** Where to navigate after save / cancel */
  backHref: string;
  /** Optional label for the document kind (e.g. "Prescription") */
  label?: string;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function TemplateEditorPage({
  templateId,
  defaultValues,
  defaultDocumentTypeName,
  documentTypes,
  clinicUid,
  backHref,
  label,
}: TemplateEditorPageProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [previewOpen, setPreviewOpen] = useState(false);
  const isEdit = templateId !== undefined;

  const form = useForm<TemplateForm>({
    resolver: zodResolver(templateFormSchema),
    defaultValues: {
      name: defaultValues?.name ?? "",
      htmlContent: defaultValues?.htmlContent ?? "",
      typeId: defaultValues?.typeId,
    },
  });

  const selectedTypeId = useWatch({ control: form.control, name: "typeId" });
  const htmlContent = useWatch({ control: form.control, name: "htmlContent" });

  const resolvedTypeName =
    documentTypes.find((t) => t.id === selectedTypeId)?.name ??
    defaultDocumentTypeName ??
    null;

  const previewHtml = renderPreviewTemplate(htmlContent ?? "", resolvedTypeName);

  const handleSave = form.handleSubmit((data) => {
    startTransition(() => {
      if (isEdit) {
        toast.promise(
          promiseWrapper(updateDocumentTemplateAction)({ ...data, id: templateId! }),
          {
            loading: `Updating ${label ?? "document"} template…`,
            success: (res) => {
              router.push(backHref);
              return res.message;
            },
            error: (err) => err,
          }
        );
      } else {
        toast.promise(
          promiseWrapper(createDocumentTemplateAction)({ ...data, clinicUid }),
          {
            loading: "Creating template…",
            success: (res) => {
              router.push(backHref);
              return res.message;
            },
            error: (err) => err,
          }
        );
      }
    });
  });

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-background">
      {/* ── Top toolbar ── */}
      <header className="flex items-center gap-3 px-5 py-3 border-b shrink-0 bg-background z-10">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push(backHref)}
          aria-label="Back"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>

        <div className="flex-1 min-w-0">
          <h1 className="text-sm font-semibold truncate">
            {isEdit ? "Edit" : "New"} {label ?? "Document"} Template
          </h1>
          {resolvedTypeName && (
            <p className="text-xs text-muted-foreground truncate">{resolvedTypeName}</p>
          )}
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          className="gap-1.5"
          onClick={() => setPreviewOpen(true)}
          disabled={!htmlContent?.trim()}
        >
          <Eye className="h-3.5 w-3.5" />
          Preview
        </Button>

        <Button
          type="button"
          size="sm"
          disabled={isPending}
          onClick={() => handleSave()}
          className="gap-1.5"
        >
          {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
          {isEdit ? "Save changes" : "Create"}
        </Button>
      </header>

      {/* ── Editor body ── */}
      <Form {...form}>
        <form
          id="template-editor-form"
          onSubmit={handleSave}
          className="flex flex-1 overflow-hidden min-h-0"
        >
          {/* Left: form fields */}
          <div className="w-full flex flex-col gap-5 overflow-y-auto border-r p-5 no-scrollbar">
            {/* Type selector — only shown in create mode */}
            {!isEdit && (
              <FormField
                control={form.control}
                name="typeId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Document Type</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      name={field.name}
                      defaultValue={field.value?.toString()}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select document template type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <Each
                          of={documentTypes}
                          render={(type) => (
                            <SelectItem key={type.id} value={type.id.toString()}>
                              {type.name || `Document Type #${type.id}`}
                            </SelectItem>
                          )}
                        />
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Template Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Give this template a unique name" {...field} />
                  </FormControl>
                  <FormDescription>
                    Used to identify this template in the list
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="htmlContent"
              render={({ field }) => (
                <FormItem className="flex flex-col flex-1 min-h-0">
                  <FormLabel>HTML Content</FormLabel>
                  <FormControl className="flex-1">
                    <HtmlTemplateEditor
                      value={field.value}
                      onChange={field.onChange}
                      documentTypeName={resolvedTypeName}
                      placeholder="Enter the HTML content of the document template…"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </form>
      </Form>

      {/* ── Preview Sheet (right side, 75% width) ── */}
      <Sheet open={previewOpen} onOpenChange={setPreviewOpen}>
        <SheetContent
          side="right"
          className="w-3/4 sm:max-w-none p-0 flex flex-col gap-0"
        >
          <SheetHeader className="px-5 py-3 border-b shrink-0">
            <SheetTitle className="text-sm flex items-center gap-2">
              <Eye className="h-4 w-4 text-muted-foreground" />
              Live Preview
              <span className="ml-auto text-[10px] font-normal text-muted-foreground italic">
                Sample data — real values used on generation
              </span>
            </SheetTitle>
          </SheetHeader>
          {htmlContent?.trim() ? (
            <iframe
              srcDoc={previewHtml}
              title="Template preview"
              sandbox="allow-same-origin"
              className="flex-1 w-full border-0"
            />
          ) : (
            <div className="flex-1 flex items-center justify-center text-sm text-muted-foreground italic px-6">
              Add some HTML content to preview the template.
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
