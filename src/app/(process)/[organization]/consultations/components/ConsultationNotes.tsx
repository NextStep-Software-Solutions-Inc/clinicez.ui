import { getConsultationNotes } from "@actions/consultations.action";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@components/ui/accordion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@components/ui/card";

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
            <AccordionContent>
              {notes.subjective}
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="objective">
            <AccordionTrigger>Objective History</AccordionTrigger>
            <AccordionContent>
              {notes.objective}
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="assessment">
            <AccordionTrigger>Assessment</AccordionTrigger>
            <AccordionContent>
              {notes.assessment}
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="plan">
            <AccordionTrigger>Plan History</AccordionTrigger>
            <AccordionContent>
              {notes.plan}
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </CardContent>
    </Card>
  );
}
