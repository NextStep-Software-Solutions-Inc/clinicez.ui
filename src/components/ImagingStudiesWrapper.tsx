"use client"

import dynamic from "next/dynamic";
import type { ImagingStudiesProps } from "@components/imaging-studies/ImagingStudies";

const ImagingStudies = dynamic(() => import("@components/imaging-studies/ImagingStudies"), {
  ssr: false,
  loading: () => null
});

export default function ImagingStudiesWrapper(props: ImagingStudiesProps) {
  return <ImagingStudies {...props} />;
}
