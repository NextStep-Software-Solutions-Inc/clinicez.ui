"use client";

import { createDocumentTemplateAction } from "@/actions/document-template.action";
import HtmlTemplateEditor from "@/components/prescription/HtmlTemplateEditor";
import { useDocumentTypes } from "@/hooks/useDocumentType";
import { renderPreviewTemplate } from "@/lib/document-template-preview";
import { promiseWrapper } from "@/lib/with-error-handling";
import ActionButton from "@components/ActionButton";
import { Button } from "@components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from "@components/ui/form";
import { Input } from "@components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@components/ui/select";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger
} from "@components/ui/sheet";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from "@components/ui/tooltip";
import Each from "@components/utils/Each";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, Plus } from "lucide-react";
import { useParams } from "next/navigation";
import { useEffect, useRef } from "react";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

interface CreateDocumentTemplateModalProps {
  onCreated?: () => void;
  documentType?: string;
  label?: string;
  clinicUid?: string;
}

type CreateDocumentTemplateForm = z.infer<typeof createDocumentTemplateFormSchema>;
const createDocumentTemplateFormSchema = z.object({
  name: z.string({
    required_error: "Document name is required"
  }).trim(),
  htmlContent: z.string({
    required_error: "Document content is required"
  }).trim(),
  typeId: z.number({
    coerce: true,
    required_error: "Document type is required"
  }),
});

export default function CreateDocumentTemplateModal({
  onCreated,
  documentType,
  label,
  clinicUid,
}: CreateDocumentTemplateModalProps) {
  const params = useParams<{clinicUid?: string}>()
  const resolvedClinicUid = clinicUid ?? params?.clinicUid
  const closeBtnRef = useRef<HTMLButtonElement>(null);

  const { data: docTypes } = useDocumentTypes({
    name: documentType
  });

  const form = useForm<CreateDocumentTemplateForm>({
    resolver: zodResolver(createDocumentTemplateFormSchema),
    defaultValues: {
      name: "",
      htmlContent: "",
    }
  });

  const selectedTypeId = useWatch({ control: form.control, name: "typeId" });
  const htmlContent = useWatch({ control: form.control, name: "htmlContent" });

  const selectedTypeName =
    docTypes?.data?.find((t) => t.id === selectedTypeId)?.name ??
    documentType ??
    null;

  const previewHtml = renderPreviewTemplate(htmlContent ?? "", selectedTypeName);

  const action = async () => {
    form.handleSubmit((data) => {
      if(!resolvedClinicUid) {
        toast.error("Clinic is required to create a document template");
        return;
      }

      toast.promise(promiseWrapper(createDocumentTemplateAction)({...data, clinicUid: resolvedClinicUid}), {
        loading: "Creating new prescription...",
        success: (res) => {
          onCreated?.();
          closeBtnRef.current?.click();
          form.reset(data);
          return res.message;
        },
        error: error => error
      });
    })();
  };

  useEffect(() => {
    if (docTypes?.data?.length === 1 && docTypes?.data[0].name === documentType) {
      form.setValue("typeId", docTypes?.data[0].id);
    }
  }, [form, docTypes?.data, documentType]);

  return (
    <Sheet>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <SheetTrigger asChild>
              <Button className="w-full sm:w-auto whitespace-nowrap">
                <Plus className="h-4 w-4 mr-2" />
                New {label ?? "Document"} Template
              </Button>
            </SheetTrigger>
          </TooltipTrigger>
          <TooltipContent>Create New {label ?? "Document"} Template</TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <SheetContent
        side="right"
        className="sm:max-w-full w-full h-full flex flex-col p-0 gap-0"
      >
        {/* Header */}
        <SheetHeader className="px-6 py-4 border-b shrink-0">
          <SheetTitle>Create New {label ?? "Document"} Template</SheetTitle>
          <SheetDescription>
            Fill in the form on the left and see a live preview on the right.
          </SheetDescription>
        </SheetHeader>

        {/* Body: side-by-side panels */}
        <Form {...form}>
          <form
            id="create-template-form"
            action={action}
            className="flex flex-1 overflow-hidden min-h-0"
          >
            {/* Left panel — form fields (25%) */}
            <div className="w-1/4 flex flex-col gap-4 overflow-y-auto border-r p-5 no-scrollbar">
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
                          of={docTypes?.data ?? []}
                          render={(type) => (
                            <SelectItem value={type.id.toString()}>
                              {type.name || `Document Type #${type.id}`}
                            </SelectItem>
                          )}
                        />
                      </SelectContent>
                    </Select>
                    <FormDescription></FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Give this prescription a unique name"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      This name will be used to identify the template
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
                        documentTypeName={selectedTypeName}
                        placeholder="Enter the HTML content of the document template…"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Right panel — live preview (75%) */}
            <div className="flex-1 flex flex-col bg-muted/10 min-w-0">
              <div className="flex items-center gap-2 px-4 py-2 border-b bg-muted/20 shrink-0">
                <Eye className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-xs text-muted-foreground font-medium">Live Preview</span>
                <span className="ml-auto text-[10px] text-muted-foreground italic">
                  Sample data — real values used on generation
                </span>
              </div>
              {htmlContent?.trim() ? (
                <iframe
                  srcDoc={previewHtml}
                  title="Template preview"
                  sandbox="allow-same-origin"
                  className="flex-1 w-full border-0"
                />
              ) : (
                <div className="flex-1 flex items-center justify-center text-sm text-muted-foreground italic px-6">
                  Start typing HTML in the editor to see a live preview here.
                </div>
              )}
            </div>
          </form>
        </Form>

        {/* Footer */}
        <SheetFooter className="px-6 py-3 border-t shrink-0 flex flex-row justify-end gap-2">
          <SheetClose asChild>
            <Button ref={closeBtnRef} variant="outline" type="button">
              Cancel
            </Button>
          </SheetClose>
          <ActionButton type="submit" form="create-template-form">
            Create
          </ActionButton>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
