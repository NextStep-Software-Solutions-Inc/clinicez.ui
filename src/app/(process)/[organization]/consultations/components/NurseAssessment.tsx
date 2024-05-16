import { getNurseAssessment } from "@actions/consultations.action";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@components/ui/accordion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@components/ui/card";

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
            <AccordionContent>
              {assessment["pre-assessment"]}
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="instructions">
            <AccordionTrigger>Instructions</AccordionTrigger>
            <AccordionContent>
              {assessment.instructions}
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="remarks">
            <AccordionTrigger>Remarks</AccordionTrigger>
            <AccordionContent>
              {assessment.remarks}
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </CardContent>
    </Card>
  );
}
