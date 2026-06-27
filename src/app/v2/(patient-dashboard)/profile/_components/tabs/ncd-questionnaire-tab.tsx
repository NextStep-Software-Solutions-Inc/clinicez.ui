"use client";

import { differenceInYears } from "date-fns";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { InfoIcon } from "lucide-react";
import { NcdQuestionnaireEditForm } from "@/components/health-records/ncd-questionnaire-edit-form";
import { NcdQuestionnaireSchemaType } from "@/schemas/ncd-questionnaire-schema";

import { NcdQuestionnaireTabData } from "@/types/patient-profile-tabs";

interface NcdQuestionnaireTabProps {
    data: NcdQuestionnaireTabData & { dob?: string | null };
    patientId?: number;
}

export function NcdQuestionnaireTab({ data, patientId }: NcdQuestionnaireTabProps) {
    const { ncdQuestionnaire, dob } = data;
    const isEligible = dob ? differenceInYears(new Date(), new Date(dob)) >= 25 : false;

    if (!isEligible) {
        return (
            <div className="p-6">
                <Alert className="bg-blue-50 border-blue-200">
                    <InfoIcon className="h-4 w-4 text-blue-600" />
                    <AlertTitle className="text-blue-800">Not Applicable</AlertTitle>
                    <AlertDescription className="text-blue-700">
                        Per PhilHealth Konsulta guidelines, the NCD Risk Assessment is only required for patients aged 25 years and older. This patient is currently under 25 years old.
                    </AlertDescription>
                </Alert>
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6">
            <div>
                <h3 className="text-lg font-medium leading-6 text-gray-900">
                    Non-Communicable Disease (NCD) Risk Assessment
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                    Please answer the following PhilHealth required questions for patients aged 25 and above.
                </p>
            </div>
            <div className="border-t border-gray-200 pt-6">
                <NcdQuestionnaireEditForm 
                    patientId={patientId!} 
                    initialData={ncdQuestionnaire} 
                />
            </div>
        </div>
    );
}
