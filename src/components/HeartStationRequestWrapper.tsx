"use client";

import dynamic from "next/dynamic";
import type { HeartStationRequestsProps } from "@/components/heart-station-requests/HeartStationRequests";

const HeartStationRequests = dynamic(() => import("@/components/heart-station-requests/HeartStationRequests"), {
  ssr: false,
  loading: () => null,
});

export default function HeartStationRequestWrapper(props: HeartStationRequestsProps) {
  return <HeartStationRequests {...props} />;
}
