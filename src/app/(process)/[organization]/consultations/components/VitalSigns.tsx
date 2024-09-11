import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@components/ui/card";
import Each from "@components/utils/Each";
import { Brain, Gauge, Heart, HeartPulse, PersonStanding, Ruler, Thermometer, Weight } from "lucide-react";
import AddVitalSignsModal from "./modals/AddVitalSignsModal";
import UpdateVitalSignsModal from "./modals/UpdateVitalSignsModal";
import { getVitalSignsAction } from "@actions/consultations.action";
import { GetConsultationRecord } from "@actions/consultation/consultation-record.action";
import RecentVitalSigns from "../../../../(main)/user/[user]/phr/vitals/RecentVitalSigns";
import { getUserVitalSignsAction } from "@actions/vitals.action";

interface VitalSignsProps {
    consultation:  NonNullable<GetConsultationRecord["data"]>;
}
const vitalSigns = [
  {
    key: "temperature",
    icon: Thermometer,
    name: "Temperature",
    normalRange: "Normal temperature"
  },
  {
    key: "pulse",
    icon: HeartPulse,
    name: "Pulse Rate",
    normalRange: "Normal range: 60 - 100"
  },
  {
    key: "respiration",
    icon: Heart,
    name: "Respiration Rate",
    normalRange: "Normal range: 12 to 16"
  },
  {
    key: "oxygenSaturation",
    icon: Brain,
    name: "Oxygen Saturation",
    normalRange: "Normal range: 70-100%"
  },
  {
    key: "bloodPressure",
    icon: Gauge,
    name: "Blood Pressure",
    normalRange: "Normal range: 70-100%"
  },
  {
    key: "height",
    icon: Ruler,
    name: "Height",
    normalRange: "Normal range: 70-100%"
  },
  {
    key: "weight",
    icon: Weight,
    name: "Weight",
    normalRange: "Normal range: 70-100%"
  },
  {
    key: "bmi",
    icon: PersonStanding,
    name: "Body Mass Index",
    normalRange: "Proportional"
  }
]

export default async function VitalSigns({ consultation}: VitalSignsProps) {

  const vitalSignsValue = await getVitalSignsAction(consultation.id)
  const vitalSigns = await getUserVitalSignsAction(consultation.Appointment.Requesters[0].email);
  return (
    <RecentVitalSigns vitalSigns={vitalSigns} readOnly={false} userId="1231" />
    // <Card>
    //   <CardHeader>
    //     <div className="flex flex-row">
    //       <div>
    //         <CardTitle>Vital Signs</CardTitle>
    //         <CardDescription>
    //         Patients vital signs are recorded here.
    //         </CardDescription>
    //       </div>
    //       <div className="ml-auto space-x-1">
    //         <AddVitalSignsModal consultation={consultation}/>
    //         <UpdateVitalSignsModal vitalSigns={vitalSignsValue}/>
    //       </div>
    //     </div>
    //   </CardHeader>
    //   <CardContent>

  //     <div className="flex flex-row flex-wrap basis-[500px] gap-5">
  //       <Each
  //         of={vitalSigns}
  //         render={(vital) => {
  //           const Icon = vital.icon;
  //           return (
  //             <Card className="basis-auto grow hover:shadow-xl hover:scale-105 group/icon transition-all">
  //               <CardHeader>
  //                 <CardTitle className="flex gap-1"><Icon className="text-primary mr-2 group-hover/icon:scale-150 transition-all"/>{vitalSignsValue[vital.key as keyof typeof vitalSignsValue]}</CardTitle>
  //                 <CardDescription>{vital.normalRange}</CardDescription>
  //               </CardHeader>
  //               <CardFooter>{vital.name}</CardFooter>
  //             </Card>
  //           )
  //         }}
  //       />
  //     </div>
        
  //   </CardContent>
  // </Card>
  );
}
