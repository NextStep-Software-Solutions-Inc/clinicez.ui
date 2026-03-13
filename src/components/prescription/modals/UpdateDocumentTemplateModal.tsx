"use client";

import { updateDocumentTemplateAction } from "@/actions/document-template.action";
import HtmlTemplateEditor from "@/components/prescription/HtmlTemplateEditor";
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
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, Pencil } from "lucide-react";
import { useRef } from "react";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

interface UpdateDocumentTemplateModalProps {
  onUpdated?: () => void;
  label?: string;
  documentTemplate: {
    id: number;
    name: string;
    htmlContent: string;
    DocumentTemplateType: {
      id: number
      name: string;
    }
  }
}

type UpdateDocumentForm = z.infer<typeof updateDocumentTemplateFormSchema>;
const updateDocumentTemplateFormSchema = z.object({
  name: z.string({
    required_error: "Document name is required"
  }).trim(),
  htmlContent: z.string({
    required_error: "Document content is required"
  }).trim(),
});

export default function UpdateDocumentTemplateModal({onUpdated, documentTemplate, label}: UpdateDocumentTemplateModalProps) {
  const closeBtnRef = useRef<HTMLButtonElement>(null);
  
  const form = useForm<UpdateDocumentForm>({
    resolver: zodResolver(updateDocumentTemplateFormSchema),
    defaultValues: {
      name: documentTemplate.name,
      htmlContent: documentTemplate.htmlContent
    }
  });

  const htmlContent = useWatch({ control: form.control, name: "htmlContent" });
  const documentTypeName = documentTemplate.DocumentTemplateType.name;
  const previewHtml = renderPreviewTemplate(htmlContent ?? "", documentTypeName);

  const action = async () => {
    form.handleSubmit((data) => {
      toast.promise(promiseWrapper(updateDocumentTemplateAction)({...data, id: documentTemplate.id}), {
        loading: `Updating ${label ?? "document"} template`,
        success: (res) => {
          onUpdated?.();
          closeBtnRef.current?.click();
          form.reset(data);
          return res.message;
        },
        error: error => error
      });
    })();
  };

  return (
    <Sheet>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="invisible group-hover/item:visible"
              >
                <Pencil className="h-4 w-4 hover:scale-125 transition-all" />
              </Button>
            </SheetTrigger>
          </TooltipTrigger>
          <TooltipContent side="top">Modify</TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <SheetContent
        side="right"
        className="sm:max-w-full w-full h-full flex flex-col p-0 gap-0"
      >
        {/* Header */}
        <SheetHeader className="px-6 py-4 border-b shrink-0">
          <SheetTitle>Update {label ?? "Document"} Template</SheetTitle>
          <SheetDescription>
            Edit the template on the left and see a live preview on the right.
          </SheetDescription>
        </SheetHeader>

        {/* Body: side-by-side panels */}
        <Form {...form}>
          <form
            id="update-template-form"
            action={action}
            className="flex flex-1 overflow-hidden min-h-0"
          >
            {/* Left panel — form fields (25%) */}
            <div className="w-1/4 flex flex-col gap-4 overflow-y-auto border-r p-5 no-scrollbar">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Give this document template a unique name"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Unique name for the document template
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
                        documentTypeName={documentTypeName}
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
          <ActionButton type="submit" form="update-template-form">
            Save changes
          </ActionButton>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
