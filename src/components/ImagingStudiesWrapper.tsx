"use client"

import dynamic from "next/dynamic";

const ImagingStudies = dynamic(() => import("@components/imaging-studies/ImagingStudies"), { 
  ssr: false,
  loading: () => null
});

export default function ImagingStudiesWrapper(props: any) {
  return <ImagingStudies {...props} />;
}
