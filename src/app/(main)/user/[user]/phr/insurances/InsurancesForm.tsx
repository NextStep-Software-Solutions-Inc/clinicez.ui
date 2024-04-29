import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@components/ui/accordion";
import { Button } from "@components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@components/ui/card";
import { Separator } from "@components/ui/separator";
import Each from "@components/utils/Each";
import React from "react";

const insurances = [
  {
    provider: "Pru Life UK",
    policyNumber: "123456789",
    policyType: "Life",
    dateStarted: "12/12/2021",
    dateEnded: "12/12/2021",
    notes: "Notes",
  },
  {
    provider: "Sun Life",
    policyNumber: "123456789",
    policyType: "Life",
    dateStarted: "12/12/2021",
    dateEnded: "12/12/2021",
    notes: "Notes",
  },
  {
    provider: "Manulife",
    policyNumber: "123456789",
    policyType: "Life",
    dateStarted: "12/12/2021",
    dateEnded: "12/12/2021",
    notes: "Notes",
  },
  {
    provider: "AXA",
    policyNumber: "123456789",
    policyType: "Life",
    dateStarted: "12/12/2021",
    dateEnded: "12/12/2021",
    notes: "Notes",
  },
  {
    provider: "Philam Life",
    policyNumber: "123456789",
    policyType: "Life",
    dateStarted: "12/12/2021",
    dateEnded: "12/12/2021",
    notes: "Notes",
  },
  {
    provider: "BPI-Philam",
    policyNumber: "123456789",
    policyType: "Life",
    dateStarted: "12/12/2021",
    dateEnded: "12/12/2021",
    notes: "Notes",
  },
  {
    provider: "BDO Life",
    policyNumber: "123456789",
    policyType: "Life",
    dateStarted: "12/12/2021",
    dateEnded: "12/12/2021",
    notes: "Notes",
  }
]

const hmos = [
  {
    provider: "Maxicare",
    policyNumber: "123456789",
    policyType: "Health",
    dateStarted: "12/12/2021",
    dateEnded: "12/12/2021",
    notes: "Notes",
  },
  {
    provider: "Medicard",
    policyNumber: "123456789",
    policyType: "Health",
    dateStarted: "12/12/2021",
    dateEnded: "12/12/2021",
    notes: "Notes",
  },
  {
    provider: "Intellicare",
    policyNumber: "123456789",
    policyType: "Health",
    dateStarted: "12/12/2021",
    dateEnded: "12/12/2021",
    notes: "Notes",
  },
  {
    provider: "ValuCare",
    policyNumber: "123456789",
    policyType: "Health",
    dateStarted: "12/12/2021",
    dateEnded: "12/12/2021",
    notes: "Notes",
  },
  {
    provider: "Cocolife Health",
    policyNumber: "123456789",
    policyType: "Health",
    dateStarted: "12/12/2021",
    dateEnded: "12/12/2021",
    notes: "Notes",
  },
  {
    provider: "AsianLife Health",
    policyNumber: "123456789",
    policyType: "Health",
    dateStarted: "12/12/2021",
    dateEnded: "12/12/2021",
    notes: "Notes",
  },
  {
    provider: "Generali Pilipinas",
    policyNumber: "123456789",
    policyType: "Health",
    dateStarted: "12/12/2021",
    dateEnded: "12/12/2021",
    notes: "Notes",
  }
]

export default function InsurancesForm() {
  return (
    <Accordion type="multiple" className="w-full">
      <AccordionItem value="insurance">
        <AccordionTrigger>My Insurance Provider</AccordionTrigger>
        <AccordionContent className="space-y-2">
          <Each
            of={insurances}
            render={(insurance) => (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <span>{insurance.provider}</span>
                    <span  className="ml-auto space-x-2">
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
                        <div className="font-semibold">Policy Number</div>
                        <div>{insurance.policyNumber}</div>
                      </div>
                      <div>
                        <div className="font-semibold">Policy Type</div>
                        <div>{insurance.policyType}</div>
                      </div>
                      <div>
                        <div className="font-semibold">Date Started</div>
                        <div>{insurance.dateStarted}</div>
                      </div>
                      <div>
                        <div className="font-semibold">Date Ended</div>
                        <div>{insurance.dateEnded}</div>
                      </div>
                      <div>
                        <div className="font-semibold">Notes</div>
                        <div>{insurance.notes}</div>
                      </div>
                    </div>
                  </section>
                </CardContent>
              </Card>
            )}
          />
          <Button className="w-full">Add Insurance Provider</Button>
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="hmo">
        <AccordionTrigger>My HMO Provider</AccordionTrigger>
        <AccordionContent className="space-y-2">
          <Each
            of={hmos}
            render={(hmo) => (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <span>{hmo.provider}</span>
                    <span  className="ml-auto space-x-2">
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
                        <div className="font-semibold">Policy Number</div>
                        <div>{hmo.policyNumber}</div>
                      </div>
                      <div>
                        <div className="font-semibold">Policy Type</div>
                        <div>{hmo.policyType}</div>
                      </div>
                      <div>
                        <div className="font-semibold">Date Started</div>
                        <div>{hmo.dateStarted}</div>
                      </div>
                      <div>
                        <div className="font-semibold">Date Ended</div>
                        <div>{hmo.dateEnded}</div>
                      </div>
                      <div>
                        <div className="font-semibold">Notes</div>
                        <div>{hmo.notes}</div>
                      </div>
                    </div>
                  </section>
                </CardContent>
              </Card>
            )}
          />
          <Button className="w-full">Add HMO Provider</Button>
        </AccordionContent>
      </AccordionItem>

    </Accordion>
  );
}
