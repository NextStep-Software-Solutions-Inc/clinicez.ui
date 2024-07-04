import { Metadata } from "next";
import { ContactUsForm } from "./ContactUsForm";

export const metadata: Metadata = {
  title: "Contact Us | Clinic EZ",
  description: "Send us a message and we will get back to you as soon as possible.",
};

export default async function ContactUsPage() {

  return (
    <div className="container mx-auto my-10">
      <div className="bg-white p-8 rounded-lg shadow-xl w-full">
        <h2 className="text-2xl font-bold mb-6 text-primary border-b pb-2">Contact Us</h2>
        <ContactUsForm/>
      </div>
    </div>
  );
}

