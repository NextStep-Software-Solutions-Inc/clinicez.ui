import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@components/ui/accordion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@components/ui/card";
import AddInterventionModal from "./AddInterventionModal";
import { Badge } from "@components/ui/badge";
import Each from "@components/utils/Each";
import interventions from "@public/json/interventions.json"
import { format } from "date-fns";

interface InterventionsProps {
    consultation: Consultation;
}

export default async function Interventions({ consultation}: InterventionsProps) {
  return (
    <Card>
      <CardHeader >
        <div className="flex flex-row">
          <div>
            <CardTitle>Interventions</CardTitle>
            <CardDescription>
              Logs on all the interventions performed on the patient.
            </CardDescription>
          </div>
          <div className="ml-auto">
            <AddInterventionModal consultation={consultation} intervention={[
              {
                id: "1",
                action: "Administered medication",
              }
            ]}/>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* list of interventions */}
        <Accordion type="multiple">
          <Each
            of={interventions.interventions}
            render={(intervention) => (
              <AccordionItem value={intervention.id.toString()}>
                <AccordionTrigger>
                  <div className="flex flex-row items-center justify-between">
                    <span>{intervention.action}</span>
                    <Badge className="mx-2">{format(intervention.date, "PP")}</Badge>
                  </div>
                </AccordionTrigger>
                <AccordionContent >
                  <div>
                    HP: {interventions.hps.find(hp => hp.id === intervention.hpId)?.name}
                    <p>{intervention.details}</p>
                  </div>
                </AccordionContent>
              </AccordionItem>
            )}
          />
        </Accordion>
      </CardContent>
    </Card>
  );
}
