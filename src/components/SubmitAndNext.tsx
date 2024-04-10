"use client";

import React from "react";
import { Button } from "@components/ui/button";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useFormStatus } from "react-dom";

export default function SubmitAndNext() {
  const searchParams = useSearchParams();
  const {pending} = useFormStatus()
  
  return (
    <div className="flex gap-2">
      <Button disabled={pending} type="submit">Submit</Button>
      <Link href={{
        query: {
          ...Object.fromEntries(searchParams),
          index: parseInt(searchParams.get("index") ?? "1") + 1
        }
      }}>
        <Button variant="secondary" type="button">Next</Button>
      </Link>
    </div>
  );
}
