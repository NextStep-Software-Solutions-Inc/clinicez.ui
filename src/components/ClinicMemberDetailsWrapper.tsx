"use client"

import dynamic from "next/dynamic";
import type { ClinicMemberDetailsProps } from "@components/membership/ClinicMemberDetails";

const ClinicMemberDetails = dynamic(() => import("@components/membership/ClinicMemberDetails"), {
  ssr: false,
  loading: () => null
});

export default function ClinicMemberDetailsWrapper(props: ClinicMemberDetailsProps) {
  return <ClinicMemberDetails {...props} />;
}
