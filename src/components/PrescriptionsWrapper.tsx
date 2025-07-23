"use client"

import dynamic from "next/dynamic";

const Prescriptions = dynamic(() => import("@components/Prescriptions"), { 
  ssr: false,
  loading: () => null
});

export default function PrescriptionsWrapper(props: any) {
  return <Prescriptions {...props} />;
}
