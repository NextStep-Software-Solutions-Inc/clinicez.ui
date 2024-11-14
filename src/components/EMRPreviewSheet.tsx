"use client"

import { Button } from "@components/ui/button"
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@components/ui/sheet"
import { DialogProps } from "@radix-ui/react-dialog"
import Suspend from "./Suspend";
import EMRPreview from "./EMRPreview";
import { useSearchParams } from "next/navigation";
import { useMemo } from "react";

interface EMRPreviewSheetProps extends DialogProps { }
export default function EMRPreviewSheet({ }: EMRPreviewSheetProps) {

  const searchParams = useSearchParams()
  const open = useMemo(() => searchParams.has("emr"), [searchParams])

  const userId = searchParams.get("emr") ? searchParams.get("emr")! : ""
  
  const handleClose = (state: boolean) => {
    const searchParams = new URLSearchParams(window.location.search)
    searchParams.delete("emr")
    window.history.pushState({}, "", `${window.location.pathname}?${searchParams.toString()}`)
  }

  return (
    <Sheet open={open} onOpenChange={handleClose}>
      <SheetContent side="right" className="min-w-[calc(100dvw-30%)]">
        <SheetHeader>
          <SheetTitle>{`Electronic Medical Record (EMR) Preview`}</SheetTitle>
          <SheetDescription>
            Patient Record Summary
          </SheetDescription>
        </SheetHeader>
        <Suspend>
          {!!userId && <EMRPreview patientId={userId} />}
        </Suspend>
        <SheetFooter>
          <SheetClose asChild>
            <Button variant="outline" type="button">Close</Button>
          </SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}