import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@components/ui/accordion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@components/ui/card";

interface InterventionsProps {
    consultation: Consultation;
}

export default function Interventions({ consultation}: InterventionsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Interventions</CardTitle>
        <CardDescription>
          Logs on all the interventions performed on the patient.
        </CardDescription>
      </CardHeader>
      <CardContent>
        
      </CardContent>
    </Card>
  );
}
