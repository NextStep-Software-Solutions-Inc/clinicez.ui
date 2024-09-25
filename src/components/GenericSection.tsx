import { upsertConsultationNotesAction } from "@actions/consultation/consultation-notes.action"
import { zodResolver } from "@hookform/resolvers/zod"
import { useConsultationNotes } from "@hooks/useConsultationNote"
import { useDebounceFunc } from "@hooks/useDebounceFunc"
import { useParams } from "next/navigation"
import { useEffect, useRef } from "react"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@components/ui/form"
import { AccordionContent, AccordionTrigger } from "@components/ui/accordion"
import { Textarea } from "@components/ui/textarea"
import { toast } from "sonner"

interface GenericSectionProps {
    name: string
    label: string
    consultationId: number
    value?: string
  }
export default function GenericSection({name, label, consultationId, value = ""}: GenericSectionProps) {
  
    type Schema = z.infer<typeof schema>
    const schema = z.object({
      [name]: z.string().trim().min(5, `The ${name} must be at least 5 characters long`),
    })
    const { organization: orgUid } = useParams<{organization: string}>()
    const formRef = useRef<HTMLFormElement>(null)
    const autoSubmit = useDebounceFunc(() => formRef.current?.requestSubmit(), 1000)
    const { mutate } = useConsultationNotes({ orgUid, consultationId })
  
    const form = useForm<Schema>({
      resolver: zodResolver(schema),
      mode: "onChange",
      defaultValues: {
        [name]: value
      }
    })
    const { formState: { isValidating, isValid } } = form
  
    useEffect(() => {
      form.setValue(name, value)
    }, [form, name, value])
  
    useEffect(() => {
      if (isValid && !isValidating) {
        autoSubmit()
      }
    }, [isValidating, isValid]);
  
    const handleSave = async (formData: FormData) => {
      form.handleSubmit(async (data: Schema) => {
        formData.append("consultationTicketId", consultationId.toString())
        Object.entries(data).forEach(([key, value]) => {
          formData.append("section", key)
          formData.append("content", value)
        })
        toast.promise(upsertConsultationNotesAction(formData), {
          loading: "Saving consultation notes...",
          success: (res)  => {
            if(res.status) mutate()
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
                      className="mb-2"
                      placeholder={`Write the ${name} here...`}
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