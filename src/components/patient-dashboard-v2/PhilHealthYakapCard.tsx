'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { CheckCircle, AlertCircle, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { 
  verifyKonsultaPinAction, 
  enlistKonsultaAction, 
  generateKonsultaIdsAction,
  getKonsultaEnlistmentAction 
} from '@/actions/philhealth-yakap.actions'

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

  const formatPhilHealthPIN = (val: string | null | undefined) => {
    if (!val) return 'N/A'
    const digits = val.replace(/\D/g, '').substring(0, 12);
    let formatted = '';
    if (digits.length > 0) {
      formatted = digits.substring(0, 2);
    }
    if (digits.length > 2) {
      formatted += '-' + digits.substring(2, 11);
    }
    if (digits.length > 11) {
      formatted += '-' + digits.substring(11, 12);
    }
    return formatted || 'N/A';
  }

  const memberType = philHealthRecord?.memberType || 'MM'
  const memberPin = philHealthRecord?.pin
  const dependentPin = philHealthRecord?.dependentPin

  const handleVerify = async () => {
    if (memberType === 'MM' && !memberPin) {
      toast.error("Patient profile is missing the Member PIN")
      return
    }
    if (memberType === 'DD' && (!memberPin || !dependentPin)) {
      toast.error("Patient profile is missing Member or Dependent PIN")
      return
    }

    setIsVerifying(true)
    try {
      const pinToVerify = memberType === 'MM' ? memberPin : dependentPin
      const res = await verifyKonsultaPinAction(clinicUid, pinToVerify, memberType)

      if (res.success && res.data) {
        // Just verify, don't enlist yet
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
    if (!memberPin) {
      toast.error("Cannot enlist without a Member PIN in the patient profile.")
      return
    }

    setIsEnlisting(true)
    try {
      const res = await enlistKonsultaAction(clinicUid, clinicPatientId, memberPin, dependentPin)

      if (res.success && res.enlistment) {
        toast.success("Successfully enlisted in PhilHealth Konsulta!")
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
      <div className="glassmorphic-card p-6 border-2 border-teal-500/20 flex justify-center items-center">
        <Loader2 className="w-6 h-6 animate-spin text-teal-600" />
      </div>
    )
  }

  return (
    <div className="glassmorphic-card p-6 border-2 border-teal-500/20">
      <div className="flex items-center gap-2 mb-6">
        <CheckCircle className="w-5 h-5 text-teal-600" />
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white">PhilHealth Konsulta Integration</h3>
      </div>

      <div className="space-y-6">
        {/* Verification Display */}
        <div className="space-y-4 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <Label className="text-slate-500">Member Type</Label>
              <p className="font-medium text-slate-900 dark:text-white">
                {memberType === 'DD' ? 'Dependent' : 'Principal Member'}
              </p>
            </div>
            <div>
              <Label className="text-slate-500">Member PIN {memberType === 'DD' && '(Principal)'}</Label>
              <p className="font-mono font-medium text-slate-900 dark:text-white">
                {formatPhilHealthPIN(memberPin)}
              </p>
            </div>
            {memberType === 'DD' && (
              <div>
                <Label className="text-slate-500">Dependent PIN</Label>
                <p className="font-mono font-medium text-slate-900 dark:text-white">
                  {formatPhilHealthPIN(dependentPin)}
                </p>
              </div>
            )}
          </div>

          {!enlistment ? (
            <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-700">
              {!memberPin ? (
                <div className="flex items-center gap-2 text-amber-600 bg-amber-50 p-3 rounded-lg text-sm">
                  <AlertCircle className="w-4 h-4" />
                  Please update the patient's PhilHealth Profile with their PINs to use Yakap Integration.
                </div>
              ) : (
                <div className="flex flex-col sm:flex-row items-center gap-3">
                  <Button 
                    variant="outline" 
                    onClick={handleVerify} 
                    disabled={isVerifying || isEnlisting} 
                    className="w-full sm:w-auto text-teal-600 border-teal-600 hover:bg-teal-50"
                  >
                    {isVerifying && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Verify PINs
                  </Button>
                  
                  <Button 
                    onClick={handleEnlist} 
                    disabled={isEnlisting || isVerifying} 
                    className="w-full sm:w-auto bg-teal-600 hover:bg-teal-700"
                  >
                    {isEnlisting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Enlist to Yakap
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2 text-sm text-emerald-600 dark:text-emerald-400 font-medium pt-2">
              <CheckCircle className="w-4 h-4" />
              Verified & Enlisted
            </div>
          )}
        </div>

        {/* ID Generation (Only visible after successful enlistment) */}
        {enlistment && (
          <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-700">
            <h4 className="font-medium text-slate-900 dark:text-white">Konsulta Transaction Numbers</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="space-y-2 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700">
                <Label className="text-xs text-slate-500 uppercase">Case Number</Label>
                <p className="font-mono font-medium text-slate-900 dark:text-white text-lg">
                  {enlistment.hciCaseNo || 'N/A'}
                </p>
              </div>

              <div className="space-y-2 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700">
                <Label className="text-xs text-slate-500 uppercase">Enlistment Trans No</Label>
                <p className="font-mono font-medium text-slate-900 dark:text-white text-lg">
                  {enlistment.enlistmentTransNo || 'N/A'}
                </p>
              </div>

              <div className="space-y-2 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700">
                <Label className="text-xs text-slate-500 uppercase">Profiling Trans No</Label>
                {enlistment.profilingTransNo ? (
                  <p className="font-mono font-medium text-slate-900 dark:text-white text-lg">
                    {enlistment.profilingTransNo}
                  </p>
                ) : (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => handleGenerateId('PROFILING')}
                    disabled={isGenerating || !enlistment.hciCaseNo}
                    title={!enlistment.hciCaseNo ? "Generate Case No first" : undefined}
                    className="w-full text-teal-600 border-teal-600 hover:bg-teal-50"
                  >
                    {isGenerating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Generate Profiling No
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
