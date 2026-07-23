"use server";

import { PhilHealthForm } from "./PhilHealthForm";
import { PhilHealthPhoto } from "./PhilHealthPhoto";
import { getPhilHealthRecordAction } from "@/actions/philhealth/philhealth-record.action";

interface PhilHealthFormWrapperProps {
  userUid: string;
  readonly?: boolean;
}

export default async function PhilHealthFormWrapper({ userUid, readonly }: PhilHealthFormWrapperProps) {
  let philhealthRecord: { id: number; pin: string; philSysId?: string; tin?: string; memberType?: string; photoUrl?: string } | undefined;

  try {
    const existing = await getPhilHealthRecordAction(userUid);
    if (existing.data) {
      philhealthRecord = {
        id: existing.data.id,
        pin: existing.data.pin,
        philSysId: existing.data.philSysId ?? undefined,
        tin: existing.data.tin ?? undefined,
        memberType: existing.data.memberType,
        photoUrl: ('photoUrl' in existing.data
          ? (existing.data as { photoUrl?: string | null }).photoUrl ?? undefined
          : undefined),
      };
    }
  } catch {
    // no existing record or unauthorized; leave undefined
  }
  return (
    <div className="space-y-6">
      {philhealthRecord?.id && (
        <PhilHealthPhoto
          userUid={userUid}
          philHealthRecordId={philhealthRecord.id}
          existingUrl={philhealthRecord.photoUrl}
          readonly={readonly}
        />
      )}
      <PhilHealthForm userUid={userUid} readonly={readonly} philhealth={philhealthRecord} />
    </div>
  );
}
