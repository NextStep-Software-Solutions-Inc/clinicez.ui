"use client";

import ConditionalRender from "@components/utils/ConditionalRender";
import React from "react";
import { useSearchParams } from "next/navigation";

interface VitalsSignViewProps {
  fallback?: React.ReactNode;
  children?: React.ReactNode;
}

export default function VitalsSignView({fallback,children}: VitalsSignViewProps) {
  const searchParams = useSearchParams();
  const viewMode = searchParams.get("view_mode") || "tile";

  return (
    <ConditionalRender condition={viewMode === "tile"}
      fallback={fallback}
    >
      {children}
    </ConditionalRender>
  )
}
