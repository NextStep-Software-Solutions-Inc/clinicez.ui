import { getConsultationNotes } from "@actions/consultations.action";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@components/ui/accordion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@components/ui/card";
import { Textarea } from "@components/ui/textarea";

interface ConsultationNotesProps {
    consultation: Consultation;
}

export default async function ConsultationNotes({ consultation}: ConsultationNotesProps) {
  const notes = await getConsultationNotes(consultation.id)
  return (
    <Card>
      <CardHeader>
        <CardTitle>Consultation Notes</CardTitle>
        <CardDescription>
          We follow the SOAP note format for our consultation notes.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Accordion type="single" collapsible>
          <AccordionItem value="subjective">
            <AccordionTrigger>Subjective History</AccordionTrigger>
            <AccordionContent className="m-1">
              <Textarea rows={5} defaultValue={notes.subjective} placeholder="Write the subjective history here..." />
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="objective">
            <AccordionTrigger>Objective History</AccordionTrigger>
            <AccordionContent className="m-1">
              <Textarea rows={5} defaultValue={notes.objective} placeholder="Write the objective findings here..." />
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="assessment">
            <AccordionTrigger>Assessment</AccordionTrigger>
            <AccordionContent className="m-1">
              <Textarea rows={5} defaultValue={notes.assessment} placeholder="Write the assessment here..." />
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="plan">
            <AccordionTrigger>Plan History</AccordionTrigger>
            <AccordionContent className="m-1">
              <Textarea rows={5} defaultValue={notes.plan} placeholder="Write the plan here..." />
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </CardContent>
    </Card>
  );
}
