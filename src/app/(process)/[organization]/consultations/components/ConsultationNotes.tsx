import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@components/ui/accordion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@components/ui/card";

interface ConsultationNotesProps {
    consultation: Consultation;
}

export default function ConsultationNotes({ consultation}: ConsultationNotesProps) {
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
            Yes. It adheres to the WAI-ARIA design pattern.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="objective">
            <AccordionTrigger>Objective History</AccordionTrigger>
            <AccordionContent>
            Yes. It adheres to the WAI-ARIA design pattern.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="assessment">
            <AccordionTrigger>Assessment</AccordionTrigger>
            <AccordionContent>
            Yes. It adheres to the WAI-ARIA design pattern.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="plan">
            <AccordionTrigger>Plan History</AccordionTrigger>
            <AccordionContent>
            Yes. It adheres to the WAI-ARIA design pattern.
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </CardContent>
    </Card>
  );
}
