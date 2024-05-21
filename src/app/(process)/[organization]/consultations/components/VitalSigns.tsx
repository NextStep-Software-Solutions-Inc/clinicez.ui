import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@components/ui/accordion";
import { Button } from "@components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@components/ui/card";
import Each from "@components/utils/Each";
import { Brain, Gauge, Heart, HeartPulse, PersonStanding, Ruler, Thermometer, Weight } from "lucide-react";
import AddVitalSignsModal from "./AddVitalSignsModal";

interface VitalSignsProps {
    consultation: Consultation;
}
const vitalSigns = [
  {
    icon: Thermometer,
    name: "Temperature",
    value: "36.5°C",
    normalRange: "Normal temperature"
  },
  {
    icon: HeartPulse,
    name: "Pulse Rate",
    value: "82 bpm",
    normalRange: "Normal range: 60 - 100"
  },
  {
    icon: Heart,
    name: "Respiration Rate",
    value: "12 cpm",
    normalRange: "Normal range: 12 to 16"
  },
  {
    icon: Brain,
    name: "Oxygen Saturation",
    value: "95 %",
    normalRange: "Normal range: 70-100%"
  },
  {
    icon: Gauge,
    name: "Blood Pressure",
    value: "120/90 mmHG",
    normalRange: "Normal range: 70-100%"
  },
  {
    icon: Ruler,
    name: "Height",
    value: "139 cm",
    normalRange: "Normal range: 70-100%"
  },
  {
    icon: Weight,
    name: "Weight",
    value: "62 kg",
    normalRange: "Normal range: 70-100%"
  },
  {
    icon: PersonStanding,
    name: "Body Mass Index",
    value: "0",
    normalRange: "Proportional"
  }
]

export default function VitalSigns({ consultation}: VitalSignsProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex flex-row">
          <div>
            <CardTitle>Vital Signs</CardTitle>
            <CardDescription>
            Patients vital signs are recorded here.
            </CardDescription>
          </div>
          <div className="ml-auto">
            <AddVitalSignsModal consultation={consultation}/>
          </div>
        </div>
      </CardHeader>
      <CardContent>

        <div className="flex flex-row flex-wrap basis-[500px] gap-5">
          <Each
            of={vitalSigns}
            render={(vital) => {
              const Icon = vital.icon;
              return (
                <Card className="basis-auto grow">
                  <CardHeader>
                    <CardTitle className="flex gap-1"><Icon />{vital.value}</CardTitle>
                    <CardDescription>{vital.normalRange}</CardDescription>
                  </CardHeader>
                  <CardFooter>{vital.name}</CardFooter>
                </Card>
              )
            }}
          />
        </div>
        
      </CardContent>
    </Card>
  );
}
