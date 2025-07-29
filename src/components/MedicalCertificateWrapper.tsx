"use client"

import dynamic from "next/dynamic";

const MedicalCertificate = dynamic(() => import("@components/medical-certificate/MedicalCertificate"), { 
  ssr: false,
  loading: () => null
});

export default function MedicalCertificateWrapper(props: any) {
  return <MedicalCertificate {...props} />;
}
