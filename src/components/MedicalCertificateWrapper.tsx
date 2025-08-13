"use client"

import dynamic from "next/dynamic";
import type { MedicalCertificateProps } from "@components/medical-certificate/MedicalCertificate";

const MedicalCertificate = dynamic(() => import("@components/medical-certificate/MedicalCertificate"), {
  ssr: false,
  loading: () => null
});

export default function MedicalCertificateWrapper(props: MedicalCertificateProps) {
  return <MedicalCertificate {...props} />;
}
