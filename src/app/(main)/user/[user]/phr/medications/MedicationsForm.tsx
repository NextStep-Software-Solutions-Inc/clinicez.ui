import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@components/ui/accordion";
import { Button } from "@components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@components/ui/card";
import { Separator } from "@components/ui/separator";
import Each from "@components/utils/Each";
import { faker } from "@faker-js/faker";

const medications = [
  {
    id: faker.number.int(),
    name: "Ibuprofen",
    reason: "Headache",
    dateStarted: faker.date.recent().toISOString(),
    dateResolved: faker.date.recent().toISOString(),
  },
  {
    id: faker.number.int(),
    name: "Lopinavir",
    reason: "Hyperventilation", 
    dateStarted: faker.date.recent().toISOString(),
    dateResolved: faker.date.recent().toISOString(),
  }, 
  {
    id: faker.number.int(),
    name: "Lozaratan",
    reason: "High blood pressure",
    dateStarted: faker.date.recent().toISOString(),
    dateResolved: faker.date.recent().toISOString(),
  }
  
]

export default function MedicationsForm() {
  return (
    <Accordion type="multiple" className="w-full">
      <AccordionItem value="insurance">
        <AccordionTrigger>List of Medications</AccordionTrigger>
        <AccordionContent className="space-y-2">
          <Each
            of={medications}
            render={(medication) => (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center group/actions">
                    <span>{medication.name}</span>
                    <span  className="ml-auto space-x-2 invisible group-hover/actions:visible transition-all">
                      <Button size="sm" variant="ghost">Edit</Button>
                      <Button size="sm" variant="destructive">Delete</Button>
                    </span>
                  </CardTitle>
                  <Separator />
                </CardHeader>
                <CardContent>
                  <section>
                    <div className="grid sm:grid-cols-2 grid-cols-1 gap-4">
                      <div>
                        <div className="font-semibold">Reaction</div>
                        <div>{medication.reason}</div>
                      </div>
                    </div>
                  </section>
                </CardContent>
              </Card>
            )}
          />
          <Button className="w-full">Add your Medication</Button>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
