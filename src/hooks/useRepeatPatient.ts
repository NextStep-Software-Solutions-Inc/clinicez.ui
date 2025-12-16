import { useEffect, useState } from 'react';
import { self } from '@lib/axios';

type UseRepeatPatientParams = {
  clinicUid: string;
  patientUserId: string | undefined;
  hpId: number | undefined;
};

type RepeatPatientResult = {
  isRepeatPatient: boolean;
};

/**
 * Custom hook to check if a patient has had previous consultations with a healthcare provider
 * @param clinicUid - The clinic unique identifier
 * @param patientUserId - The userId of the patient
 * @param hpId - The healthcare provider ID
 * @returns Object containing isRepeatPatient status and loading state
 */
export function useRepeatPatient({ clinicUid, patientUserId, hpId }: UseRepeatPatientParams) {
  const [isRepeatPatient, setIsRepeatPatient] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Only fetch if we have all required parameters
    if (!patientUserId || !hpId) {
      setIsRepeatPatient(false);
      setIsLoading(false);
      return;
    }

    const checkRepeatPatient = async () => {
      setIsLoading(true);
      try {
        const response = await self.get<RepeatPatientResult>(
          `/api/clinics/${clinicUid}/appointments/check-repeat-patient?patientUserId=${patientUserId}&hpId=${hpId}`
        );
        setIsRepeatPatient(response.data.isRepeatPatient);
      } catch (error) {
        console.error('Error checking repeat patient status:', error);
        setIsRepeatPatient(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkRepeatPatient();
  }, [clinicUid, patientUserId, hpId]);

  return { isRepeatPatient, isLoading };
}
