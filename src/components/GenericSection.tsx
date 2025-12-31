import { upsertConsultationNotesAction } from "@actions/consultation/consultation-notes.action"
import { zodResolver } from "@hookform/resolvers/zod"
import { useDebounceFunc } from "@hooks/useDebounceFunc"
import { useEffect, useRef } from "react"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@components/ui/form"
import { AccordionContent, AccordionTrigger } from "@components/ui/accordion"
import { Textarea } from "@components/ui/textarea"
import { toast } from "sonner"
import { cn } from "@lib/utils"

interface GenericSectionProps {
  hpId: number;
  name: string
  label: string
  consultationId: number
  value?: string
  showOnPatient: boolean
  onUpdated?: () => void
  readonly?: boolean
  isPatientView?: boolean
}
export default function GenericSection({ hpId, name, label, consultationId, value = "", showOnPatient, onUpdated, readonly = true, isPatientView = false }: GenericSectionProps) {


  const formRef = useRef<HTMLFormElement>(null)
  // TODO: Increase the debounce time to >1000ms to compensate to users with <30 WPM typing speed
  const autoSubmit = useDebounceFunc(() => formRef.current?.requestSubmit(), 3000)

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

  // Patient views should have their fields masked when showOnPatient is false
  const shouldBlur = readonly && isPatientView && !showOnPatient


  const handleSave = async (formData: FormData) => {
    form.handleSubmit(async (data) => {
      formData.append("consultationTicketId", consultationId.toString())

      const [[section, content]] = Object.entries(data)
      try {
        const result = await upsertConsultationNotesAction({
          consultationTicketId: consultationId,
          section,
          content,
          hpId
        });

        toast.promise(Promise.resolve(result), {
          loading: "Saving consultation notes...",
          success: (res) => {
            if (res.status) {
              onUpdated?.()
            }
            return res.message;
          },
          error: "Failed to save consultation notes",
          position: "top-center",
        });

        // Reset form after the promise resolves to avoid setState during render
        if (result?.status) {
          form.reset(data)
        }
      } catch (error) {
        toast.error("Failed to save consultation notes");
      }
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
                    readOnly={readonly}
                    disabled={readonly || isPatientView}
                    className={cn("mb-2", {
                      "blur-sm": shouldBlur
                    })}
                    placeholder={`Write the ${label.toLocaleLowerCase()} here...`}
                    value={field.value}
                    onChange={field.onChange}
                  />
                </FormControl>
                <FormMessage />
              </AccordionContent>
            </FormItem>
          )}
        />
      </form>
    </Form>
  )
}