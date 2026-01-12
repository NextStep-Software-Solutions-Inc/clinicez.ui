"use server";

import { getPhilHealthMemberTypesAction } from "@/actions/philhealth/philhealth-member-type.action";
import { PhilHealthForm } from "./PhilHealthForm";
import { PhilHealthPhoto } from "./PhilHealthPhoto";
import { getPhilHealthRecordAction } from "@/actions/philhealth/philhealth-record.action";
import { PhilHealthMemberType } from "@prisma";

interface PhilHealthFormWrapperProps {
  userUid: string;
  readonly?: boolean;
}

export default async function PhilHealthFormWrapper({ userUid, readonly }: PhilHealthFormWrapperProps) {
  let memberTypes: PhilHealthMemberType[] = [];
  let philhealthRecord: { id: number; pin: string; philSysId?: string; tin?: string; memberTypeId: number; photoUrl?: string } | undefined;
  try {
    memberTypes = await getPhilHealthMemberTypesAction();
  } catch {
    memberTypes = [];
  }
  try {
    const existing = await getPhilHealthRecordAction(userUid);
    if (existing.data) {
      philhealthRecord = {
        id: existing.data.id,
        pin: existing.data.pin,
        philSysId: existing.data.philSysId ?? undefined,
        tin: existing.data.tin ?? undefined,
        memberTypeId: existing.data.memberTypeId,
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
      <PhilHealthForm userUid={userUid} readonly={readonly} memberTypes={memberTypes} philhealth={philhealthRecord} />
    </div>
  );
}
