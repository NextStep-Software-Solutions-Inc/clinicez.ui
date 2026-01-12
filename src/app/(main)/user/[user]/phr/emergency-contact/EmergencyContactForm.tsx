"use client";

import { createEmergencyContactAction } from "@actions/emergency-contact.action";
import { Card, CardContent, CardHeader, CardTitle } from "@components/ui/card";
import { Separator } from "@components/ui/separator";
import Each from "@components/utils/Each";
import React from "react";
import { toast } from "sonner";
import { ContactItem } from "./ContactItem";
import ActionButton from "@components/ActionButton";
import { z } from "zod";
import { UserEmergencyContact } from "@prisma";
import { revalidatePath } from "@actions/cache.action";
import ConditionalRender from "@components/utils/ConditionalRender";

interface EmergencyContactFormProps {
  contacts: UserEmergencyContact[];
  sessionUserId: string
  readOnly?: boolean;
}

export default function EmergencyContactForm({ contacts, sessionUserId, readOnly = true }: EmergencyContactFormProps) {

  const addContactAction = async (formData: FormData) => {
    const isPrimary = formData.get("isPrimary") === "true"
    const contact = {
      firstName: "",
      middleName: "",
      lastName: "",
      suffix: "",
      name: "",
      relationship: "",
      phone: "",
      isPrimary,
      address: null,
    }
    toast.promise(createEmergencyContactAction(sessionUserId, contact), {
      loading: `Adding ${isPrimary ? "Primary" : "Secondary"} contact...`,
      success: () => {
        revalidatePath("/user/[user]/phr/emergency-contact", "page")
        return `${isPrimary ? "Primary" : "Secondary"} contact added successfully.`
      },
      error: "An error occurred while adding contact.",
    })
  }


  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex flex-wrap gap-2 items-center justify-between">
            <span className="capitalize">Primary Contacts</span>
            <ConditionalRender condition={!readOnly}>
              <form action={addContactAction} className="space-y-8 flex-grow sm:flex-grow-0">
                <ActionButton name="isPrimary" value="true" className="w-full" >Add Primary Contact</ActionButton>
              </form>
            </ConditionalRender>
          </CardTitle>
          <Separator />
        </CardHeader>
        <CardContent>
          <Each
            of={contacts.filter(contact => contact.isPrimary)}
            render={(contact, index) => (
              <>
                <ContactItem readOnly={readOnly} key={contact.id} contact={contact} />
                {contacts.filter(contact => contact.isPrimary).length - 1 !== index && (
                  <Separator className="my-5 h-1" />
                )}
              </>
            )}
          />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="flex flex-wrap gap-2 items-center justify-between">
            <span className="capitalize">Secondary Contacts</span>
            <ConditionalRender condition={!readOnly}>
              <form action={addContactAction} className="space-y-8 flex-grow sm:flex-grow-0">
                <ActionButton name="isPrimary" value="false" className="w-full" >Add Secondary Contact</ActionButton>
              </form>
            </ConditionalRender>
          </CardTitle>
          <Separator />
        </CardHeader>
        <CardContent>
          <Each
            of={contacts.filter(contact => !contact.isPrimary)}
            render={(contact, index) => (
              <>
                <ContactItem readOnly={readOnly} key={contact.id} contact={contact} />
                {contacts.filter(contact => !contact.isPrimary).length - 1 !== index && (
                  <Separator className="my-5 h-1" />
                )}
              </>
            )}
          />
        </CardContent>
      </Card>
    </div>
  );
}


