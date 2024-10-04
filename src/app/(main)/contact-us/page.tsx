import { Metadata } from "next";
import { ContactUsForm } from "./ContactUsForm";

export const metadata: Metadata = {
  title: "Contact us | Clinic EZ",
  description: "Send us a message and we will get back to you as soon as possible.",
};

export default async function ContactUsPage() {

  return (
    <div className="container mx-auto my-10">
      <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-8">
        <h2 className="text-2xl font-bold mb-6 text-primary border-b pb-2">Contact us</h2>
        <ContactUsForm/>
      </div>
    </div>
  );
}

