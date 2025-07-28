"use client"

import dynamic from "next/dynamic";

const LaboratoryRequest = dynamic(() => import("@components/laboratory-requests/LaboratoryRequest"), { 
  ssr: false,
  loading: () => null
});

export default function LaboratoryRequestWrapper(props: any) {
  return <LaboratoryRequest {...props} />;
}
