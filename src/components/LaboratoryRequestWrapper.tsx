"use client"

import dynamic from "next/dynamic";
import type { LaboratoryRequestProps } from "@components/laboratory-requests/LaboratoryRequest";

const LaboratoryRequest = dynamic(() => import("@components/laboratory-requests/LaboratoryRequest"), {
  ssr: false,
  loading: () => null
});

export default function LaboratoryRequestWrapper(props: LaboratoryRequestProps) {
  return <LaboratoryRequest {...props} />;
}
