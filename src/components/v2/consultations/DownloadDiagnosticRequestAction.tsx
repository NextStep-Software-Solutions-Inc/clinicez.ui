"use client";

import React from "react";
import { toast } from "sonner";
import { getDiagnosticRequestAction } from "@/actions/clinics/clinical-record/diagnostic-requests.action";
import { promiseWrapper } from "@/lib/with-error-handling";
import { safeImageUrlToBase64 } from "@/lib/image-to-base64";
import { formatPatientAddress } from "@/lib/utils/format-patient-address";
import { calculateAge } from "@/lib/utils";
import { handlePrintHtmlToPDF } from "@/lib/print-pdf";
import dayjs from "@/lib/day-utils";
import { getDiagnosticProcedures } from "@/actions/clinics/clinical-record/diagnostic-procedures.action";

interface DownloadDiagnosticRequestActionProps {
  request: { id: string };
  children: React.ReactNode;
  onUpdated?: () => void;
}

const DownloadDiagnosticRequestAction = React.forwardRef<
  HTMLFormElement,
  DownloadDiagnosticRequestActionProps
>(({ request, children, onUpdated }, ref) => {
  const handleDownload = async () => {
    toast.promise(promiseWrapper(getDiagnosticRequestAction)(request.id), {
      loading: "Downloading diagnostic request...",
      success: async (res) => {
        const data = res.data as any;
        if (!data) throw new Error("No data returned");

        const hpProfile = data.HealthCareProvider?.HPProfile;
        const professionalDetails = data.HealthCareProvider?.ProfessionalDetails;
        const doctorName = `${hpProfile?.title ?? ""} ${hpProfile?.name ?? ""} ${hpProfile?.suffix ?? ""}`.trim();
        const licenseNo = professionalDetails?.licenseNumber ?? "";
        const ptrNo = professionalDetails?.ptrNumber ?? "";
        const eSignatureUrl = hpProfile?.eSignatureUrl ?? "";
        const doctorAddress = "";

        const eSignatureBase64 = eSignatureUrl ? await safeImageUrlToBase64(eSignatureUrl) : "";

        const patient = data.Patient ?? {};
        const patientName =
          `${patient.firstName ?? ""} ${patient.middleName ?? ""} ${patient.lastName ?? ""} ${patient.suffix ?? ""}`.trim();
        const age = calculateAge(patient.dob) ?? "";
        const gender = patient.gender ?? "";

        const address = formatPatientAddress(patient as any);
        const birthdate = patient.dob ? dayjs(patient.dob).format("MM/DD/YYYY") : "";

        const diagnosticsByCategory: Record<string, string[]> = {};
        
        // Fetch diagnostic procedures to map names
        const procsRes = await getDiagnosticProcedures();
        const allProcs = procsRes.data || [];

        const procedures = data.diagnosticProcedures as any;
        if (Array.isArray(procedures)) {
          procedures.forEach((p) => {
            const matchedProc = allProcs.find((ap: any) => ap.id === p.diagnosticProcedureId);
            if (matchedProc) {
              const category = (matchedProc.category || "OTHER").toUpperCase();
              if (!diagnosticsByCategory[category]) {
                diagnosticsByCategory[category] = [];
              }
              const display = p.bodyPart ? `${matchedProc.name} (${p.bodyPart})` : matchedProc.name;
              diagnosticsByCategory[category].push(display);
            }
          });
        }

        let html = data.DocumentTemplate?.htmlContent ?? "";
        
        const variables: Record<string, string> = {
          "patient.name": patientName,
          "patient.age": String(age),
          "patient.gender": gender,
          "patient.address": address,
          "patient.birthdate": birthdate,
          "doctor.name": doctorName,
          "doctor.licenseNo": licenseNo,
          "doctor.ptrNo": ptrNo,
          "doctor.address": doctorAddress,
          "doctor.eSignatureBase64": eSignatureBase64 ? `<img src="${eSignatureBase64}" width="150" />` : "",
          "request.impression": data.remarks || "",
        };

        for (const [key, value] of Object.entries(variables)) {
          html = html.replace(new RegExp(`{{\\s*${key}\\s*}}`, "g"), value);
        }

        let diagnosticsHtml = "";
        for (const [cat, procs] of Object.entries(diagnosticsByCategory)) {
          diagnosticsHtml += `
            <div style="margin-bottom: 12px;">
              <div style="font-weight: bold; text-decoration: underline; margin-bottom: 4px;">${cat}</div>
              <ul style="margin: 0; padding-left: 20px;">
                ${procs.map((p) => `<li>${p}</li>`).join("")}
              </ul>
            </div>
          `;
        }

        html = html.replace(new RegExp(`{{\\s*request\\.tests\\s*}}`, "g"), diagnosticsHtml);
        html = html.replace(new RegExp(`{{\\s*request\\.laboratoryProcedures\\s*}}`, "g"), diagnosticsHtml);
        html = html.replace(new RegExp(`{{\\s*request\\.diagnosticsByCategory\\s*}}`, "g"), diagnosticsHtml);

        const filename = `diagnostic-request-${dayjs().format("YYYYMMDD-HHmmss")}.pdf`;

        await handlePrintHtmlToPDF(html);

        return "Successfully downloaded";
      },
      error: (err) => err?.message || "Failed to download diagnostic request",
    });
  };

  return (
    <form
      ref={ref}
      action={handleDownload}
      className="inline-block"
      onClick={(e) => e.stopPropagation()}
    >
      {children}
    </form>
  );
});

DownloadDiagnosticRequestAction.displayName = "DownloadDiagnosticRequestAction";

export default DownloadDiagnosticRequestAction;
