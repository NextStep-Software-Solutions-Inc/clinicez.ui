"use client";

import ActionButton from "@components/ActionButton";
import { Button } from "@components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@components/ui/card";
import { Separator } from "@components/ui/separator";
import Each from "@components/utils/Each";
import { zodResolver } from "@hookform/resolvers/zod";
import React from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { z } from "zod";
import VaxItem from "./VaxItem";

const vaxSchema = z.object({
  vaccinations: z.array(z.object({
    vaccineType: z.string().min(2, {
      message: "Vaccine type must be at least 2 characters.",
    }).max(30, {
      message: "Vaccine type must not be longer than 30 characters.",
    }),
    vaccine: z.string().min(2, {
      message: "Vaccine must be at least 2 characters.",
    }).max(30, {
      message: "Vaccine must not be longer than 30 characters.",
    }),
    dateGiven: z.date({
      required_error: "Please select a date.",
    }),
    route: z.string().min(2, {
      message: "Route must be at least 2 characters.",
    }).max(30, {
      message: "Route must not be longer than 30 characters.",
    }),
    dose: z.string().min(2, {
      message: "Dose must be at least 2 characters.",
    }).max(30, {
      message: "Dose must not be longer than 30 characters.",
    }),
    administeredBy: z.string().min(2, {
      message: "Administered by must be at least 2 characters.",
    }).max(30, {
      message: "Administered by must not be longer than 30 characters.",
    })
  }))
})

const vaccinations = [
  {
    vaccineType: "COVID-19",
    vaccine: "Moderna",
    dateGiven: new Date(),
    route: "Intramuscular",
    dose: "1st",
    administeredBy: "DOH",
  },
  {
    vaccineType: "Polio",
    vaccine: "IPV",
    dateGiven: new Date(),
    route: "Intramuscular",
    dose: "1st",
    administeredBy: "DOH",
  },
  {
    vaccineType: "Hepatitis B",
    vaccine: "HepB",
    dateGiven: new Date(),
    route: "Intramuscular",
    dose: "1st",
    administeredBy: "DOH",
  },
  {
    vaccineType: "Flu",
    vaccine: "Flu",
    dateGiven: new Date(),
    route: "Intramuscular",
    dose: "1st",
    administeredBy: "DOH",
  },
  {
    vaccineType: "Measles",
    vaccine: "Measles",
    dateGiven: new Date(),
    route: "Intramuscular",
    dose: "1st",
    administeredBy: "DOH",
  }, 
  {
    vaccineType: "Mumps",
    vaccine: "Mumps",
    dateGiven:new Date(),
    route: "Intramuscular",
    dose: "1st",
    administeredBy: "DOH",
  }, 
  {
    vaccineType: "Rubella",
    vaccine: "Rubella",
    dateGiven:new Date(),
    route: "Intramuscular",
    dose: "1st",
    administeredBy: "DOH",
  }
];

export default function VaccinationForm() {

  const form = useForm<z.infer<typeof vaxSchema>>({
    resolver: zodResolver(vaxSchema),
    defaultValues: {
      vaccinations: vaccinations
    }
  });

  
  const {fields, append, remove, update} =  useFieldArray({
    control: form.control,
    name: "vaccinations"
  })

  const initialVaxValues = {
    vaccineType: "",
    vaccine: "",
    dateGiven: new Date(),
    route: "",
    dose: "",
    administeredBy: ""
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
            Recent Vaccinations
          <Button className="ml-auto" onClick={() => append(initialVaxValues)}>Add Vaccination</Button>
        </CardTitle>
        <Separator/>
      </CardHeader>
      <CardContent className="space-y-2">
        <Each
          of={fields}
          render={(vaccination, index) => <VaxItem vaccination={vaccination} index={index} remove={remove} update={update}/>}
        />
        <Button onClick={() => append(initialVaxValues)} className="w-full">Add Vaccination</Button>
      </CardContent>
      <CardFooter>
        <ActionButton disabled={form.formState.isLoading || !form.formState.isValid}>Save Changes</ActionButton>
      </CardFooter>
    </Card>
  );
}
