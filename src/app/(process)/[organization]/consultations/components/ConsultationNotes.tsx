"use client";

import {
  getConsultationNotes,
  updateConsultationNotesAction
} from "@actions/consultations.action";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from "@components/ui/accordion";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@components/ui/card";
import { Textarea } from "@components/ui/textarea";
import ActionButton from "@components/ActionButton";
import { Save } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

interface ConsultationNotesProps {
  consultation: Consultation;
}
const consultationNoteSchema = z.object({
  subjective: z.string().min(2, { message: "Subject is too short" }),
  objective: z.string().min(2, { message: "Objective is too short" }),
  assessment: z.string().min(2, { message: "Assessment is too short" }),
  plan: z.string().min(2, { message: "Plan is too short" }),
})


export default function ConsultationNotes({
  consultation
}: ConsultationNotesProps) {

  async function fetchConsultationNotes() {
    return await getConsultationNotes(consultation.id)
  }
  const form = useForm<z.infer<typeof consultationNoteSchema>>({
    resolver: zodResolver(consultationNoteSchema),
    defaultValues: fetchConsultationNotes
  })

  const handleSave = async (formData: FormData) => {
    form.handleSubmit(async (data: z.infer<typeof consultationNoteSchema>) => {
      const payload = new FormData();
      // append all props of data to payload
      Object.keys(data).forEach((key) => {
        payload.append(key, data[key as keyof typeof data])
      })
      const res = await updateConsultationNotesAction(payload);
      if (res) {
        form.reset(data);
        toast.success("Consultation notes saved successfully", {
          position: "top-center",
        });
      }
    })()
  };

  return (
    <form action={handleSave}>
      <Card>
        <CardHeader>
          <div className="flex flex-row">
            <div>
              <CardTitle>Consultation Notes</CardTitle>
              <CardDescription>
                We follow the SOAP note format for our consultation notes.
              </CardDescription>
            </div>
            <div className="ml-auto">
              {
                form.formState.isDirty && (
                  <ActionButton >
                    <Save className="h-4 w-4 mr-2" />Save Changes              
                  </ActionButton>
                )
              }
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Accordion type="multiple">
            <AccordionItem value="subjective">
              <AccordionTrigger>Subjective History</AccordionTrigger>
              <AccordionContent className="m-1">
                <Textarea
                  rows={5}
                  placeholder="Write the subjective history here..."
                  {...form.register("subjective")}
                />
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="objective">
              <AccordionTrigger>Objective History</AccordionTrigger>
              <AccordionContent className="m-1">
                <Textarea
                  rows={5}
                  placeholder="Write the objective findings here..."
                  {...form.register("objective")}
                />
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="assessment">
              <AccordionTrigger>Assessment</AccordionTrigger>
              <AccordionContent className="m-1">
                <Textarea
                  rows={5}
                  placeholder="Write the assessment here..."
                  {...form.register("assessment")}
                />
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="plan">
              <AccordionTrigger>Plan History</AccordionTrigger>
              <AccordionContent className="m-1">
                <Textarea
                  rows={5}
                  placeholder="Write the plan here..."
                  {...form.register("plan")}
                />
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </CardContent>
      </Card>
    </form>
  );
}
