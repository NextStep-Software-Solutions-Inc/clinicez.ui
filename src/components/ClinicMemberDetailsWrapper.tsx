"use client"

import dynamic from "next/dynamic";

const ClinicMemberDetails = dynamic(() => import("@components/membership/ClinicMemberDetails"), { 
  ssr: false,
  loading: () => null
});

export default function ClinicMemberDetailsWrapper(props: any) {
  return <ClinicMemberDetails {...props} />;
}
