import { Button } from "@components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@components/ui/card";
import { Separator } from "@components/ui/separator";
import Each from "@components/utils/Each";
import dayjs from "dayjs";
import React from "react";


const vaccinations = [
  {
    vaccineType: "COVID-19",
    vaccine: "Moderna",
    dateGiven: "12/12/2021",
    route: "Intramuscular",
    dose: "1st",
    administeredBy: "DOH",
  },
  {
    vaccineType: "COVID-19",
    vaccine: "Pfizer",
    dateGiven: "12/12/2021",
    route: "Intramuscular",
    dose: "1st",
    administeredBy: "DOH",
  },
  {
    vaccineType: "Polio",
    vaccine: "IPV",
    dateGiven: "12/12/2021",
    route: "Intramuscular",
    dose: "1st",
    administeredBy: "DOH",
  },
  {
    vaccineType: "Hepatitis B",
    vaccine: "HepB",
    dateGiven: "12/12/2021",
    route: "Intramuscular",
    dose: "1st",
    administeredBy: "DOH",
  },
  {
    vaccineType: "Flu",
    vaccine: "Flu",
    dateGiven: "12/12/2021",
    route: "Intramuscular",
    dose: "1st",
    administeredBy: "DOH",
  },
  {
    vaccineType: "Measles",
    vaccine: "Measles",
    dateGiven: "12/12/2021",
    route: "Intramuscular",
    dose: "1st",
    administeredBy: "DOH",
  }, 
  {
    vaccineType: "Mumps",
    vaccine: "Mumps",
    dateGiven: "12/12/2021",
    route: "Intramuscular",
    dose: "1st",
    administeredBy: "DOH",
  }, 
  {
    vaccineType: "Rubella",
    vaccine: "Rubella",
    dateGiven: "12/12/2021",
    route: "Intramuscular",
    dose: "1st",
    administeredBy: "DOH",
  }
];

export default function VaccinationForm() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
            Recent Vaccinations
          <Button className="ml-auto">Add Vaccination</Button>
        </CardTitle>
        <Separator/>
      </CardHeader>
      <CardContent className="space-y-2">
        <Each
          of={vaccinations}
          render={(vaccination) => (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <span>{vaccination.vaccineType}</span>
                  <Button className="ml-auto">Edit</Button>
                </CardTitle>
                <Separator/>
              </CardHeader>
              <CardContent>
                <div className="grid sm:grid-cols-2 grid-cols-1 gap-4">
                  <div>
                    <div className="font-semibold">Vaccine</div>
                    <div>{vaccination.vaccine}</div>
                  </div>
                  <div>
                    <div className="font-semibold">Date Given</div>
                    <div>{dayjs(vaccination.dateGiven).format("DD/MM/YYYY")}</div>
                  </div>
                  <div>
                    <div className="font-semibold">Route</div>
                    <div>{vaccination.route}</div>
                  </div>
                  <div>
                    <div className="font-semibold">Dose</div>
                    <div>{vaccination.dose}</div>
                  </div>
                  <div>
                    <div className="font-semibold">Administered By</div>
                    <div>{vaccination.administeredBy}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        />
        

      </CardContent>
      <CardFooter>
        <Button className="">Save</Button>
      </CardFooter>
    </Card>
  );
}
