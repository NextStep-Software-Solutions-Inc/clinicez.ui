import React from "react";
import { Mail } from "./mail/components/mail";
import { accounts, mails } from "./mail/data"
import { cookies } from "next/headers";
import { Separator } from "@components/ui/separator";
import { Button } from "@components/ui/button";

export default function AppointmentsPage() {
  const layout = cookies().get("react-resizable-panels:layout")
  const collapsed = cookies().get("react-resizable-panels:collapsed")

  const defaultLayout = layout ? JSON.parse(layout.value) : undefined
  const defaultCollapsed = collapsed ? JSON.parse(collapsed.value) : undefined
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-xl font-bold">Appointments</h3>
          <p className="text-sm text-muted-foreground">
              View and respond to appointments.
          </p>
        </div>
        <Button>Book Appointment</Button>
      </div>
      <Separator />
      <div className="rounded-[0.5rem] border bg-background shadow]">
        <Mail
          accounts={accounts}
          mails={mails}
          defaultLayout={defaultLayout}
          defaultCollapsed={defaultCollapsed}
          navCollapsedSize={4}
        />
      </div>
    </div>
  );
}
