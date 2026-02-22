"use client";

import { useEffect } from "react";
import { AlertCircle, ArrowLeft, RotateCcw } from "lucide-react";
import { useRouter, useParams } from "next/navigation";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ClinicPatientProfileError({ error, reset }: ErrorProps) {
  const router = useRouter();
  const params = useParams<{ clinicUid: string }>();

  useEffect(() => {
    console.error("[ClinicPatientProfile]", error);
  }, [error]);

  return (
    <div className="w-full min-h-[400px] flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        {/* Icon */}
        <div className="mb-6 flex justify-center">
          <div className="p-4 bg-red-100 dark:bg-red-900/30 rounded-full">
            <AlertCircle className="w-10 h-10 text-red-600 dark:text-red-400" />
          </div>
        </div>

        <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
          Could not load patient profile
        </h1>
        <p className="text-slate-600 dark:text-slate-400 mb-6 text-sm">
          We encountered an error while fetching this patient&apos;s record. Please
          try again or go back to the patient list.
        </p>

        {process.env.NODE_ENV === "development" && error.message && (
          <div className="mb-6 p-4 bg-slate-100 dark:bg-slate-800 rounded-lg text-left">
            <p className="text-xs font-mono text-slate-700 dark:text-slate-300 break-words">
              {error.message}
            </p>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={reset}
            className="flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-primary text-primary-foreground font-semibold hover:opacity-90 transition-opacity"
          >
            <RotateCcw className="w-4 h-4" />
            Try again
          </button>
          <button
            onClick={() =>
              router.push(`/v2/clinic/${params?.clinicUid ?? ""}/patients`)
            }
            className="flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-semibold hover:opacity-90 transition-opacity"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to patients
          </button>
        </div>
      </div>
    </div>
  );
}
