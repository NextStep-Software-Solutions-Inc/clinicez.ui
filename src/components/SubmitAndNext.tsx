"use client";

import React from "react";
import { Button } from "@components/ui/button";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useFormStatus } from "react-dom";

type BackSubmitAndNextProps = {
  disabled?: {
    previous?: boolean;
    submit?: boolean;
    next?: boolean;
  }
  nextIndex?: string;
  prevIndex?: string;
  labels?: {
    previous?: string;
    submit?: string;
    next?: string;
  }
}

export default function BackSubmitAndNext({disabled, nextIndex, prevIndex, labels}: BackSubmitAndNextProps) {
  const { next = false, submit = false, previous = false} = disabled ?? {}
  const { previous: prevLabel = "Back", submit: submitLabel = "Submit", next: nextLabel = "Next"} = labels ?? {}
  const searchParams = useSearchParams();
  const {pending} = useFormStatus()
  
  return (
    <div className="flex gap-2">
      
      {!previous ? <Link href={{
        query: {
          ...Object.fromEntries(searchParams),
          index: prevIndex
        }
      }}><Button variant="link" type="button">{prevLabel}</Button></Link> : null}
   
      {!submit ? <Button disabled={pending} type="submit">{submitLabel}</Button>: null}
      {!next ? <Link href={{
        query: {
          ...Object.fromEntries(searchParams),
          index: nextIndex
        }
      }}><Button variant="link" type="button">{nextLabel}</Button></Link> : null}
    </div>
  );
}
