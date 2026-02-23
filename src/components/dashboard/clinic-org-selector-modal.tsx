"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Building2, Stethoscope, Loader2, ArrowRight, CheckCircle2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  getClinicSelectOptionsAction,
  getOrgSelectOptionsAction,
  type ClinicOption,
  type OrganizationOption,
} from "@/actions/dashboard/clinic-org-select.action";

interface ClinicOrgSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: "clinic" | "organization";
}

export function ClinicOrgSelectorModal({
  isOpen,
  onClose,
  type,
}: ClinicOrgSelectorModalProps) {
  const router = useRouter();
  const [options, setOptions] = useState<ClinicOption[] | OrganizationOption[]>(
    []
  );
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    const fetchOptions = async () => {
      setIsLoading(true);
      try {
        if (type === "clinic") {
          const clinics = await getClinicSelectOptionsAction();
          setOptions(clinics);
        } else {
          const orgs = await getOrgSelectOptionsAction();
          setOptions(orgs);
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchOptions();
  }, [isOpen, type]);

  const handleSelect = (uid: string) => {
    const path =
      type === "clinic"
        ? `/v2/clinic/${uid}`
        : `/v2/org/${uid}`;

    onClose();
    router.push(path);
  };

  const title =
    type === "clinic"
      ? "Select a Clinic"
      : "Select an Organization";

  const icon =
    type === "clinic" ? (
      <Stethoscope className="w-5 h-5" />
    ) : (
      <Building2 className="w-5 h-5" />
    );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader className="space-y-3 pb-2">
          <DialogTitle className="text-xl">{title}</DialogTitle>
          <p className="text-sm text-muted-foreground font-normal">
            {type === "clinic"
              ? "Select the clinic you want to access. You'll be taken to its dashboard where you can manage patients, appointments, and clinic settings."
              : "Select the organization you want to access. You'll be taken to its dashboard where you can manage members, settings, and organizational resources."}
          </p>
        </DialogHeader>

        <div className="py-2">
          <div className="space-y-3 max-h-[450px] overflow-y-auto pr-4">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="w-8 h-8 text-blue-600 animate-spin mb-3" />
              <p className="text-sm text-muted-foreground">Loading...</p>
            </div>
          ) : options.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="p-3 bg-gray-100 rounded-full mb-3">
                {icon}
              </div>
              <p className="text-sm text-muted-foreground text-center">
                No {type}s found
              </p>
            </div>
          ) : (
            <>
              {options.map((option, index) => (
                <button
                  key={
                    "clinicUid" in option ? option.clinicUid : option.orgUid
                  }
                  onClick={() =>
                    handleSelect(
                      "clinicUid" in option
                        ? option.clinicUid
                        : option.orgUid
                    )
                  }
                  className="w-full group relative overflow-hidden rounded-xl border border-gray-200 bg-gradient-to-br from-white via-gray-50 to-white p-4 text-left transition-all duration-300 hover:border-blue-300 hover:shadow-lg hover:shadow-blue-100 active:scale-95"
                  style={{
                    animation: `slideIn 0.4s ease-out ${index * 50}ms backwards`,
                  }}
                >
                  {/* Animated gradient background on hover */}
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-50/50 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                  
                  {/* Animated border effect */}
                  <div className="absolute inset-0 rounded-xl opacity-0 transition-opacity duration-300 group-hover:opacity-100" style={{
                    background: 'linear-gradient(135deg, #3b82f6 0%, #60a5fa 100%)',
                    WebkitMask: 'linear-gradient(transparent, transparent)',
                  }} />

                  {/* Content */}
                  <div className="relative flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      {/* Icon with animated background */}
                      <div className="relative flex-shrink-0">
                        <div className="absolute inset-0 bg-blue-200 rounded-lg blur-md opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                        <div className="relative p-2.5 rounded-lg bg-gradient-to-br from-blue-100 to-blue-50 text-blue-600 transition-all duration-300 group-hover:from-blue-200 group-hover:to-blue-100 group-hover:scale-110 group-hover:shadow-md">
                          {icon}
                        </div>
                      </div>
                      
                      {/* Text content */}
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-gray-900 truncate group-hover:text-blue-600 transition-colors duration-300">
                          {option.name}
                        </p>
                        <p className="text-xs text-gray-500 mt-1 group-hover:text-gray-600 transition-colors duration-300">
                          {type === "clinic" ? "Clinic" : "Organization"}
                        </p>
                      </div>
                    </div>
                    
                    {/* Arrow indicator with animation */}
                    <div className="ml-3 flex-shrink-0">
                      <div className="relative w-5 h-5 text-gray-400 transition-all duration-300 group-hover:text-blue-600 group-hover:translate-x-1">
                        <ArrowRight className="w-5 h-5" />
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </>
          )}
          </div>
        </div>

        <style jsx>{`
          @keyframes slideIn {
            from {
              opacity: 0;
              transform: translateX(-20px);
            }
            to {
              opacity: 1;
              transform: translateX(0);
            }
          }
        `}</style>
      </DialogContent>
    </Dialog>
  );
}
