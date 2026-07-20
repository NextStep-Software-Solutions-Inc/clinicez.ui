'use client'

import React, { useState, useEffect } from 'react'
import { createUserVaccinationAction, deleteUserVaccinationAction } from '@/actions/users/user-vaccination.action'
import { getVaccinesAction, getRoutesAction, getDosesAction } from '@/actions/vaccines/get-vaccines.action'
import { getActionErrorMessage } from '@/lib/action-error'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Trash2, Plus, X, Syringe } from 'lucide-react'
import { toast } from 'sonner'

export interface VaccinationsInlineFormProps {
  userId: string
  vaccinations: any[]
  onSuccess?: () => void
}

export function VaccinationsInlineForm({
  userId,
  vaccinations,
  onSuccess,
}: VaccinationsInlineFormProps) {
  const [isAdding, setIsAdding] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  // Options
  const [vaccinesList, setVaccinesList] = useState<any[]>([])
  const [routesList, setRoutesList] = useState<any[]>([])
  const [dosesList, setDosesList] = useState<any[]>([])

  // Form Field
  const [newVac, setNewVac] = useState<any>({
    vaccineId: '',
    vaccineName: '',
    doseId: '',
    routeId: '',
    dateGiven: '',
    administeredBy: '',
  })

  // Load choices
  useEffect(() => {
    async function loadOptions() {
      try {
        const [vacs, routes, doses] = await Promise.all([
          getVaccinesAction(),
          getRoutesAction(),
          getDosesAction(),
        ])
        if (vacs.success && vacs.data) setVaccinesList(vacs.data)
        if (routes.success && routes.data) setRoutesList(routes.data)
        if (doses.success && doses.data) setDosesList(doses.data)
      } catch (err) {
        console.error('Failed to load options:', err)
      }
    }
    loadOptions()
  }, [])

  const handleFieldChange = (field: string, value: any) => {
    setNewVac((prev: any) => {
      const next = { ...prev, [field]: value }
      if (field === 'vaccineId') {
        const found = vaccinesList.find((v) => v.id === Number(value))
        next.vaccineName = found ? found.name : ''
      }
      return next
    })
  }

  const handleAdd = async () => {
    if (!newVac.vaccineId || !newVac.doseId || !newVac.routeId || !newVac.dateGiven) {
      toast.error('Vaccine, Dose, Route, and Date Given are required.')
      return
    }

    setIsLoading(true)
    try {
      const result = await createUserVaccinationAction({
        userId,
        vaccineId: Number(newVac.vaccineId),
        doseId: Number(newVac.doseId),
        routeId: Number(newVac.routeId),
        dateGiven: new Date(newVac.dateGiven),
        administeredBy: newVac.administeredBy || 'Not specified',
      })

      if (result) {
        toast.success('Vaccination recorded successfully')
        setIsAdding(false)
        setNewVac({
          vaccineId: '',
          vaccineName: '',
          doseId: '',
          routeId: '',
          dateGiven: '',
          administeredBy: '',
        })
        onSuccess?.()
      }
    } catch (err) {
      toast.error(getActionErrorMessage(err, 'Failed to add vaccination'))
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async (vacId: number) => {
    if (!confirm('Are you sure you want to remove this vaccination?')) return

    setIsLoading(true)
    try {
      await deleteUserVaccinationAction(vacId)
      toast.success('Vaccination record removed successfully')
      onSuccess?.()
    } catch (err) {
      toast.error(getActionErrorMessage(err, 'Failed to remove vaccination'))
    } finally {
      setIsLoading(false)
    }
  }

  const renderField = (label: string, control: React.ReactNode) => {
    return (
      <div className="space-y-1">
        <span className="text-xs font-semibold text-slate-500">{label}</span>
        <div className="w-full">{control}</div>
      </div>
    )
  }

  return (
    <div className="space-y-4 py-2">
      <div className="flex justify-end">
        {!isAdding && (
          <Button
            type="button"
            onClick={() => setIsAdding(true)}
            size="sm"
            className="text-xs flex items-center gap-1.5 h-8 bg-teal-650 hover:bg-teal-700 text-white"
            disabled={isLoading}
          >
            <Plus className="w-3.5 h-3.5" />
            Add Vaccination
          </Button>
        )}
      </div>

      {isAdding && (
        <div className="p-4 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/10 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-650 dark:text-slate-400 uppercase tracking-wider">
              Add New Vaccination
            </span>
            <button type="button" onClick={() => setIsAdding(false)} className="text-slate-400 hover:text-slate-600">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs">
            {renderField(
              'Vaccine Name *',
              <Select
                value={String(newVac.vaccineId)}
                onValueChange={(val) => handleFieldChange('vaccineId', val)}
              >
                <SelectTrigger className="h-8 text-xs focus:ring-teal-500">
                  <SelectValue placeholder="Select Vaccine" />
                </SelectTrigger>
                <SelectContent>
                  {vaccinesList.map((v) => (
                    <SelectItem key={v.id} value={String(v.id)}>
                      {v.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {renderField(
              'Dose *',
              <Select
                value={String(newVac.doseId)}
                onValueChange={(val) => handleFieldChange('doseId', val)}
              >
                <SelectTrigger className="h-8 text-xs focus:ring-teal-500">
                  <SelectValue placeholder="Select Dose" />
                </SelectTrigger>
                <SelectContent>
                  {dosesList.map((d) => (
                    <SelectItem key={d.id} value={String(d.id)}>
                      {d.dose}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {renderField(
              'Route *',
              <Select
                value={String(newVac.routeId)}
                onValueChange={(val) => handleFieldChange('routeId', val)}
              >
                <SelectTrigger className="h-8 text-xs focus:ring-teal-500">
                  <SelectValue placeholder="Select Route" />
                </SelectTrigger>
                <SelectContent>
                  {routesList.map((r) => (
                    <SelectItem key={r.id} value={String(r.id)}>
                      {r.route}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {renderField(
              'Date Given *',
              <Input
                type="date"
                value={newVac.dateGiven}
                onChange={(e) => handleFieldChange('dateGiven', e.target.value)}
                className="h-8 text-xs focus-visible:ring-teal-500"
              />
            )}

            <div className="sm:col-span-2">
              {renderField(
                'Administered By',
                <Input
                  value={newVac.administeredBy}
                  onChange={(e) => handleFieldChange('administeredBy', e.target.value)}
                  className="h-8 text-xs focus-visible:ring-teal-500"
                  placeholder="e.g. Dr. Santos"
                />
              )}
            </div>
          </div>

          <div className="flex gap-2 justify-end pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 text-xs"
              onClick={() => setIsAdding(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              className="h-8 text-xs bg-teal-650 hover:bg-teal-700 text-white"
              onClick={handleAdd}
              disabled={isLoading}
            >
              Save Vaccination
            </Button>
          </div>
        </div>
      )}

      {vaccinations.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {vaccinations.map((vac, idx) => (
            <div
              key={vac.id || idx}
              className="p-4 rounded-xl border border-teal-100 dark:border-teal-950/20 bg-teal-50/10 dark:bg-teal-950/5 shadow-sm flex justify-between items-start"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-1.5">
                  <Syringe className="w-4 h-4 text-teal-500" />
                  <h4 className="font-bold text-sm text-slate-800 dark:text-slate-200">
                    {vac.vaccine}
                  </h4>
                </div>
                <p className="text-xs font-semibold text-slate-700 dark:text-slate-350">
                  Dose: <span className="text-slate-900 dark:text-white font-bold">{vac.dose}</span> ({vac.route})
                </p>
                <p className="text-xs text-slate-650 dark:text-slate-400 font-semibold">
                  Date Given: <span className="text-slate-900 dark:text-white font-bold">{vac.dateGiven ? new Date(vac.dateGiven).toLocaleDateString(undefined, { dateStyle: 'medium' }) : '—'}</span>
                </p>
                {vac.administeredBy && (
                  <p className="text-xs text-slate-500 leading-snug">
                    Administered By: {vac.administeredBy}
                  </p>
                )}
              </div>

              <button
                type="button"
                onClick={() => handleDelete(vac.id)}
                className="p-1 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/20 dark:hover:text-red-400 rounded transition-colors text-slate-400"
                disabled={isLoading}
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-6 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-900/5">
          <span className="text-xs text-slate-400 dark:text-slate-500 font-semibold">
            No vaccination history logged.
          </span>
        </div>
      )}
    </div>
  )
}
