import type { Metadata } from "next";
import { getClinicBillingSettingAction } from "@/actions/clinics/clinic-billing-setting.action";
import {
  getCurrentShiftAction,
  getShiftHistoryAction,
} from "@/actions/accounting/cashier-shift.action";
import {
  getUnliquidatedDoctorFeesAction,
  getDoctorPayoutVouchersAction,
} from "@/actions/accounting/doctor-payout.action";
import { getHmoArSummaryAction } from "@/actions/accounting/hmo-receivables.action";
import { AccountingDashboardClient } from "@/components/v2/accounting/AccountingDashboardClient";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Accounting & Practice Sub-Ledger",
  description: "Cashier Shift Reconciliation, Doctor PF Liquidation, and HMO AR Aging",
};

interface AccountingPageProps {
  params: Promise<{ clinicUid: string }>;
}

export default async function AccountingPage({ params }: AccountingPageProps) {
  const { clinicUid } = await params;

  // Parallel server fetches for operational sub-ledger
  const [
    billingSettingRes,
    currentShiftRes,
    shiftHistoryRes,
    doctorSummariesRes,
    doctorVouchersRes,
    hmoArRes,
  ] = await Promise.all([
    getClinicBillingSettingAction(clinicUid),
    getCurrentShiftAction(clinicUid),
    getShiftHistoryAction(clinicUid, 30),
    getUnliquidatedDoctorFeesAction(clinicUid),
    getDoctorPayoutVouchersAction(clinicUid),
    getHmoArSummaryAction(clinicUid),
  ]);

  const billingSetting = billingSettingRes.data;
  const currentShift = currentShiftRes.data;
  const shiftHistory = shiftHistoryRes.data || [];
  const doctorSummaries = doctorSummariesRes.data?.summaries || [];
  const doctorVouchers = doctorVouchersRes.data || [];
  const hmoAr = hmoArRes.data || {
    overallTotal: 0,
    overallPending: 0,
    overallSettled: 0,
    overallAging: { current: 0, thirtyToOne: 0, sixtyToOne: 0, ninetyPlus: 0, total: 0 },
    providers: [],
    claims: [],
  };

  return (
    <AccountingDashboardClient
      clinicUid={clinicUid}
      initialCurrentShift={currentShift}
      initialShiftHistory={shiftHistory}
      initialDoctorSummaries={doctorSummaries}
      initialDoctorVouchers={doctorVouchers}
      initialHmoAr={hmoAr}
      billingSetting={billingSetting}
    />
  );
}
