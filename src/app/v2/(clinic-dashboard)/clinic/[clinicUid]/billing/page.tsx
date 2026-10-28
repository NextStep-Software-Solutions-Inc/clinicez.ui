import type { Metadata } from "next";
import { getClinicBillingSettingAction } from "@/actions/clinics/clinic-billing-setting.action";
import { getClinicPriceItemsAction } from "@/actions/clinics/clinic-price-item.action";
import { getPendingBillingEncountersAction } from "@/actions/billing/invoice.action";
import { CashierPosClient } from "@/components/v2/billing/CashierPosClient";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Billing & Cashier",
  description: "Point of Sale, Patient Invoices, and Official Receipts",
};

interface BillingPageProps {
  params: Promise<{ clinicUid: string }>;
}

export default async function BillingPage({ params }: BillingPageProps) {
  const { clinicUid } = await params;

  const [billingSettingRes, priceItemsRes, pendingEncountersRes] = await Promise.all([
    getClinicBillingSettingAction(clinicUid),
    getClinicPriceItemsAction(clinicUid),
    getPendingBillingEncountersAction(clinicUid),
  ]);

  return (
    <CashierPosClient
      clinicUid={clinicUid}
      initialPendingEncounters={pendingEncountersRes.data ?? []}
      priceCatalog={priceItemsRes.data ?? []}
      billingSetting={billingSettingRes.data ?? null}
    />
  );
}
