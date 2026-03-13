"use client";

import { updateDocumentTemplateAction } from "@/actions/document-template.action";
import HtmlTemplateEditor from "@/components/prescription/HtmlTemplateEditor";
import { promiseWrapper } from "@/lib/with-error-handling";
import ActionButton from "@components/ActionButton";
import CustomModalContent from "@components/CustomModalContent";
import { Button } from "@components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogFooter,
  DialogTrigger
} from "@components/ui/dialog";
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
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from "@components/ui/tooltip";
import { zodResolver } from "@hookform/resolvers/zod";
import { Pencil } from "lucide-react";
import { useRef } from "react";
import { useForm } from "react-hook-form";
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

export default function UpdateDocumentTemplateModal({onUpdated,documentTemplate, label}: UpdateDocumentTemplateModalProps) {
  const closeBtnRef = useRef<HTMLInputElement>(null);
  
  const form = useForm<UpdateDocumentForm>({
    resolver: zodResolver(updateDocumentTemplateFormSchema),
    defaultValues: {
      name: documentTemplate.name,
      htmlContent: documentTemplate.htmlContent
    }
  });

  const action = async () => {
    form.handleSubmit((data) => {
     
      toast.promise(promiseWrapper(updateDocumentTemplateAction)({...data, id: documentTemplate.id}), {
        loading: `Updating ${label ?? "document"} template `,
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
    <Dialog>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <DialogTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="invisible group-hover/item:visible"
              >
                <Pencil className="h-4 w-4  hover:scale-125 transition-all" />
              </Button>
            </DialogTrigger>
          </TooltipTrigger>
          <TooltipContent side="top">Modify</TooltipContent>
        </Tooltip>
      </TooltipProvider>
      <CustomModalContent
        className="sm:max-w-3xl overflow-scroll max-h-[100vh] no-scrollbar"
        label={`Update ${label ?? "Document"} Template`}
        description={
          <>
            Update the document template by filling in the fields below.
            <span className="italic font-semibold">{documentTemplate.id}</span>
          </>
        }
      >
        <Form {...form}>
          <form
            action={action}
            className="space-y-6"
          >
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
                <FormItem>
                  <FormLabel>HTML content</FormLabel>
                  <FormControl>
                    <HtmlTemplateEditor
                      value={field.value}
                      onChange={field.onChange}
                      documentTypeName={documentTemplate.DocumentTemplateType.name}
                      placeholder="Enter the HTML content of the document template…"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <DialogClose asChild>
                <input
                  ref={closeBtnRef}
                  type="hidden"
                  value="ok"
                />
              </DialogClose>
              <ActionButton type="submit">Save changes</ActionButton>
            </DialogFooter>
          </form>
        </Form>
      </CustomModalContent>
    </Dialog>
  );
}
