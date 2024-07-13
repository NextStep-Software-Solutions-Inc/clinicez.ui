import { Activity, Brain, Cross, Gauge, HeartPulse, Ruler, Thermometer, Weight } from "lucide-react";
import VitalCard from "./VitalCard";
import {  DeleteVitals } from "./DeleteVitals";
import ConditionalRender from "@components/utils/ConditionalRender";
import { VitalSignsType } from "./RecentVitalSigns";
import EditVitalSignsModal from "./EditVitalSignsModal";
import { LabelValue } from "@components/LabelValue";

interface VitalSignProps {
    readOnly: boolean;
    vitalSign: VitalSignsType[number];
}

export default function VitalSign({readOnly, vitalSign}:VitalSignProps){
  return (
    <div className="group/action">
      <div className="flex flex-wrap gap-2">
        <VitalCard label="Height" icon={Ruler} value={vitalSign.height ?? ""} unit={"cm"}/>
        <VitalCard label="Weight" icon={Weight}value={vitalSign.weight ?? ""} unit={"kg"}/>
        <VitalCard label="BMI" icon={Cross} value={vitalSign.bmi?.toFixed(2) ?? ""} unit="kg/m²"/>
        <VitalCard label="Blood Pressure" icon={Gauge} value={`${vitalSign.bpSystolic}/${vitalSign.bpDiastolic}`} unit="mm Hg"/>
        <VitalCard label="Pulse Rate" icon={HeartPulse} value={vitalSign.pulseRate ?? ""} unit="ppm"/>
        <VitalCard label="Temperature" icon={Thermometer} value={vitalSign.temp ?? ""} unit="C"/>
        <VitalCard label="Respiratory Rate" icon={Activity} value={vitalSign.respRate ?? ""} unit="rpm"/>
        <VitalCard label="Oxygen Saturation" icon={Brain} value={vitalSign.spo2 ?? ""} unit="%"/>
      </div>
      <ConditionalRender condition={!!vitalSign.notes} fallback="">
        <div className="mt-2">
          <LabelValue className="flex gap-2 items-center" label={vitalSign.notes ?? ""} value="Notes:"/>
        </div>
      </ConditionalRender>
      <ConditionalRender condition={!readOnly}>
        <div className="flex justify-end flex-wrap gap-2 mt-5 invisible group-hover/action:visible transition-all">
          <EditVitalSignsModal vitalSign={vitalSign}/>
          <DeleteVitals id={vitalSign.id}/>
        </div>
      </ConditionalRender>
    </div>
  )
}