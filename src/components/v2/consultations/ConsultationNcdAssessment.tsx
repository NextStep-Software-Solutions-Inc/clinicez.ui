"use client"

import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { toast } from "sonner"
import { getNcdAssessmentAction, saveNcdAssessmentAction } from "@/actions/konsulta/ncd-assessment.action"
import { Save } from "lucide-react"

const questions = [
  { id: "q1_Yn", text: "1. Does the patient have a history of hypertension?" },
  { id: "q2_Yn", text: "2. Does the patient have a history of heart disease?" },
  { id: "q3_Yn", text: "3. Does the patient have a history of diabetes?" },
  { id: "q4_Yn", text: "4. Is there a family history of hypertension?" },
  { id: "q5_Ynx", text: "5. Is there a family history of stroke? (X for unknown)" },
  { id: "q6_Yn", text: "6. Is there a family history of heart disease?" },
  { id: "q7_Yn", text: "7. Is there a family history of diabetes mellitus?" },
  { id: "q8_Yn", text: "8. Is the patient a smoker?" },
  { id: "q9_Yn", text: "9. Does the patient consume alcohol?" },
  { id: "q10_Yn", text: "10. Does the patient consume high fat / high salt food?" },
  { id: "q11_Yn", text: "11. Does the patient consume dietary fiber?" },
  { id: "q12_Yn", text: "12. Does the patient engage in physical activity?" },
  { id: "q13_Yn", text: "13. Does the patient have altered mental status?" },
  { id: "q14_Yn", text: "14. Does the patient have difficulty of breathing?" },
  { id: "q15_Yn", text: "15. Does the patient have chest pain?" },
  { id: "q16_Yn", text: "16. Is the patient receiving medications for NCDs?" },
]

