'use client'

import React, { useState, useMemo, useEffect, useRef } from 'react'
import { createUserVaccinationAction, deleteUserVaccinationAction } from '@/actions/users/user-vaccination.action'
import { getVaccinesAction, getRoutesAction, getDosesAction } from '@/actions/vaccines/get-vaccines.action'
import { FormModal, FormField, EditButton } from './index'
import { VaccineCombobox } from './VaccineCombobox'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { getActionErrorMessage } from '@/lib/action-error'
import { Trash2, Plus, Calendar } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'

export interface VaccinationFormData {
  id: number
  vaccine: string
  dose: string
  route: string
  dateGiven: string
  notes: string | null
  administeredBy: string | null
}

export interface VaccinationEditFormProps {
  userId: string
  currentVaccinations?: VaccinationFormData[]
  onSuccess?: () => void
  inline?: boolean
}

interface VaccineOption {
  id: number
  name: string
  type: string
  description: string | null
}

interface DoseOption {
  id: number
  dose: string
  description: string | null
}

interface RouteOption {
  id: number
  route: string
  description: string | null
}

/**
 * VaccinationEditForm - Manage user vaccinations
 * Allows viewing, adding, and removing vaccinations
 */
export function VaccinationEditForm({
  userId,
  currentVaccinations = [],
  onSuccess,
  inline = false,
}: VaccinationEditFormProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [vaccinations, setVaccinations] = useState<VaccinationFormData[]>(currentVaccinations)
  const [newVaccination, setNewVaccination] = useState<{
    vaccineName?: string
    vaccineId?: number
    doseId?: number
    routeId?: number
    dateGiven?: string
    notes?: string
    administeredBy?: string
  }>({})
  
  const [vaccines, setVaccines] = useState<VaccineOption[]>([])
  const [doses, setDoses] = useState<DoseOption[]>([])
  const [routes, setRoutes] = useState<RouteOption[]>([])
  const hasInitializedRef = useRef(false)

  // Load vaccines, doses, and routes on component mount
  useEffect(() => {
    const loadOptions = async () => {
      try {
        const [vaccinesResult, dosesResult, routesResult] = await Promise.all([
          getVaccinesAction(),
          getDosesAction(),
          getRoutesAction(),
        ])

        if (vaccinesResult.success) {
          setVaccines(vaccinesResult.data)
        }
        if (dosesResult.success) {
          setDoses(dosesResult.data)
        }
        if (routesResult.success) {
          setRoutes(routesResult.data)
        }
      } catch (error) {
        console.error('Failed to load vaccine options:', error)
        toast.error(getActionErrorMessage(error, 'Failed to load vaccine options'))
      }
    }

    loadOptions()
  }, [])

  // Prepopulate vaccinations on mount
  useEffect(() => {
    if (hasInitializedRef.current) return
    if (currentVaccinations && currentVaccinations.length > 0) {
      setVaccinations(currentVaccinations)
      hasInitializedRef.current = true
    }
  }, [currentVaccinations])

  // Track if form has unsaved changes
  const hasChanges = useMemo(() => {
    return JSON.stringify(vaccinations) !== JSON.stringify(currentVaccinations || [])
  }, [vaccinations, currentVaccinations])

  const handleAddVaccination = async () => {
    try {
      if (!newVaccination.vaccineId || !newVaccination.doseId || !newVaccination.routeId || !newVaccination.dateGiven) {
        toast.error('Please fill in all required fields')
        return
      }

      // validation
      const dateGiven = new Date(newVaccination.dateGiven)
      if (isNaN(dateGiven.getTime())) {
        toast.error('Invalid date format')
        return
      }

      setIsLoading(true)
      
      const result = await createUserVaccinationAction({
        userId,
        vaccineId: newVaccination.vaccineId,
        doseId: newVaccination.doseId,
        routeId: newVaccination.routeId,
        dateGiven,
        administeredBy: newVaccination.administeredBy || 'Not specified',
      })

      if (result) {
        toast.success('Vaccination added successfully')
        setVaccinations([
          ...vaccinations,
          {
            id: result.id,
            vaccine: newVaccination.vaccineName || 'Unknown',
            dose: doses.find((d) => d.id === newVaccination.doseId)?.dose || 'Unknown',
            route: routes.find((r) => r.id === newVaccination.routeId)?.route || 'Unknown',
            dateGiven: newVaccination.dateGiven,
            notes: newVaccination.notes || null,
            administeredBy: newVaccination.administeredBy || null,
          },
        ])
        setNewVaccination({})
        onSuccess?.()
      }
    } catch (err) {
      toast.error(getActionErrorMessage(err, 'Failed to add vaccination'))
    } finally {
      setIsLoading(false)
    }
  }

  const handleRemoveVaccination = async (index: number) => {
    const vaccinationToDelete = vaccinations[index]

    if (!vaccinationToDelete?.id) {
      toast.error('Cannot delete vaccination: missing ID')
      return
    }

    try {
      setIsLoading(true)
      await deleteUserVaccinationAction(vaccinationToDelete.id)

      toast.success('Vaccination removed successfully')
      setVaccinations((prev) => prev.filter((_, i) => i !== index))
      onSuccess?.()
    } catch (err) {
      toast.error(getActionErrorMessage(err, 'Failed to remove vaccination'))
    } finally {
      setIsLoading(false)
    }
  }

  const formContent = (
    <div className="space-y-6">
      <div className="space-y-4">
        <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <span className="w-1 h-6 bg-gradient-to-b from-blue-500 to-cyan-500 rounded-full"></span>
          Add New Vaccination
        </h3>

        <FormField label="Vaccine" required htmlFor="vaccine">
          <VaccineCombobox
            value={newVaccination.vaccineName || ''}
            onChange={(vaccineName) => {
              const vaccine = vaccines.find((v) => v.name === vaccineName)
              setNewVaccination((prev) => ({
                ...prev,
                vaccineName,
                vaccineId: vaccine?.id,
              }))
            }}
            vaccines={vaccines}
            placeholder="Search vaccine..."
          />
        </FormField>

        <FormField label="Dose" required htmlFor="dose">
          <Select 
            value={newVaccination.doseId?.toString() || ''} 
            onValueChange={(value) => setNewVaccination((prev) => ({ ...prev, doseId: parseInt(value) }))}
          >
            <SelectTrigger id="dose">
              <SelectValue placeholder="Select dose..." />
            </SelectTrigger>
            <SelectContent>
              {doses.map((dose) => (
                <SelectItem key={dose.id} value={dose.id.toString()}>
                  {dose.dose}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormField>

        <FormField label="Route" required htmlFor="route">
          <Select 
            value={newVaccination.routeId?.toString() || ''} 
            onValueChange={(value) => setNewVaccination((prev) => ({ ...prev, routeId: parseInt(value) }))}
          >
            <SelectTrigger id="route">
              <SelectValue placeholder="Select route..." />
            </SelectTrigger>
            <SelectContent>
              {routes.map((route) => (
                <SelectItem key={route.id} value={route.id.toString()}>
                  {route.route}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormField>

        <FormField label="Date Given" required htmlFor="dateGiven">
          <Input
            id="dateGiven"
            type="date"
            value={newVaccination.dateGiven || ''}
            onChange={(e) => setNewVaccination((prev) => ({ ...prev, dateGiven: e.target.value }))}
          />
        </FormField>

        <FormField label="Administered By" htmlFor="administeredBy">
          <Input
            id="administeredBy"
            value={newVaccination.administeredBy || ''}
            onChange={(e) => setNewVaccination((prev) => ({ ...prev, administeredBy: e.target.value }))}
            placeholder="Name of healthcare provider (optional)"
          />
        </FormField>

        <FormField label="Notes" htmlFor="notes">
          <Textarea
            id="notes"
            value={newVaccination.notes || ''}
            onChange={(e) => setNewVaccination((prev) => ({ ...prev, notes: e.target.value }))}
            placeholder="Additional notes or observations (optional)"
            className="min-h-20"
          />
        </FormField>

        <Button
          onClick={() => void handleAddVaccination()}
          disabled={isLoading || !newVaccination.vaccineId || !newVaccination.doseId || !newVaccination.routeId || !newVaccination.dateGiven}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Vaccination
        </Button>
      </div>

      {/* Current Vaccinations List */}
      {vaccinations.length > 0 && (
        <div className="border-t border-slate-200 dark:border-slate-700 pt-6">
          <h3 className="text-base font-bold text-slate-900 dark:text-white mb-4">
            Vaccination History ({vaccinations.length})
          </h3>
          <div className="space-y-3">
            {vaccinations.map((vaccination, index) => (
              <div
                key={index}
                className="p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg"
              >
                <div className="flex justify-between items-start gap-3">
                  <div className="flex-1">
                    <p className="font-semibold text-blue-900 dark:text-blue-200">
                      {vaccination.vaccine}
                    </p>
                    <div className="text-sm text-blue-700 dark:text-blue-300 mt-2 space-y-1">
                      <p>
                        <span className="font-medium">Dose:</span> {vaccination.dose}
                      </p>
                      <p>
                        <span className="font-medium">Route:</span> {vaccination.route}
                      </p>
                      <p className="flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5" />
                        <span className="font-medium">
                          {new Date(vaccination.dateGiven).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          })}
                        </span>
                      </p>
                      {vaccination.administeredBy && (
                        <p>
                          <span className="font-medium">By:</span> {vaccination.administeredBy}
                        </p>
                      )}
                    </div>
                    {vaccination.notes && (
                      <p className="text-xs text-blue-600 dark:text-blue-400 mt-2 italic">
                        Note: {vaccination.notes}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => void handleRemoveVaccination(index)}
                    disabled={isLoading}
                    className="p-2 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-lg transition-colors text-blue-600 dark:text-blue-400 disabled:opacity-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )

  if (inline) {
    return formContent
  }

  return (
    <>
      <EditButton onClick={() => setIsOpen(true)} label="Manage Vaccinations" />

      <FormModal
        isOpen={isOpen}
        title="Vaccination & Immunization Records"
        description="Keep track of your vaccination history for medical reference"
        onClose={() => setIsOpen(false)}
        onSubmit={async () => setIsOpen(false)}
        isLoading={isLoading}
        submitLabel="All Set"
        submitDisabled={false}
      >
        {formContent}
      </FormModal>
    </>
  )
}
