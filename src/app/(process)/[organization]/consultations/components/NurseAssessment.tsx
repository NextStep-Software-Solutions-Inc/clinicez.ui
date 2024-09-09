"use client";

import { GetConsultationRecord } from "@actions/consultation/consultation-record.action";
import { getNurseAssessment, updateNurseAssessmentAction } from "@actions/consultations.action";
import ActionButton from "@components/ActionButton";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@components/ui/accordion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@components/ui/card";
import { Textarea } from "@components/ui/textarea";
import { zodResolver } from "@hookform/resolvers/zod";
import { Save } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

interface NurseAssessmentProps {
    consultation:  NonNullable<GetConsultationRecord["data"]>;
}

const nurseAssessmentSchema = z.object({
  preAssessment: z.string().min(2, { message: "Pre-assessment is too short" }),
  instructions: z.string().min(2, { message: "Instructions is too short" }),
  remarks: z.string().min(2, { message: "Remarks is too short" }),
})


export default function NurseAssessment({ consultation}: NurseAssessmentProps) {

  const fetchNurseAssessment = async () => {
    return await getNurseAssessment(consultation.id)
  }

  const form = useForm<z.infer<typeof nurseAssessmentSchema>>({
    resolver: zodResolver(nurseAssessmentSchema),  
    defaultValues: fetchNurseAssessment
  })

  const handleSave = async (formData: FormData) => {
    form.handleSubmit(async (data: z.infer<typeof nurseAssessmentSchema>) => {
      const payload = new FormData();
      // append all props of data to payload
      Object.keys(data).forEach((key) => {
        payload.append(key, data[key as keyof typeof data])
      })
      const res = await updateNurseAssessmentAction(payload);
      if (res) {
        form.reset(data);
        toast.success("Nurse assessment saved successfully", {
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
              <CardTitle>Nurse Assessment</CardTitle>
              <CardDescription>
          Nurse performed an assessment of the patient.
              </CardDescription>
            </div>
            <div className="ml-auto">
              {
                form.formState.isDirty && (
                  <ActionButton>
                    <Save className="h-4 w-4 mr-2" />Save Changes              
                  </ActionButton>
                )
              }
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible>
            <AccordionItem value="preAssessment">
              <AccordionTrigger>Pre-Assessment</AccordionTrigger>
              <AccordionContent className="m-1">
                <Textarea 
                  rows={5} 
                  placeholder="Write the remarks here..."
                  {...form.register("preAssessment")}
                />
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="instructions">
              <AccordionTrigger>Instructions</AccordionTrigger>
              <AccordionContent className="m-1">
                <Textarea 
                  rows={5}
                  placeholder="Write the remarks here..." 
                  {...form.register("instructions")}
                />
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="remarks">
              <AccordionTrigger>Remarks</AccordionTrigger>
              <AccordionContent className="m-1">
                <Textarea 
                  rows={5} 
                  placeholder="Write the remarks here..."
                  {...form.register("remarks")}
                />
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </CardContent>
      </Card>
    </form>
  );
}
