"use client";

import React, { useRef, useState, useTransition } from "react";
import { useAtom } from "jotai";
import { toast } from "sonner";
import { CheckCircle2, FileUp, Loader2, X } from "lucide-react";
import { additionalInfoValidAtom } from "./AdditionalInformationStep";
import { joinOrgApplicationAtom } from "@state/join-org-application";
import {
  stageRequirementFileUploadAction,
  type StagedRequirementFile,
} from "@/actions/organizations/org-member-requirement-file.action";

const REQUIREMENT_LABELS: Record<string, string> = {
  medical_certificate: "Medical Certificate",
  xray_result: "X-Ray Result",
  other: "Supporting Document",
};

interface FileRequirementFormProps {
  requirementType: string;
}

export default function FileRequirementForm({ requirementType }: FileRequirementFormProps) {
  const [, setAdditionalInfoValid] = useAtom(additionalInfoValidAtom);
  const [, setOrgApplication] = useAtom(joinOrgApplicationAtom);
  const [stagedFile, setStagedFile] = useState<StagedRequirementFile | null>(null);
  const [isPending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  const label = REQUIREMENT_LABELS[requirementType] ?? requirementType.replace(/_/g, " ");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const sizeMB = file.size / 1024 / 1024;
    if (sizeMB > 25) {
      toast.error("File size must not exceed 25 MB");
      return;
    }

    startTransition(async () => {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("requirementType", requirementType);

      const result = await stageRequirementFileUploadAction(fd);
      if (result.status && result.data) {
        setStagedFile(result.data);
        setAdditionalInfoValid((prev) => ({ ...prev, [requirementType]: true }));
        setOrgApplication((prev) => ({
          ...prev,
          stagedRequirementFiles: [
            ...(prev.stagedRequirementFiles ?? []).filter(
              (f) => f.requirementType !== requirementType
            ),
            result.data,
          ],
        }));
      } else {
        toast.error(result.message ?? "Upload failed. Please try again.");
      }
    });
  };

  const handleRemove = () => {
    setStagedFile(null);
    setAdditionalInfoValid((prev) => ({ ...prev, [requirementType]: false }));
    setOrgApplication((prev) => ({
      ...prev,
      stagedRequirementFiles: (prev.stagedRequirementFiles ?? []).filter(
        (f) => f.requirementType !== requirementType
      ),
    }));
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <div className="space-y-2">
      <p className="font-medium capitalize">{label}</p>
      {stagedFile ? (
        <div className="flex items-center gap-3 rounded-md border border-green-200 bg-green-50 p-3">
          <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{stagedFile.fileName}</p>
            <p className="text-xs text-muted-foreground">
              {(stagedFile.fileSize / 1024).toFixed(1)} KB · Uploaded
            </p>
          </div>
          <button
            type="button"
            onClick={handleRemove}
            className="text-muted-foreground hover:text-destructive transition-colors"
            aria-label="Remove file"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <label
          className={`flex flex-col items-center justify-center gap-2 rounded-md border-2 border-dashed p-6 cursor-pointer transition-colors ${
            isPending
              ? "border-primary/40 bg-primary/5 cursor-not-allowed"
              : "border-muted-foreground/30 hover:border-primary hover:bg-primary/5"
          }`}
        >
          <input
            ref={inputRef}
            type="file"
            className="sr-only"
            onChange={handleFileChange}
            disabled={isPending}
            accept="image/*,.pdf,.doc,.docx"
          />
          {isPending ? (
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          ) : (
            <FileUp className="h-6 w-6 text-muted-foreground" />
          )}
          <span className="text-sm text-center text-muted-foreground">
            {isPending
              ? "Uploading…"
              : "Click to upload or drag & drop"}
          </span>
          <span className="text-xs text-muted-foreground">
            PDF, image, or document · max 25 MB
          </span>
        </label>
      )}
    </div>
  );
}
