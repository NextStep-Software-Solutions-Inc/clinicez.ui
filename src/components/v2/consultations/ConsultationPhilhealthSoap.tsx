"use client"

import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import { Save } from "lucide-react"
import { savePhilhealthSoapAction } from "@/actions/konsulta/soap.action"

export default function ConsultationPhilhealthSoap({ clinicUid, consultation, onPatchDetail }: any) {
  const [saving, setSaving] = useState(false)

  const { register, handleSubmit, reset } = useForm()

  useEffect(() => {
    if (consultation?.ConsultationKonsultaData) {
      reset(consultation.ConsultationKonsultaData)
    }
  }, [consultation])

  const onSubmit = async (data: any) => {
    setSaving(true)
    try {
      const payload = {
        consultationTicketId: consultation.id,
        illnessHistory: data.illnessHistory,
        signsSymptoms: data.signsSymptoms,
        otherComplaint: data.otherComplaint,
        painSite: data.painSite,
        systolic: data.systolic ? parseFloat(data.systolic) : undefined,
        diastolic: data.diastolic ? parseFloat(data.diastolic) : undefined,
        hr: data.hr ? parseFloat(data.hr) : undefined,
        rr: data.rr ? parseFloat(data.rr) : undefined,
        temp: data.temp ? parseFloat(data.temp) : undefined,
        height: data.height ? parseFloat(data.height) : undefined,
        weight: data.weight ? parseFloat(data.weight) : undefined,
        bmi: data.bmi ? parseFloat(data.bmi) : undefined,
        zScore: data.zScore,
        leftVision: data.leftVision,
        rightVision: data.rightVision,
        length: data.length,
        headCirc: data.headCirc,
        skinfoldThickness: data.skinfoldThickness,
        waist: data.waist,
        hip: data.hip,
        limbs: data.limbs,
        midUpperArmCirc: data.midUpperArmCirc,
      }

      const res = await savePhilhealthSoapAction(payload)
      
      if (res.data) {
        toast.success(res.message)
        onPatchDetail({ ConsultationKonsultaData: { ...consultation.ConsultationKonsultaData, ...payload } })
      }
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>PhilHealth SOAP Mappings</CardTitle>
            <CardDescription>Structured mapping for the XML Report</CardDescription>
          </div>
          <Button type="submit" disabled={saving} size="sm">
            <Save className="w-4 h-4 mr-2" />
            {saving ? "Saving..." : "Save Mappings"}
          </Button>
        </CardHeader>
        <CardContent className="space-y-6">
          
          <div className="space-y-4 border p-4 rounded-md">
            <h3 className="font-medium">Subjective Findings</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Illness History</Label>
                <Textarea {...register("illnessHistory")} placeholder="Enter illness history..." />
              </div>
              <div className="space-y-2">
                <Label>Signs & Symptoms</Label>
                <Textarea {...register("signsSymptoms")} placeholder="Delimit multiple with semicolon (;)" />
              </div>
              <div className="space-y-2">
                <Label>Other Complaints</Label>
                <Textarea {...register("otherComplaint")} placeholder="Enter other complaints..." />
              </div>
              <div className="space-y-2">
                <Label>Pain Site</Label>
                <Textarea {...register("painSite")} placeholder="Enter pain site..." />
              </div>
            </div>
          </div>

          <div className="space-y-4 border p-4 rounded-md">
            <h3 className="font-medium">Physical Exam & Vitals (PEPERT)</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-1"><Label>Systolic (mmHg)</Label><Input type="number" step="any" {...register("systolic")} /></div>
              <div className="space-y-1"><Label>Diastolic (mmHg)</Label><Input type="number" step="any" {...register("diastolic")} /></div>
              <div className="space-y-1"><Label>Heart Rate (bpm)</Label><Input type="number" step="any" {...register("hr")} /></div>
              <div className="space-y-1"><Label>Resp. Rate (cpm)</Label><Input type="number" step="any" {...register("rr")} /></div>
              
              <div className="space-y-1"><Label>Temperature (°C)</Label><Input type="number" step="any" {...register("temp")} /></div>
              <div className="space-y-1"><Label>Height (cm)</Label><Input type="number" step="any" {...register("height")} /></div>
              <div className="space-y-1"><Label>Weight (kg)</Label><Input type="number" step="any" {...register("weight")} /></div>
              <div className="space-y-1"><Label>BMI</Label><Input type="number" step="any" {...register("bmi")} /></div>

              <div className="space-y-1"><Label>Z-Score</Label><Input {...register("zScore")} /></div>
              <div className="space-y-1"><Label>Left Vision</Label><Input {...register("leftVision")} /></div>
              <div className="space-y-1"><Label>Right Vision</Label><Input {...register("rightVision")} /></div>
              <div className="space-y-1"><Label>Length</Label><Input {...register("length")} /></div>

              <div className="space-y-1"><Label>Head Circumference</Label><Input {...register("headCirc")} /></div>
              <div className="space-y-1"><Label>Skinfold Thickness</Label><Input {...register("skinfoldThickness")} /></div>
              <div className="space-y-1"><Label>Waist (cm)</Label><Input {...register("waist")} /></div>
              <div className="space-y-1"><Label>Hip (cm)</Label><Input {...register("hip")} /></div>
              
              <div className="space-y-1"><Label>Limbs</Label><Input {...register("limbs")} /></div>
              <div className="space-y-1"><Label>Mid-Upper Arm Circ.</Label><Input {...register("midUpperArmCirc")} /></div>
            </div>
          </div>

        </CardContent>
      </Card>
    </form>
  )
}
