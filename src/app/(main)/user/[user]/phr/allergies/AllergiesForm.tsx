import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@components/ui/accordion";
import { Button } from "@components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@components/ui/card";
import { Separator } from "@components/ui/separator";
import Each from "@components/utils/Each";
import { faker } from "@faker-js/faker";

const allergies = [
  {
    id: faker.number.int(),
    allergen: "Peanuts",
    reaction: "Slightly sneezy and a little bit of itching",
    dateDiscovered: faker.date.recent().toISOString(),
  },
  {
    id: faker.number.int(),
    allergen: "Shellfish",
    reaction: "Itchy and sneezing all over my body",
    dateDiscovered: faker.date.recent().toISOString(),
  },
  {
    id: faker.number.int(),
    allergen: "Mold",
    reaction: "Itchy and sneezing all over my body",
    dateDiscovered: faker.date.recent().toISOString(),
  },
  {
    id: faker.number.int(),
    allergen: "Peanuts",
    reaction: "Slightly sneezy and a little bit of itching",
    dateDiscovered: faker.date.recent().toISOString(),
  }
]

export default function AllergiesForm() {
  return (
    <Accordion type="multiple" className="w-full">
      <AccordionItem value="insurance">
        <AccordionTrigger>List of Allergies</AccordionTrigger>
        <AccordionContent className="space-y-2">
          <Each
            of={allergies}
            render={(allergy) => (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center group/actions">
                    <span>{allergy.allergen}</span>
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
                        <div>{allergy.reaction}</div>
                      </div>
                    </div>
                  </section>
                </CardContent>
              </Card>
            )}
          />
          <Button className="w-full">Add Known Allergy</Button>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
