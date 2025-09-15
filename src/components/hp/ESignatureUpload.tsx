"use client";

import React from "react";
import { Alert, AlertDescription } from "@components/ui/alert";
import { Input } from "@components/ui/input";
import { Label } from "@components/ui/label";
import { AlertTriangle } from "lucide-react";
import { toast } from "sonner";

interface ESignatureUploadProps {
  currentSignatureUrl?: string
  onFileChange: (file: File | null) => void
}

const MAX_FILE_SIZE_MB = 5;
const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/jpg'];

export default function ESignatureUpload({ currentSignatureUrl, onFileChange }: ESignatureUploadProps) {
  const validateFile = (file: File): string | null => {
    // Check file size (5MB limit)
    if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      return `File size must be ${MAX_FILE_SIZE_MB}MB or less`;
    }

    // Check file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return "Only PNG, JPEG, and JPG files are allowed";
    }

    return null;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) {
      onFileChange?.(null);
      return;
    }

    const validationError = validateFile(selectedFile);
    if (validationError) {
      toast.error(validationError);
      e.target.value = ""; // Clear the input
      onFileChange?.(null);
      return;
    }

    onFileChange?.(selectedFile);
  };
  return (
    <div className="w-full">
      {/* Important Notice */}
      <Alert className="mb-4 border-l-4 border-l-red-500 bg-red-50/50">
        <AlertTriangle className="h-5 w-5 text-red-600" />
        <AlertDescription className="text-sm">
          <span className="font-bold text-red-700">IMPORTANT:</span>
          <br />
          • Only image files (PNG, JPEG, JPG) are allowed
          <br />
          • File size must be 5MB or less
          <br />
          • Background should be transparent for best results
          <br />
          • Signature will be used on medical certificates and official documents
        </AlertDescription>
      </Alert>

      {/* Current Signature Status */}
      {currentSignatureUrl && (
        <div className="mb-4 text-sm text-green-600 bg-green-50 p-3 rounded-md border-l-4 border-l-green-500">
          ✓ E-Signature is currently uploaded and ready to use
        </div>
      )}

      {/* File Upload */}
      <div className="space-y-3">
        <Label htmlFor="signature-file" className="text-sm font-medium">Select Signature File</Label>
        <Input
          id="signature-file"
          type="file"
          accept=".png,.jpeg,.jpg,image/png,image/jpeg"
          onChange={handleFileChange}
          className="w-full"
        />
      </div>
    </div>
  );
}