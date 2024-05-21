import { getNurseAssessment } from "@actions/consultations.action";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@components/ui/accordion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@components/ui/card";
import { Textarea } from "@components/ui/textarea";

interface NurseAssessmentProps {
    consultation: Consultation;
}

export default async function NurseAssessment({ consultation}: NurseAssessmentProps) {
  const assessment = await getNurseAssessment(consultation.id)
  return (
    <Card>
      <CardHeader>
        <CardTitle>Nurse Assessment</CardTitle>
        <CardDescription>
          Nurse performed an assessment of the patient.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Accordion type="single" collapsible>
          <AccordionItem value="pre-assessment">
            <AccordionTrigger>Pre-Assessment</AccordionTrigger>
            <AccordionContent className="m-1">
              <Textarea rows={5} defaultValue={assessment["pre-assessment"]} placeholder="Write the remarks here..." />
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="instructions">
            <AccordionTrigger>Instructions</AccordionTrigger>
            <AccordionContent className="m-1">
              <Textarea rows={5} defaultValue={assessment.instructions} placeholder="Write the remarks here..." />
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="remarks">
            <AccordionTrigger>Remarks</AccordionTrigger>
            <AccordionContent className="m-1">
              <Textarea rows={5} defaultValue={assessment.remarks} placeholder="Write the remarks here..." />
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </CardContent>
    </Card>
  );
}
