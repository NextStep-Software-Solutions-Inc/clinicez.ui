"use client"

import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import { DiagnosticResultFields } from "./diagnostic-fields"
import {
  getDiagnosticCategoriesAction,
  getDiagnosticResultsAction,
  saveDiagnosticResultAction,
  deleteDiagnosticResultAction
} from "@/actions/konsulta/diagnostics.action"
import { Trash2, Plus, CalendarIcon } from "lucide-react"

export default function ConsultationDiagnosticResults({ clinicUid, consultation, onPatchDetail }: any) {
  const [categories, setCategories] = useState<any[]>([])
  const [results, setResults] = useState<any[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string>("")
  const [isAdding, setIsAdding] = useState(false)
  const [loading, setLoading] = useState(true)

  const { register, handleSubmit, reset, watch, setValue } = useForm()

  useEffect(() => {
    loadData()
  }, [consultation.id])

  async function loadData() {
    setLoading(true)
    try {
      const [catRes, resRes] = await Promise.all([
        getDiagnosticCategoriesAction(),
        getDiagnosticResultsAction(consultation.id)
      ])
      if (catRes.data) setCategories(catRes.data)
      if (resRes.data) setResults(resRes.data)
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setLoading(false)
    }
  }

  const categoryOptions = categories.filter(c => Object.keys(DiagnosticResultFields).includes(c.code))
  const selectedCategoryData = categories.find(c => c.id.toString() === selectedCategory)
  const fieldsToRender = selectedCategoryData ? DiagnosticResultFields[selectedCategoryData.code] : []

  const onSubmit = async (data: any) => {
    if (!selectedCategoryData) return

    const { referralFacility, labDate, diagnosticLabFee, ...dynamicResults } = data

    try {
      const res = await saveDiagnosticResultAction({
        userId: consultation.ClinicPatient.userId,
        consultationTicketId: consultation.id,
        clinicId: consultation.clinicId,
        categoryId: selectedCategoryData.id,
        referralFacility,
        labDate: labDate ? new Date(labDate) : undefined,
        diagnosticLabFee: diagnosticLabFee ? parseFloat(diagnosticLabFee) : undefined,
        results: dynamicResults
      })

      if (res.data) {
        toast.success("Diagnostic result saved")
        setResults([res.data, ...results])
        setIsAdding(false)
        reset()
        setSelectedCategory("")
      }
    } catch (e: any) {
      toast.error(e.message)
    }
  }

  const handleDelete = async (id: number) => {
    try {
      await deleteDiagnosticResultAction(id)
      setResults(results.filter(r => r.id !== id))
      toast.success("Result deleted")
    } catch (e: any) {
      toast.error(e.message)
    }
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Diagnostic Results</CardTitle>
            <CardDescription>Enter results for requested diagnostic procedures</CardDescription>
          </div>
          {!isAdding && (
            <Button onClick={() => setIsAdding(true)} size="sm">
              <Plus className="w-4 h-4 mr-2" />
              Add Result
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading...</p>
          ) : isAdding ? (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 border p-4 rounded-md">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Diagnostic Category</Label>
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select diagnostic test" />
                    </SelectTrigger>
                    <SelectContent>
                      {categoryOptions.map(cat => (
                        <SelectItem key={cat.id} value={cat.id.toString()}>
                          {cat.name} ({cat.code})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {selectedCategoryData && (
                  <>
                    <div className="space-y-2">
                      <Label>Referral Facility</Label>
                      <Input {...register("referralFacility")} placeholder="Enter if referred out" />
                    </div>
                    <div className="space-y-2">
                      <Label>Lab Date</Label>
                      <Input type="date" {...register("labDate")} />
                    </div>
                    <div className="space-y-2">
                      <Label>Lab Fee (₱)</Label>
                      <Input type="number" step="0.01" {...register("diagnosticLabFee")} />
                    </div>
                  </>
                )}
              </div>

              {selectedCategoryData && fieldsToRender && fieldsToRender.length > 0 && (
                <div className="mt-6 border-t pt-4">
                  <h4 className="font-medium mb-4">Test Results</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {fieldsToRender.map(field => (
                      <div key={field.key} className="space-y-2">
                        <Label>{field.label}</Label>
                        <Input 
                          type={field.type === 'date' ? 'date' : field.type === 'number' ? 'number' : 'text'} 
                          {...register(field.key)} 
                          step={field.type === 'number' ? 'any' : undefined}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-end space-x-2 mt-4 pt-4 border-t">
                <Button type="button" variant="outline" onClick={() => { setIsAdding(false); reset(); setSelectedCategory(""); }}>
                  Cancel
                </Button>
                <Button type="submit" disabled={!selectedCategory}>
                  Save Result
                </Button>
              </div>
            </form>
          ) : (
            <div className="space-y-4">
              {results.length === 0 ? (
                <p className="text-sm text-muted-foreground">No diagnostic results recorded yet.</p>
              ) : (
                <div className="grid gap-4">
                  {results.map(res => (
                    <div key={res.id} className="flex justify-between items-start border p-4 rounded-md">
                      <div>
                        <h4 className="font-medium">{res.Category?.name}</h4>
                        <p className="text-xs text-muted-foreground mb-2">
                          {res.labDate ? new Date(res.labDate).toLocaleDateString() : "No date"} 
                          {res.referralFacility && ` • ${res.referralFacility}`}
                        </p>
                        <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2">
                          {Object.entries(res.results || {}).map(([key, val]) => {
                            if (!val) return null;
                            const fieldDef = DiagnosticResultFields[res.Category?.code]?.find(f => f.key === key);
                            return (
                              <div key={key} className="text-sm">
                                <span className="text-muted-foreground mr-1">{fieldDef?.label || key}:</span>
                                <span className="font-medium">{String(val)}</span>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(res.id)}>
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
