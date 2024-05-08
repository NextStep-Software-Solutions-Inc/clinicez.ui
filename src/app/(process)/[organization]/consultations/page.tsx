import React from "react";
import { Mail } from "./mail/components/mail";
import { accounts, appointmentList } from "@public/json/appointment-list"
import { cookies } from "next/headers";
import { Separator } from "@components/ui/separator";

export default function ConsultationsPage() {
  const layout = cookies().get("react-resizable-panels:layout")
  const collapsed = cookies().get("react-resizable-panels:collapsed")

  const defaultLayout = layout ? JSON.parse(layout.value) : undefined
  const defaultCollapsed = collapsed ? JSON.parse(collapsed.value) : undefined
  return (
    <>
      <div className="space-y-6">
        <div>
          <h3 className="text-xl font-bold">Consultations</h3>
          <p className="text-sm text-muted-foreground">
            View and respond to consultations.
          </p>
        </div>
        <Separator />
        <Mail
          accounts={accounts}
          mails={appointmentList["pending"]}
          defaultLayout={defaultLayout}
          defaultCollapsed={defaultCollapsed}
          navCollapsedSize={4}
        />
      </div>
      
    </>
  );
}
