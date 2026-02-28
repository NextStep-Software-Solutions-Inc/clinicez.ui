import UnauthorizedWarning from "@components/UnauthorizedWarning";
import { Metadata } from "next";
import React from "react";

export const metadata: Metadata = {
  title: "Unauthorized | Clinic EZ",
  description: "You are not authorized to view this page."
};

export default function UnauthorizedPage() {
  return (
    <UnauthorizedWarning/>
  )
}
