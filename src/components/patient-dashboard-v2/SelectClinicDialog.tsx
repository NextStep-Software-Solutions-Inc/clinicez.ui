'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAtom } from 'jotai';
import { Loader2, Building2, ArrowRight } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { getOrgAssociatedClinicOptionsAction, type ClinicOption } from '@/actions/dashboard/clinic-org-select.action';
import { bookAppointmentAtom } from '@/state/book-appointment';

interface SelectClinicDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onClinicSelected: (clinicUid: string, clinicName: string) => void;
}

export function SelectClinicDialog({ isOpen, onClose, onClinicSelected }: SelectClinicDialogProps) {
  const router = useRouter();
  const [bookAppointmentForm, setBookAppointmentForm] = useAtom(bookAppointmentAtom);
  const [clinics, setClinics] = useState<ClinicOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedClinic, setSelectedClinic] = useState<string | null>(
    bookAppointmentForm.clinicUid || null
  );

  useEffect(() => {
    if (!isOpen) return;

    const fetchClinics = async () => {
      setIsLoading(true);
      try {
        const clinicOptions = await getOrgAssociatedClinicOptionsAction();
        setClinics(clinicOptions);
      } catch (error) {
        console.error('Error fetching clinics:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchClinics();
  }, [isOpen]);

  const handleSelectClinic = () => {
    if (selectedClinic) {
      const clinic = clinics.find((c) => c.clinicUid === selectedClinic);
      setBookAppointmentForm({
        ...bookAppointmentForm,
        clinicUid: selectedClinic,
      });
      onClinicSelected(selectedClinic, clinic?.name ?? '');
      onClose();
    }
  };

  const handleViewMoreClinics = () => {
    onClose();
    router.push('/v2/clinics');
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Select a Clinic</DialogTitle>
          <DialogDescription>
            Choose a clinic from your joined organizations to book an appointment
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
          </div>
        ) : clinics.length > 0 ? (
          <>
            <div className="space-y-3 max-h-[400px] overflow-y-auto">
              {clinics.map((clinic) => (
                <div
                  key={clinic.clinicUid}
                  onClick={() => setSelectedClinic(clinic.clinicUid)}
                  className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                    selectedClinic === clinic.clinicUid
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/30 dark:border-blue-600'
                      : 'border-slate-200 bg-white dark:bg-slate-900/50 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <Building2
                      className={`w-5 h-5 mt-1 flex-shrink-0 ${
                        selectedClinic === clinic.clinicUid
                          ? 'text-blue-600 dark:text-blue-400'
                          : 'text-slate-400 dark:text-slate-500'
                      }`}
                    />
                    <div className="flex-1">
                      <p
                        className={`font-medium ${
                          selectedClinic === clinic.clinicUid
                            ? 'text-blue-900 dark:text-blue-100'
                            : 'text-slate-900 dark:text-white'
                        }`}
                      >
                        {clinic.name}
                      </p>
                    </div>
                    {selectedClinic === clinic.clinicUid && (
                      <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                        <div className="w-2 h-2 bg-white rounded-full" />
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-3 justify-between pt-4">
              <Button
                variant="outline"
                onClick={handleViewMoreClinics}
                className="flex-1"
              >
                View More Clinics
              </Button>
              <Button
                onClick={handleSelectClinic}
                disabled={!selectedClinic}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
              >
                Continue <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </>
        ) : (
          <div className="text-center py-8">
            <p className="text-slate-600 dark:text-slate-400 mb-4">No clinics available</p>
            <Button
              onClick={handleViewMoreClinics}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              View All Clinics
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
