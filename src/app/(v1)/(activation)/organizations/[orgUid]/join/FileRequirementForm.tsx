"use client";

import React, { useRef, useState, useTransition } from "react";
import { useAtom } from "jotai";
import { toast } from "sonner";
import { CheckCircle2, FileUp, Loader2, X } from "lucide-react";
import { additionalInfoValidAtom } from "./AdditionalInformationStep";
import { joinOrgApplicationAtom } from "@state/join-org-application";
import {
  stageRequirementFileUploadAction,
  getStagingUploadSasAction,
  confirmStagedUploadAction,
} from "@/actions/organizations/org-member-requirement-file.action";
import { type StagedRequirementFile } from "@/lib/requirement-types";

const REQUIREMENT_LABELS: Record<string, string> = {
  medical_certificate: "Medical Certificate",
  xray_result: "X-Ray Result",
  other: "Supporting Document",
};

/** Files larger than this are uploaded directly from the browser via a SAS URL
 *  to bypass Vercel's 4.5 MB serverless function body-size limit. */
const DIRECT_UPLOAD_THRESHOLD = 4 * 1024 * 1024; // 4 MB

interface FileRequirementFormProps {
  requirementType: string;
  orgUid: string;
}

export default function FileRequirementForm({ requirementType, orgUid }: FileRequirementFormProps) {
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
      toast.error(`File too large (${sizeMB.toFixed(1)} MB). Maximum allowed size is 25 MB.`);
      if (inputRef.current) inputRef.current.value = "";
      return;
    }

    startTransition(async () => {
      try {
        let staged: StagedRequirementFile | null = null;

        if (file.size > DIRECT_UPLOAD_THRESHOLD) {
          // Client-side direct upload via SAS URL (> 4 MB)
          const sasResult = await getStagingUploadSasAction({
            fileName: file.name,
            mimeType: file.type,
            fileSize: file.size,
            requirementType,
            orgUid,
          });
          if (!sasResult.status || !sasResult.data) {
            toast.error(sasResult.message ?? "Upload failed. Please try again.");
            return;
          }
          const { sasUrl, blobUrl } = sasResult.data;
          const uploadResp = await fetch(sasUrl, {
            method: "PUT",
            headers: {
              "x-ms-blob-type": "BlockBlob",
              "Content-Type": file.type || "application/octet-stream",
            },
            body: file,
          });
          if (!uploadResp.ok) {
            toast.error(`Upload failed (HTTP ${uploadResp.status}). Please try again.`);
            return;
          }
          const confirmResult = await confirmStagedUploadAction({
            blobUrl,
            fileName: file.name,
            fileSize: file.size,
            mimeType: file.type,
            requirementType,
            orgUid,
          });
          if (!confirmResult.status || !confirmResult.data) {
            toast.error(confirmResult.message ?? "Upload failed. Please try again.");
            return;
          }
          staged = confirmResult.data;
        } else {
          // Server-side upload (≤ 4 MB)
          const fd = new FormData();
          fd.append("file", file);
          fd.append("requirementType", requirementType);
          fd.append("orgUid", orgUid);
          const result = await stageRequirementFileUploadAction(fd);
          if (!result.status || !result.data) {
            toast.error(result.message ?? "Upload failed. Please try again.");
            return;
          }
          staged = result.data;
        }

        if (!staged) {
          toast.error("Upload failed. Please try again.");
          return;
        }

        setStagedFile(staged);
        setAdditionalInfoValid((prev) => ({ ...prev, [requirementType]: true }));
        setOrgApplication((prev) => ({
          ...prev,
          stagedRequirementFiles: [
            ...(prev.stagedRequirementFiles ?? []).filter(
              (f) => f.requirementType !== requirementType
            ),
            staged,
          ],
        }));
      } catch (err) {
        console.error("[FileRequirementForm] Upload error:", err);
        toast.error("Upload failed. Please try again.");
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
              {(stagedFile.fileSize / 1024).toFixed(1)} KB · Saved to your files
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
