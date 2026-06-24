"use client"

import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import { Trash2, Plus } from "lucide-react"
import { 
  getManagementActionsAction, 
  getInterventionsAction, 
  saveInterventionAction, 
  deleteInterventionAction 
} from "@/actions/konsulta/management.action"

export default function ConsultationManagementPlan({ clinicUid, consultation, onPatchDetail }: any) {
  const [actions, setActions] = useState<any[]>([])
  const [interventions, setInterventions] = useState<any[]>([])
  const [isAdding, setIsAdding] = useState(false)
  const [loading, setLoading] = useState(true)

  const { register, handleSubmit, reset, watch, setValue } = useForm()
  const selectedAction = watch("actionId")

  useEffect(() => {
    loadData()
  }, [consultation.id])

  async function loadData() {
    setLoading(true)
    try {
      const [actRes, intRes] = await Promise.all([
        getManagementActionsAction(),
        getInterventionsAction(consultation.id)
      ])
      if (actRes.data) setActions(actRes.data)
      if (intRes.data) setInterventions(intRes.data)
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setLoading(false)
    }
  }

  const onSubmit = async (data: any) => {
    try {
      const res = await saveInterventionAction({
        clinicId: consultation.clinicId,
        hpId: consultation.hpId || consultation.ConsultationTicketHPs?.[0]?.hpId || 1, // Fallback to a valid hpId if needed
        consultationTicketId: consultation.id,
        actionId: parseInt(data.actionId),
        details: data.details || "",
        othRemarks: data.othRemarks
      })

      if (res.data) {
        toast.success(res.message)
        setInterventions([res.data, ...interventions])
        setIsAdding(false)
        reset()
      }
    } catch (e: any) {
      toast.error(e.message)
    }
  }

  const handleDelete = async (id: number) => {
    try {
      await deleteInterventionAction(id)
      setInterventions(interventions.filter(i => i.id !== id))
      toast.success("Plan removed")
    } catch (e: any) {
      toast.error(e.message)
    }
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Management Plan</CardTitle>
            <CardDescription>Document the management plan and advice given</CardDescription>
          </div>
          {!isAdding && (
            <Button onClick={() => setIsAdding(true)} size="sm">
              <Plus className="w-4 h-4 mr-2" />
              Add Plan
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading...</p>
          ) : isAdding ? (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 border p-4 rounded-md">
              <div className="space-y-2">
                <Label>Management Action</Label>
                <Select value={selectedAction} onValueChange={(val) => setValue("actionId", val)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select management action" />
                  </SelectTrigger>
                  <SelectContent>
                    {actions.map(act => (
                      <SelectItem key={act.id} value={act.id.toString()}>
                        {act.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Details / Notes</Label>
                <Input {...register("details")} placeholder="Details about the management plan..." />
              </div>

              <div className="space-y-2">
                <Label>Other Remarks (for PhilHealth)</Label>
                <Input {...register("othRemarks")} placeholder="Required if action is 'Others'" />
              </div>

              <div className="flex justify-end space-x-2 mt-4 pt-4 border-t">
                <Button type="button" variant="outline" onClick={() => { setIsAdding(false); reset(); }}>
                  Cancel
                </Button>
                <Button type="submit" disabled={!selectedAction}>
                  Save Plan
                </Button>
              </div>
            </form>
          ) : (
            <div className="space-y-4">
              {interventions.length === 0 ? (
                <p className="text-sm text-muted-foreground">No management plans recorded yet.</p>
              ) : (
                <div className="grid gap-4">
                  {interventions.map(int => (
                    <div key={int.id} className="flex justify-between items-start border p-4 rounded-md">
                      <div>
                        <h4 className="font-medium">{int.Action?.name}</h4>
                        {int.details && <p className="text-sm mt-1">{int.details}</p>}
                        {int.othRemarks && <p className="text-xs text-muted-foreground mt-1">Remarks: {int.othRemarks}</p>}
                      </div>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(int.id)}>
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
