import type { Metadata } from "next";
import Link from "next/link";
import { Calculator, Settings, ArrowRight, DollarSign, Users, FileSpreadsheet, ShieldAlert } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getClinicBillingSettingAction } from "@/actions/clinics/clinic-billing-setting.action";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Accounting & Reports",
  description: "Financial Sub-Ledger, Cashier Shifts, and Doctor PF Liquidation",
};

interface AccountingPageProps {
  params: Promise<{ clinicUid: string }>;
}

export default async function AccountingPage({ params }: AccountingPageProps) {
  const { clinicUid } = await params;

  const billingSettingRes = await getClinicBillingSettingAction(clinicUid);
  const billingSetting = billingSettingRes.data;

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Calculator className="h-6 w-6 text-primary" />
            Accounting & Practice Sub-Ledger
          </h1>
          <p className="text-sm text-muted-foreground">
            Cashier shift reconciliation, doctor professional fee payouts, and Philippine BIR tax books.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button asChild variant="outline" size="sm" className="gap-1.5">
            <Link href={`/v2/clinic/${clinicUid}/settings?tab=billing`}>
              <Settings className="h-4 w-4" />
              Billing Rules & Tax Setup
            </Link>
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="text-xs uppercase tracking-wider font-semibold">
              Today's Collections
            </CardDescription>
            <CardTitle className="text-xl flex items-center justify-between">
              <span>₱0.00</span>
              <DollarSign className="h-4 w-4 text-emerald-600" />
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">
            Cash, E-Wallets & Card gross settlements
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="text-xs uppercase tracking-wider font-semibold">
              Cash Drawer Float
            </CardDescription>
            <CardTitle className="text-xl flex items-center justify-between">
              <span>Shift Closed</span>
              <Badge variant="outline">No Active Shift</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">
            Open shift to begin drawer tracking
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="text-xs uppercase tracking-wider font-semibold">
              Doctor PF Accrued
            </CardDescription>
            <CardTitle className="text-xl flex items-center justify-between">
              <span>₱0.00</span>
              <Users className="h-4 w-4 text-primary" />
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">
            Unliquidated professional fee balances
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="text-xs uppercase tracking-wider font-semibold">
              Outstanding HMO AR
            </CardDescription>
            <CardTitle className="text-xl flex items-center justify-between">
              <span>₱0.00</span>
              <ShieldAlert className="h-4 w-4 text-amber-600" />
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">
            Pending insurer reimbursements
          </CardContent>
        </Card>
      </div>

      {/* Sub-Ledger Center */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5 text-primary" />
            Practice Financial Operations
          </CardTitle>
          <CardDescription>
            Operational sub-ledger modules ready for daily cashier and accountant use.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            <div className="p-4 border rounded-lg bg-card hover:bg-muted/30 transition-all space-y-2">
              <div className="font-semibold text-sm flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-emerald-600" />
                Cashier Shift Reconciliation
              </div>
              <p className="text-xs text-muted-foreground">
                Manage opening float, continuous shift audit trails, closing cash counts, and variance (X/Z-Reading) logs.
              </p>
            </div>

            <div className="p-4 border rounded-lg bg-card hover:bg-muted/30 transition-all space-y-2">
              <div className="font-semibold text-sm flex items-center gap-2">
                <Users className="h-4 w-4 text-primary" />
                Doctor PF Liquidation
              </div>
              <p className="text-xs text-muted-foreground">
                Track revenue splits (e.g. 70/30), Expanded Withholding Tax (EWT), and settle payouts with simple 1-click vouchers.
              </p>
            </div>

            <div className="p-4 border rounded-lg bg-card hover:bg-muted/30 transition-all space-y-2">
              <div className="font-semibold text-sm flex items-center gap-2">
                <FileSpreadsheet className="h-4 w-4 text-blue-600" />
                BIR Books & General Ledger Export
              </div>
              <p className="text-xs text-muted-foreground">
                Export compliant BIR Sales Books, Cash Receipts Books, and journal CSVs ready for Xero and QuickBooks import.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
