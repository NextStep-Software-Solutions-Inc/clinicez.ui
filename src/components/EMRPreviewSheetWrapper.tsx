"use client"

import dynamic from "next/dynamic";
import { DialogProps } from "@radix-ui/react-dialog";

const EMRPreviewSheet = dynamic(() => import("@components/EMRPreviewSheet"), {
  ssr: false,
  loading: () => null
});

interface EMRPreviewSheetWrapperProps extends DialogProps { }

export default function EMRPreviewSheetWrapper(props: EMRPreviewSheetWrapperProps) {
  return <EMRPreviewSheet {...props} />;
}
