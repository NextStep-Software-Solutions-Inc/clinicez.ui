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
  labels?: {
    previous?: string;
    submit?: string;
    next?: string;
  }
  actions?: {
    next?: () => void;
    previous?: () => void;
  }
}

export default function BackSubmitAndNext({disabled, labels, actions}: BackSubmitAndNextProps) {
  const { next = false, submit = false, previous = false} = disabled ?? {}
  const {next:nextStep, previous: previousStep} = actions ?? {}
  const { previous: prevLabel = "Back", submit: submitLabel = "Submit", next: nextLabel = "Next"} = labels ?? {}
  const {pending} = useFormStatus()
  
  return (
    <div className="flex gap-2">
      {!previous ? <Button variant="outline" onClick={previousStep} type="button">{prevLabel}</Button>: null}
      {!submit ? <Button disabled={pending} type="submit">{submitLabel}</Button>: null}
      {!next ?<Button variant="outline" onClick={nextStep} type="button">{nextLabel}</Button> : null}
    </div>
  );
}
