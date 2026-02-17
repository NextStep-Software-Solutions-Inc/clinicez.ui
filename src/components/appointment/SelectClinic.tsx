"use client";

import React, { useEffect, useState } from "react";
import { Loader2, Building2 } from "lucide-react";
import { useAtom } from "jotai";
import { bookAppointmentAtom } from "@state/book-appointment";
import { getClinicSelectOptionsAction, type ClinicOption } from "@actions/dashboard/clinic-org-select.action";
import { Button } from "@components/ui/button";

interface SelectClinicProps {
  nextStep?: () => void;
  prevStep?: () => void;
  isFirstStep?: boolean;
  isLastStep?: boolean;
}

export default function SelectClinic({ nextStep, isFirstStep }: SelectClinicProps) {
  const [bookAppointmentForm, setBookAppointmentForm] = useAtom(bookAppointmentAtom);
  const [clinics, setClinics] = useState<ClinicOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedClinic, setSelectedClinic] = useState<string | null>(
    bookAppointmentForm.clinicUid || null
  );

  useEffect(() => {
    const fetchClinics = async () => {
      setIsLoading(true);
      try {
        const clinicOptions = await getClinicSelectOptionsAction();
        setClinics(clinicOptions);
        
        // If only one clinic, auto-select it
        if (clinicOptions.length === 1) {
          setSelectedClinic(clinicOptions[0].clinicUid);
        }
      } catch (error) {
        console.error("Error fetching clinics:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchClinics();
  }, []);

  const handleSelectClinic = (clinicUid: string) => {
    setSelectedClinic(clinicUid);
    setBookAppointmentForm({
      ...bookAppointmentForm,
      clinicUid,
    });
  };

  const handleNext = () => {
    if (selectedClinic) {
      nextStep?.();
    }
  };

  if (isLoading) {
    return (
      <div className="shadow-lg w-full p-8 bg-white rounded-md">
        <div className="flex items-center justify-center h-48">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        </div>
      </div>
    );
  }

  return (
    <div className="shadow-lg w-full p-8 bg-white rounded-md">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-2">Select a Clinic</h3>
        <p className="text-sm text-slate-600">Choose which clinic you'd like to book an appointment with</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {clinics.length > 0 ? (
          clinics.map((clinic) => (
            <div
              key={clinic.clinicUid}
              onClick={() => handleSelectClinic(clinic.clinicUid)}
              className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                selectedClinic === clinic.clinicUid
                  ? "border-blue-500 bg-blue-50"
                  : "border-slate-200 bg-white hover:border-slate-300"
              }`}
            >
              <div className="flex items-start gap-3">
                <Building2 className={`w-5 h-5 mt-1 flex-shrink-0 ${
                  selectedClinic === clinic.clinicUid ? "text-blue-600" : "text-slate-400"
                }`} />
                <div className="flex-1">
                  <p className={`font-medium ${
                    selectedClinic === clinic.clinicUid ? "text-blue-900" : "text-slate-900"
                  }`}>
                    {clinic.name}
                  </p>
                </div>
                {selectedClinic === clinic.clinicUid && (
                  <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                    <div className="w-2 h-2 bg-white rounded-full" />
                  </div>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full text-center py-8">
            <p className="text-slate-600">No clinics available</p>
          </div>
        )}
      </div>

      <div className="flex gap-3 justify-end">
        <Button
          onClick={handleNext}
          disabled={!selectedClinic}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          Continue
        </Button>
      </div>
    </div>
  );
}
