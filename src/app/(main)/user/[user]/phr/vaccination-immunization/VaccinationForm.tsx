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
import { toast } from "@components/ui/use-toast";
import { delay } from "@lib/wait";
import { Badge } from "@components/ui/badge";
import { Plus } from "lucide-react";

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

 
  const handleSaveChanges = async() => {
    await delay(1000);
    form.handleSubmit((data) => {
      toast({
        title: "Vaccinations Updated",
        description: (
          <pre className="mt-2 w-[340px] rounded-md bg-slate-950 p-4">
            <code className="text-white">{JSON.stringify(data, null, 2)}</code>
          </pre>
        )
      })
      form.reset(data)
    })()
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
            Recent Vaccinations <Badge className="ml-2">{fields.length}</Badge>
          <Button className="ml-auto" onClick={() => append(initialVaxValues)}>Add Vaccination</Button>
        </CardTitle>
        <Separator/>
      </CardHeader>
      <CardContent className="space-y-2">
        <Each
          of={fields}
          render={(vaccination, index) => <VaxItem vaccination={vaccination} index={index} remove={remove} update={update}/>}
        />
        <Button variant="ghost" onClick={() => append(initialVaxValues)} className="w-full"><Plus className="mr-2 h-4 w-4"/>Add Vaccination</Button>
      </CardContent>
      <CardFooter>
        <form action={handleSaveChanges}>
          {form.formState.isDirty && <ActionButton disabled={form.formState.isLoading || !form.formState.isValid}>Save Changes</ActionButton>}
        </form>

      </CardFooter>
    </Card>
  );
}
