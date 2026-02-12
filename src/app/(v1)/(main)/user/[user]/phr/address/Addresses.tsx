import { getAddressesAction } from "@actions/address.action";
import AddressForm from "./AddressForm";

interface AddressFormProps {
  sessionUserId: string;
  readOnly?: boolean;
  userId: string;
}

export const Addresses = async ({ userId, ...props }: AddressFormProps) => {

  const addresses = await getAddressesAction(userId);

  return (
    <AddressForm {...props} addresses={addresses} />
  );
};
