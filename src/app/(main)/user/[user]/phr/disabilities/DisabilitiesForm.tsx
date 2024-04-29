import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@components/ui/accordion";
import { Button } from "@components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@components/ui/card";
import { Separator } from "@components/ui/separator";
import Each from "@components/utils/Each";
import React from "react";

const disabilities = [
  {
    type: "Blind",
    dateDiagnosed: "12/12/2021",
    severity: "Severe",
    notes: "Notes",
  },
  {
    type: "Deaf",
    dateDiagnosed: "12/12/2021",
    severity: "Severe",
    notes: "Notes",
  },
  {
    type: "Mute",
    dateDiagnosed: "12/12/2021",
    severity: "Severe",
    notes: "Notes",
  },
  {
    type: "Paralyzed",
    dateDiagnosed: "12/12/2021",
    severity: "Severe",
    notes: "Notes",
  },
  {
    type: "Amputee",
    dateDiagnosed: "12/12/2021",
    severity: "Severe",
    notes: "Notes",
  },
  {
    type: "Cognitive Disability",
    dateDiagnosed: "12/12/2021",
    severity: "Severe",
    notes: "Notes",
  },
  {
    type: "Physical Disability",
    dateDiagnosed: "12/12/2021",
    severity: "Severe",
    notes: "Notes",
  },
  {
    type: "Developmental Disability",
    dateDiagnosed: "12/12/2021",
    severity: "Severe",
    notes: "Notes",
  },
  {
    type: "Learning Disability",
    dateDiagnosed: "12/12/2021",
    severity: "Severe",
    notes: "Notes",
  }
]
const illnesses = [
  {
    type: "COVID-19",
    dateDiagnosed: "12/12/2021",
    severity: "Severe",
    notes: "Notes",
  },
  {
    type: "Pneumonia",
    dateDiagnosed: "12/12/2021",
    severity: "Severe",
    notes: "Notes",
  },
  {
    type: "Asthma",
    dateDiagnosed: "12/12/2021",
    severity: "Severe",
    notes: "Notes",
  },
  {
    type: "Diabetes",
    dateDiagnosed: "12/12/2021",
    severity: "Severe",
    notes: "Notes",
  },
  {
    type: "Hypertension",
    dateDiagnosed: "12/12/2021",
    severity: "Severe",
    notes: "Notes",
  }

]

export default function DisabilitiesForm() {
  return (
    <Accordion type="multiple" className="w-full space-y-5">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            Disabilities
            <Button className="ml-auto">Add Disability</Button>
          </CardTitle>
          <Separator/>
        </CardHeader>
        <CardContent className="space-y-2">
          <AccordionItem value="disabilities">
            <AccordionTrigger>List of disabilities</AccordionTrigger>
            <AccordionContent>
              <Each
                of={disabilities}
                render={(disability) => (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <span>{disability.type}</span>
                        <span  className="ml-auto space-x-2">
                          <Button size="sm" variant="ghost">Edit</Button>
                          <Button size="sm" variant="destructive">Delete</Button>
                        </span>
                      </CardTitle>
                      <Separator/>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div>
                          <span>Date Diagnosed: {disability.dateDiagnosed}</span>
                        </div>
                        <div>
                          <span>Severity: {disability.severity}</span>
                        </div>
                        <div>
                          <span>Notes: {disability.notes}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
          
                )}
              />
            </AccordionContent>
          </AccordionItem>
        </CardContent>
        <CardFooter>
          <Button>Save</Button>
        </CardFooter>
      </Card>
        
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            Illness
            <Button className="ml-auto">Add Illness</Button>
          </CardTitle>
          <Separator/>
        </CardHeader>
        <CardContent className="space-y-2">
          <AccordionItem value="illness">
            <AccordionTrigger>List of illness</AccordionTrigger>
            <AccordionContent>
              <Each
                of={illnesses}
                render={(illness) => (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <span>{illness.type}</span>
                        <span  className="ml-auto space-x-2">
                          <Button size="sm" variant="ghost">Edit</Button>
                          <Button size="sm" variant="destructive">Delete</Button>
                        </span>
                      </CardTitle>
                      <Separator/>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div>
                          <span>Date Diagnosed: {illness.dateDiagnosed}</span>
                        </div>
                        <div>
                          <span>Severity: {illness.severity}</span>
                        </div>
                        <div>
                          <span>Notes: {illness.notes}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              />
            </AccordionContent>
          </AccordionItem>
        </CardContent>
        <CardFooter>
          <Button>Save</Button>
        </CardFooter>
      </Card>
    </Accordion>
  );
}
