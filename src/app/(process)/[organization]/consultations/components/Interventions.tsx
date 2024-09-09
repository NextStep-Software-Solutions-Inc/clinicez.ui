import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@components/ui/accordion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@components/ui/card";
import AddInterventionModal from "./modals/AddInterventionModal";
import { Badge } from "@components/ui/badge";
import Each from "@components/utils/Each";
import { format } from "date-fns";
import { Avatar, AvatarFallback, AvatarImage } from "@components/ui/avatar";
import { getInterventionsAction } from "@actions/consultations.action";
import { GetConsultationRecord } from "@actions/consultation/consultation-record.action";

interface InterventionsProps {
    consultation: NonNullable<GetConsultationRecord["data"]>;
}

export default async function Interventions({ consultation}: InterventionsProps) {
  const interventions = await getInterventionsAction(consultation.id)

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
            render={(intervention) => {
              const hp = interventions.hps.find(hp => hp.id === intervention.hpId)
              return (
                <AccordionItem value={intervention.id.toString()}>
                  <AccordionTrigger>
                    <div className="flex flex-row items-center justify-between">
                      <span>{intervention.action}</span>
                      <Badge className="mx-2">{format(intervention.date, "PP")}</Badge>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent >
                    <div>
                      <div className="flex items-center gap-1">
                        <Avatar className="h-8 w-8 object-cover">
                          <AvatarImage src={hp?.avatarUrl} alt="avatar" />
                          <AvatarFallback>{hp?.name.substring(0,2)}</AvatarFallback>
                        </Avatar> 
                        <span className="text-muted-foreground font-semibold">{interventions.hps.find(hp => hp.id === intervention.hpId)?.name}</span>
                      </div>
                      <p className="ml-9">{intervention.details}</p>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              )
            }}
          />
        </Accordion>
      </CardContent>
    </Card>
  );
}
