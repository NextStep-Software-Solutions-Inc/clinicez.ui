"use client";

import dynamic from "next/dynamic";
import type { ReferralSlipProps } from "@/components/referral-slip/ReferralSlip";

const ReferralSlip = dynamic(
  () => import("@/components/referral-slip/ReferralSlip"),
  {
    loading: () => <div>Loading...</div>,
    ssr: false,
  }
);

export default function ReferralSlipWrapper(props: ReferralSlipProps) {
  return <ReferralSlip {...props} />;
}