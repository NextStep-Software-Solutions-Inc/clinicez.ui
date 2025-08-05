"use client"

import dynamic from "next/dynamic";

const ReferralSlip = dynamic(() => import("@/components/referral-slip/ReferralSlip"), {
  loading: () => <div>Loading...</div>,
  ssr: false
});

export default function ReferralSlipWrapper(props: any) {
  return <ReferralSlip {...props} />;
}