export default function ConsultationNcdAssessment({ clinicUid, consultation, onPatchDetail }: any) {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [ncdId, setNcdId] = useState<number | null>(null)

  const { register, handleSubmit, reset, watch, setValue } = useForm<any>({
    defaultValues: {
      q17_Abcde: "A"
    }
  })

  useEffect(() => {
    loadData()
  }, [consultation.id])

  async function loadData() {
    setLoading(true)
    try {
      const res = await getNcdAssessmentAction(consultation.id)
      if (res.data) {
        setNcdId(res.data.id)
        // Convert dates
        const formData = { ...res.data } as any
        if (formData.q19_Fbsdate) formData.q19_Fbsdate = new Date(formData.q19_Fbsdate).toISOString().split('T')[0]
        if (formData.q20_Choledate) formData.q20_Choledate = new Date(formData.q20_Choledate).toISOString().split('T')[0]
        if (formData.q21_Ketondate) formData.q21_Ketondate = new Date(formData.q21_Ketondate).toISOString().split('T')[0]
        if (formData.q22_Proteindate) formData.q22_Proteindate = new Date(formData.q22_Proteindate).toISOString().split('T')[0]
        reset(formData)
      }
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setLoading(false)
    }
  }

  const onSubmit = async (data: any) => {
    setSaving(true)
    try {
      // Clean dates
      const payload = { ...data }
      if (payload.q19_Fbsdate) payload.q19_Fbsdate = new Date(payload.q19_Fbsdate)
      if (payload.q20_Choledate) payload.q20_Choledate = new Date(payload.q20_Choledate)
      if (payload.q21_Ketondate) payload.q21_Ketondate = new Date(payload.q21_Ketondate)
      if (payload.q22_Proteindate) payload.q22_Proteindate = new Date(payload.q22_Proteindate)

      const res = await saveNcdAssessmentAction({
        id: ncdId,
        userId: consultation.ClinicPatient.userId,
        consultationTicketId: consultation.id,
        clinicId: consultation.clinicId,
        ...payload
      })

      if (res.data) {
        setNcdId(res.data.id)
        toast.success(res.message)
      }
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setSaving(false)
    }
  }

  const RadioYn = ({ id, x = false }: { id: string, x?: boolean }) => (
    <div className="flex space-x-4">
      <label className="flex items-center space-x-1 cursor-pointer">
        <input type="radio" value="Y" {...register(id)} className="w-4 h-4 text-primary" />
        <span className="text-sm">Yes</span>
      </label>
      <label className="flex items-center space-x-1 cursor-pointer">
        <input type="radio" value="N" {...register(id)} className="w-4 h-4 text-primary" />
        <span className="text-sm">No</span>
      </label>
      {x && (
        <label className="flex items-center space-x-1 cursor-pointer">
          <input type="radio" value="X" {...register(id)} className="w-4 h-4 text-primary" />
          <span className="text-sm">Unknown</span>
        </label>
      )}
    </div>
  )

  if (loading) return <div className="p-4 sm:p-6"><p className="text-sm text-muted-foreground">Loading...</p></div>

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>NCD Assessment Questionnaire</CardTitle>
            <CardDescription>PhilHealth Non-Communicable Disease Risk Assessment</CardDescription>
          </div>
          <Button type="submit" disabled={saving} size="sm">
            <Save className="w-4 h-4 mr-2" />
            {saving ? "Saving..." : "Save Assessment"}
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
              {questions.map((q) => (
                <div key={q.id} className="flex flex-col space-y-2 pb-2 border-b">
                  <Label className="text-sm">{q.text}</Label>
                  <RadioYn id={q.id} x={q.id === "q5_Ynx"} />
                </div>
              ))}
            </div>

            <div className="space-y-4 mt-6">
              <h3 className="font-medium text-lg">17. Risk Classification (A-E)</h3>
              <div className="flex space-x-6">
                {['A', 'B', 'C', 'D', 'E'].map(l => (
                  <label key={l} className="flex items-center space-x-1 cursor-pointer">
                    <input type="radio" value={l} {...register("q17_Abcde")} className="w-4 h-4 text-primary" />
                    <span className="text-sm font-medium">{l}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
              <div className="space-y-4 border p-4 rounded-md">
                <div className="flex justify-between items-center">
                  <Label className="font-bold">19. Fasting Blood Sugar</Label>
                  <RadioYn id="q19_Yn" />
                </div>
                {watch("q19_Yn") === "Y" && (
                  <div className="grid grid-cols-2 gap-4 mt-2">
                    <div className="space-y-1"><Label>mg/dL</Label><Input type="number" step="any" {...register("q19_Fbsmg")} /></div>
                    <div className="space-y-1"><Label>mmol/L</Label><Input type="number" step="any" {...register("q19_Fbsmmol")} /></div>
                    <div className="space-y-1 col-span-2"><Label>Date</Label><Input type="date" {...register("q19_Fbsdate")} /></div>
                  </div>
                )}
              </div>

              <div className="space-y-4 border p-4 rounded-md">
                <div className="flex justify-between items-center">
                  <Label className="font-bold">20. Total Cholesterol</Label>
                  <RadioYn id="q20_Yn" />
                </div>
                {watch("q20_Yn") === "Y" && (
                  <div className="grid grid-cols-2 gap-4 mt-2">
                    <div className="space-y-1"><Label>Value</Label><Input type="number" step="any" {...register("q20_Choleval")} /></div>
                    <div className="space-y-1"><Label>Date</Label><Input type="date" {...register("q20_Choledate")} /></div>
                  </div>
                )}
              </div>

              <div className="space-y-4 border p-4 rounded-md">
                <div className="flex justify-between items-center">
                  <Label className="font-bold">21. Urine Ketones</Label>
                  <RadioYn id="q21_Yn" />
                </div>
                {watch("q21_Yn") === "Y" && (
                  <div className="grid grid-cols-2 gap-4 mt-2">
                    <div className="space-y-1"><Label>Value</Label><Input type="number" step="any" {...register("q21_Ketonval")} /></div>
                    <div className="space-y-1"><Label>Date</Label><Input type="date" {...register("q21_Ketondate")} /></div>
                  </div>
                )}
              </div>

              <div className="space-y-4 border p-4 rounded-md">
                <div className="flex justify-between items-center">
                  <Label className="font-bold">22. Urine Protein</Label>
                  <RadioYn id="q22_Yn" />
                </div>
                {watch("q22_Yn") === "Y" && (
                  <div className="grid grid-cols-2 gap-4 mt-2">
                    <div className="space-y-1"><Label>Value</Label><Input type="number" step="any" {...register("q22_Proteinval")} /></div>
                    <div className="space-y-1"><Label>Date</Label><Input type="date" {...register("q22_Proteindate")} /></div>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-4 border p-4 rounded-md mt-4 bg-muted/30">
              <div className="flex justify-between items-center">
                <Label className="font-bold">23. Is the patient at high risk?</Label>
                <RadioYn id="q23_Yn" />
              </div>
              <div className="flex justify-between items-center">
                <Label className="font-bold">24. Is the patient newly diagnosed?</Label>
                <RadioYn id="q24_Yn" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </form>
  )
}
