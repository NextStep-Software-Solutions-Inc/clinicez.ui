import { Metadata } from "next";

export const metadata: Metadata = {
  title: "User Activation",
  description: "Organization provides a way to activate users aside from the default manual application to become a member.",
}

export default function ActivatePage() {
  return (
    <div className="container mx-auto py-10">Activate Page</div>
  );
}
