import type { Metadata } from "next";
import { getInvoicesAction } from "@/actions/billing/invoice.action";
import { InvoicesListClient } from "@/components/v2/billing/InvoicesListClient";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Invoices History",
  description: "View and manage clinic patient invoices and receipts",
};

interface InvoicesPageProps {
  params: Promise<{ clinicUid: string }>;
}

export default async function InvoicesPage({ params }: InvoicesPageProps) {
  const { clinicUid } = await params;

  const invoicesRes = await getInvoicesAction(clinicUid);

  return (
    <InvoicesListClient
      clinicUid={clinicUid}
      initialInvoices={invoicesRes.data ?? []}
    />
  );
}
