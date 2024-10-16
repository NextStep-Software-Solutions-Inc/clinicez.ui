import { upsertConsultationNotesAction } from "@actions/consultation/consultation-notes.action"
import { zodResolver } from "@hookform/resolvers/zod"
import { useDebounceFunc } from "@hooks/useDebounceFunc"
import { useEffect, useRef, useState } from "react"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@components/ui/form"
import { AccordionContent, AccordionTrigger } from "@components/ui/accordion"
import { Textarea } from "@components/ui/textarea"
import { toast } from "sonner"
import { cn } from "@lib/utils"

interface GenericSectionProps {
    name: string
    label: string
    consultationId: number
    value?: string
    showOnPatient: boolean
    onUpdated?: () => void
    readonly?: boolean
  }
export default function GenericSection({name, label, consultationId, value = "", showOnPatient, onUpdated, readonly = true}: GenericSectionProps) {
  

  const formRef = useRef<HTMLFormElement>(null)
  const autoSubmit = useDebounceFunc(() => formRef.current?.requestSubmit(), 1000)

  type Schema = z.infer<typeof schema>
  const schema = z.object({
    [name]: z.string().trim().min(5, `The ${name} must be at least 5 characters long`),
  })
  const form = useForm<Schema>({
    resolver: zodResolver(schema),
    values: {
      [name]: value,
    }
  })
  const { watch } = form

  useEffect(() => {
    const subscription = watch((value, { name, type }) => {
      if (type === "change") {
        autoSubmit()
      }
    });
    return () => subscription.unsubscribe();
  }, [autoSubmit, watch]);

  
  const handleSave = async (formData: FormData) => {
    form.handleSubmit(async (data) => {
      formData.append("consultationTicketId", consultationId.toString())
      Object.entries(data).forEach(([key, value]) => {
        formData.append("section", key)
        formData.append("content", value)
      })
      toast.promise(upsertConsultationNotesAction(formData), {
        loading: "Saving consultation notes...",
        success: (res)  => {
          if(res.status) {
            form.reset(data)
            onUpdated?.()
          }
          return res.message;
        },
        error: "Failed to save consultation notes",
        position: "top-center",
      })
    })()
  };
  
  return (
    <Form {...form}>
      <form ref={formRef} action={handleSave}>
        <FormField
          control={form.control}
          name={name}
          render={({ field }) => (
            <FormItem>
              <AccordionTrigger className="hover:no-underline">
                <FormLabel>{label}</FormLabel>
              </AccordionTrigger>
              <AccordionContent className="p-1" asChild>
                <FormControl>
                  <Textarea
                    rows={5}
                    disabled={readonly && !showOnPatient}
                    className={cn("mb-2", {
                      "blur-sm": readonly && !showOnPatient
                    })}
                    placeholder={`Write the ${label.toLocaleLowerCase()} here...`}
                    value={field.value}
                    onChange={field.onChange}
                  />
                </FormControl>
                <FormMessage/>
              </AccordionContent>
            </FormItem>
          )}
        />
      </form>
    </Form>
  )
}