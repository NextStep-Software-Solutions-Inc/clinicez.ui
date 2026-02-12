"use client";

import { format } from "date-fns";
import { Button } from "@components/ui/button";
import { Badge } from "@components/ui/badge";
import { capitalize } from "@lib/utils";
import type { OnboardingFullValues } from "@/schemas/onboarding.schema";

interface ReviewStepProps {
  values: Partial<OnboardingFullValues>;
  onSubmit: () => void;
  onBack: () => void;
  isLoading: boolean;
  isShellAccount: boolean;
}

function FieldRow({
  label,
  value,
  required,
}: {
  label: string;
  value: string | null | undefined;
  required?: boolean;
}) {
  return (
    <div className="flex items-start justify-between border-b border-border/50 py-2.5 last:border-0">
      <span className="text-sm text-muted-foreground">
        {label}
        {required && <span className="ml-1 text-destructive">*</span>}
      </span>
      <span className="text-sm font-medium text-right max-w-[60%]">
        {value || (
          <span className="text-muted-foreground/50 italic">Not provided</span>
        )}
      </span>
    </div>
  );
}

const formatEnumLabel = (value: string | null | undefined) => {
  if (!value) return undefined;
  return capitalize(value.toLowerCase().replace(/_/g, " "));
};

export default function ReviewStep({
  values,
  onSubmit,
  onBack,
  isLoading,
  isShellAccount,
}: ReviewStepProps) {
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h2 className="text-xl font-semibold">Review Your Information</h2>
        <p className="text-sm text-muted-foreground">
          Please review your details before completing the setup. You can always
          update your profile later.
        </p>
      </div>

      {isShellAccount && (
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
          <div className="flex items-start gap-3">
            <Badge variant="secondary" className="mt-0.5 shrink-0">
              Shell Account
            </Badge>
            <p className="text-sm text-blue-700">
              Your account was pre-created by a healthcare provider. By
              completing onboarding, you are claiming ownership of this account.
            </p>
          </div>
        </div>
      )}

      <div className="space-y-4">
        <div className="rounded-lg border bg-card p-4">
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Basic Information
          </h3>
          <FieldRow label="First Name" value={values.firstName} required />
          <FieldRow label="Last Name" value={values.lastName} required />
          <FieldRow
            label="Date of Birth"
            value={
              values.dob ? format(new Date(values.dob), "MMMM d, yyyy") : undefined
            }
            required
          />
          <FieldRow
            label="Gender"
            value={formatEnumLabel(values.gender)}
            required
          />
        </div>

        <div className="rounded-lg border bg-card p-4">
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Contact Information
          </h3>
          <FieldRow label="Email" value={values.email} required />
          <FieldRow label="Phone" value={values.mobile} required />
        </div>

        <div className="rounded-lg border bg-card p-4">
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Additional Information
          </h3>
          <FieldRow label="Middle Name" value={values.middleName} />
          <FieldRow label="Suffix" value={values.suffix} />
          <FieldRow label="Nickname" value={values.nickname} />
          <FieldRow label="Place of Birth" value={values.placeOfBirth} />
          <FieldRow
            label="Civil Status"
            value={formatEnumLabel(values.civilStatus)}
          />
          <FieldRow
            label="Blood Type"
            value={formatEnumLabel(values.bloodType)}
          />
          <FieldRow label="Telephone" value={values.telephone} />
          <FieldRow label="Religion" value={values.religion} />
          <FieldRow label="Nationality" value={values.nationality} />
        </div>
      </div>

      <div className="flex justify-between pt-4">
        <Button type="button" variant="outline" onClick={onBack}>
          Back
        </Button>
        <Button onClick={onSubmit} disabled={isLoading}>
          {isLoading ? "Completing..." : "Complete Setup"}
        </Button>
      </div>
    </div>
  );
}
