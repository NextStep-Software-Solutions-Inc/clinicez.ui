'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { CheckCircle2, AlertCircle, Loader2, ShieldCheck, FileKey, Zap } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  verifyKonsultaPinAction, 
  enlistKonsultaAction, 
  generateKonsultaIdsAction,
  getKonsultaEnlistmentAction 
} from '@/actions/philhealth-yakap.actions'
import { formatPhilHealthPin } from '@/components/v2/patients/forms/schemas/mask-utils'

interface Props {
  clinicPatientId: number
  isClinicMode: boolean
  philHealthRecord?: any
}

export function PhilHealthYakapCard({ clinicPatientId, isClinicMode, philHealthRecord }: Props) {
  const params = useParams<{ clinicUid?: string }>()
  const clinicUid = params?.clinicUid

  const [isVerifying, setIsVerifying] = useState(false)
  const [isEnlisting, setIsEnlisting] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [enlistment, setEnlistment] = useState<any>(null)

  useEffect(() => {
    if (clinicPatientId) {
      getKonsultaEnlistmentAction(clinicPatientId)
        .then(data => {
          setEnlistment(data)
          setIsLoading(false)
        })
        .catch(err => {
          console.error(err)
          setIsLoading(false)
        })
    } else {
      setIsLoading(false)
    }
  }, [clinicPatientId])

  // Only clinic staff can see the Yakap Integration controls
  if (!isClinicMode || !clinicUid) {
    return null
  }

  const formatPhilHealthPIN = (val: string | null | undefined): string => {
    const res = formatPhilHealthPin(val);
    return res || 'N/A';
  }

  const memberType = philHealthRecord?.memberType || 'MM'
  const patientPin = philHealthRecord?.pin
  const principalMemberPin = philHealthRecord?.principalMemberPin

  const handleVerify = async () => {
    if (memberType === 'MM' && !patientPin) {
      toast.error("Patient profile is missing the Member PIN")
      return
    }
    if (memberType === 'DD' && (!patientPin || !principalMemberPin)) {
      toast.error("Patient profile is missing Member or Dependent PIN")
      return
    }

    setIsVerifying(true)
    try {
      const pinToVerify = memberType === 'MM' ? patientPin : principalMemberPin
      const res = await verifyKonsultaPinAction(clinicUid, pinToVerify, memberType)

      if (res.success && res.data) {
        toast.success("Successfully verified with PhilHealth Yakap API!")
      } else {
        toast.error(res.error || "Verification failed")
      }
    } catch (err: unknown) {
      toast.error("Error during verification")
      console.error(err)
    } finally {
      setIsVerifying(false)
    }
  }

  const handleEnlist = async () => {
    if (memberType === 'MM' && !patientPin) {
      toast.error("Cannot enlist without a Principal Member PIN in the patient profile.")
      return
    }
    if (memberType === 'DD') {
      if (!principalMemberPin?.trim()) {
        toast.error("Cannot enlist Dependent record without Principal Member PIN.")
        return
      }
      if (!patientPin?.trim()) {
        toast.error("Cannot enlist Dependent record without Patient PIN (Dependent PIN).")
        return
      }
      if (principalMemberPin.trim() === patientPin.trim()) {
        toast.error("Principal Member PIN and Dependent/Patient PIN cannot be the same.")
        return
      }
    }

    setIsEnlisting(true)
    try {
      const memberPinParam = memberType === 'MM' ? patientPin : principalMemberPin
      const dependentPinParam = memberType === 'DD' ? patientPin : undefined
      const res = await enlistKonsultaAction(clinicUid, clinicPatientId, memberPinParam, dependentPinParam)

      if (res.success && res.enlistment) {
        toast.success("Successfully enlisted in Yakap!")
        setEnlistment(res.enlistment)
      } else {
        toast.error(res.error || "Enlistment failed")
      }
    } catch (err: unknown) {
      toast.error("Error during enlistment")
      console.error(err)
    } finally {
      setIsEnlisting(false)
    }
  }

  const handleGenerateId = async (type: 'CASE' | 'PROFILING') => {
    if (!enlistment || !clinicUid) return
    
    setIsGenerating(true)
    try {
      const res = await generateKonsultaIdsAction(clinicUid, enlistment.id, type)
      if (res.success && res.data) {
        toast.success(`Successfully generated ${type} Number!`)
        setEnlistment({
          ...enlistment,
          hciCaseNo: res.data.hciCaseNo,
          profilingTransNo: res.data.profilingTransNo
        })
      } else {
        toast.error(res.error || `Failed to generate ${type} Number`)
      }
    } catch (err: unknown) {
      toast.error(`Error generating ${type} Number`)
      console.error(err)
    } finally {
      setIsGenerating(false)
    }
  }

  if (isLoading) {
    return (
      <div className="p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white/70 dark:bg-slate-900/60 flex justify-center items-center">
        <Loader2 className="w-5 h-5 animate-spin text-teal-600" />
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-teal-50 dark:bg-teal-950/50 text-teal-600 dark:text-teal-400">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              PHILHEALTH YAKAP API INTEGRATION & CASE GENERATOR
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Real-time API verification, Konsulta enlistment, and transaction numbers
            </p>
          </div>
        </div>

        <div>
          {isLoading ? (
            <Badge variant="outline" className="text-xs font-medium py-1 px-2.5">
              <Loader2 className="w-3 h-3 animate-spin mr-1" /> Checking...
            </Badge>
          ) : enlistment ? (
            <Badge className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800 text-xs font-semibold py-1 px-2.5 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" /> ENLISTED ({enlistment.year})
            </Badge>
          ) : (
            <Badge variant="secondary" className="text-amber-700 bg-amber-50 dark:bg-amber-950/50 dark:text-amber-300 border-amber-200 dark:border-amber-800 text-xs font-semibold py-1 px-2.5">
              PENDING ENLISTMENT
            </Badge>
          )}
        </div>
      </div>

      {/* Details Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
        <div className="space-y-1">
          <label className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
            Member Type
          </label>
          <div className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
            {memberType === 'MM' ? 'Formal Member (MM)' : 'Dependent (DD)'}
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
            {memberType === 'DD' ? 'Patient PIN (Dependent PIN)' : 'Patient PIN'}
          </label>
          <div className="text-xs font-semibold font-mono text-slate-800 dark:text-slate-200 truncate">
            {formatPhilHealthPIN(patientPin)}
          </div>
        </div>

        {memberType === 'DD' && (
          <div className="space-y-1">
            <label className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
              Principal Member PIN
            </label>
            <div className="text-xs font-semibold font-mono text-slate-800 dark:text-slate-200 truncate">
              {formatPhilHealthPIN(principalMemberPin)}
            </div>
          </div>
        )}

        <div className="space-y-1">
          <label className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
            Enlistment Trans No
          </label>
          <div className="text-xs font-semibold font-mono text-indigo-600 dark:text-indigo-400 truncate">
            {enlistment?.enlistmentTransNo || '—'}
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
            HCI Case No
          </label>
          <div className="text-xs font-semibold font-mono text-indigo-600 dark:text-indigo-400 truncate">
            {enlistment?.hciCaseNo || '—'}
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
            Profiling Trans No
          </label>
          <div className="text-xs font-semibold font-mono text-indigo-600 dark:text-indigo-400 truncate">
            {enlistment?.profilingTransNo || '—'}
          </div>
        </div>
      </div>

      {/* Action Toolbar */}
      <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
        {!patientPin ? (
          <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 text-xs font-medium bg-amber-50 dark:bg-amber-950/20 px-3 py-2 rounded-lg border border-amber-200/60 dark:border-amber-900/30 w-full sm:w-auto">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>Update PhilHealth PIN in record above to enable Yakap API integration.</span>
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-2">
            {!enlistment && (
              <>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleVerify} 
                  disabled={isVerifying || isEnlisting} 
                  className="h-8 text-xs font-semibold text-teal-600 border-teal-600/40 hover:bg-teal-50 dark:hover:bg-teal-950/20"
                >
                  {isVerifying && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
                  <ShieldCheck className="w-3.5 h-3.5 mr-1.5" />
                  Verify PINs
                </Button>
                
                <Button 
                  size="sm"
                  onClick={handleEnlist} 
                  disabled={isEnlisting || isVerifying} 
                  className="h-8 text-xs font-semibold bg-teal-600 hover:bg-teal-700 text-white shadow-sm"
                >
                  {isEnlisting && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
                  <Zap className="w-3.5 h-3.5 mr-1.5" />
                  Enlist to Yakap
                </Button>
              </>
            )}

            {enlistment && !enlistment.profilingTransNo && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => handleGenerateId('PROFILING')}
                disabled={isGenerating}
                className="h-8 text-xs font-semibold text-indigo-600 border-indigo-500/40 hover:bg-indigo-50 dark:hover:bg-indigo-950/20"
              >
                {isGenerating && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
                <FileKey className="w-3.5 h-3.5 mr-1.5" />
                Generate Profiling Trans No
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
