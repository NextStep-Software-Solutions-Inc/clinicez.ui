import MaintenanceWarning from "@components/MaintenanceWarning";
import { Metadata } from "next";
import React from "react";

export const metadata: Metadata = {
  title: "Maintenance | Clinic EZ",
  description: "This page is currently under maintenance. Please try again later."
};

export default function MaintenancePage() {
  return (
    <MaintenanceWarning/>
  )
}
