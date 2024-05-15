import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@components/ui/accordion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@components/ui/card";

interface ConversationProps {
    consultation: Consultation;
}

export default function Conversation({ consultation}: ConversationProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Conversation</CardTitle>
        <CardDescription>
          Thread of conversation between the patient and the healthcare provider.
        </CardDescription>
      </CardHeader>
      <CardContent>
        
      </CardContent>
    </Card>
  );
}
