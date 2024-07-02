"use client";

import ActionButton from "@components/ActionButton";
import { Card, CardContent, CardHeader, CardTitle } from "@components/ui/card";
import { Separator } from "@components/ui/separator";
import Each from "@components/utils/Each";
import React from "react";
import { AddressItem, AddressItemProps } from "./AddressItem";
import { toast } from "sonner";
import { createAddressAction } from "@actions/address.action";
import { revalidatePath } from "@actions/cache.action";

const initialAddressValues = (key: "primary" | "secondary") => ({
  isPrimary: key === "primary",
  address: "",
  city: "",
  state: "",
  zipCode: "",
  country: "",
});

export default function AddressFormForm(props: {
  readOnly?: boolean;
  userId: string;
  addresses: AddressItemProps["address"][]
}) {
  const { readOnly = true, userId } = props;

  const addresses = {
    primary: props.addresses.filter(a => a.isPrimary),
    secondary: props.addresses.filter(a => !a.isPrimary),
  };

  const action = async (formData: FormData) => {
    const isPrimary = formData.get("isPrimary") === "true";
    const address = initialAddressValues(isPrimary ? "primary": "secondary");
    toast.promise(createAddressAction(userId, address), {
      loading: `Adding ${isPrimary ? "Primary": "Secondary"} address...`,
      success: () => {
        revalidatePath("/user/[user]/phr/address", "page");
        return `${isPrimary ? "Primary": "Secondary"} address added successfully.`
      },
      error: "An error occurred while adding address.",
    })
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="capitalize">Primary Address</span>
            <form action={action} className="space-y-8">
              <ActionButton name="isPrimary" value="true" className="capitalize">Add Primary Address</ActionButton>
            </form>
          </CardTitle>
          <Separator />
        </CardHeader>
        <CardContent>
          <Each
            of={addresses.primary}
            render={(address) => (
              <AddressItem key={address.id} readOnly={readOnly} address={address} />
            )}
          />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="capitalize">Secondary Address</span>
            <form action={action} className="space-y-8">
              <ActionButton name="isPrimary" value="false" className="capitalize">Add Secondary Address</ActionButton>
            </form>
          </CardTitle>
          <Separator />
        </CardHeader>
        <CardContent>
          <Each
            of={addresses.secondary}
            render={(address) => (
              <AddressItem key={address.id} readOnly={readOnly} address={address} />
            )}
          />
        </CardContent>
      </Card>
    </>
  );
}
