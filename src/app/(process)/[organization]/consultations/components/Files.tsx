import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@components/ui/accordion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@components/ui/card";

interface FilesProps {
    consultation: Consultation;
}

export default function Files({ consultation}: FilesProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Files</CardTitle>
        <CardDescription>
          Collection of files related to the consultation.
        </CardDescription>
      </CardHeader>
      <CardContent>
        
      </CardContent>
    </Card>
  );
}
