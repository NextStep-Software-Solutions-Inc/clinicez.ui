import { useEffect, useState } from 'react';
import { self } from '@services/request';

type UseRepeatPatientParams = {
  clinicUid: string;
  patientUserId: string | undefined;
};

type RepeatPatientResult = {
  isRepeatPatient: boolean;
};

/**
 * Custom hook to check if a patient has had previous consultations or appointment history in the clinic
 * @param clinicUid - The clinic unique identifier
 * @param patientUserId - The userId of the patient
 * @returns Object containing isRepeatPatient status and loading state
 */
export function useRepeatPatient({ clinicUid, patientUserId }: UseRepeatPatientParams) {
  const [isRepeatPatient, setIsRepeatPatient] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Only fetch if we have patient user ID
    if (!patientUserId) {
      setIsRepeatPatient(false);
      setIsLoading(false);
      return;
    }

    const checkRepeatPatient = async () => {
      setIsLoading(true);
      try {
        const response = await self.get<RepeatPatientResult>(
          `/api/clinics/${clinicUid}/appointments/check-repeat-patient?patientUserId=${patientUserId}`
        );
        setIsRepeatPatient(response.isRepeatPatient);
      } catch (error) {
        console.error('Error checking repeat patient status:', error);
        setIsRepeatPatient(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkRepeatPatient();
  }, [clinicUid, patientUserId]);

  return { isRepeatPatient, isLoading };
}
