import type { Metadata } from "next";
import Link from "next/link";
import { CreditCard, Settings, Tag, Receipt, ArrowRight, Clock, UserCheck } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getClinicBillingSettingAction } from "@/actions/clinics/clinic-billing-setting.action";
import { getClinicPriceItemsAction } from "@/actions/clinics/clinic-price-item.action";

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

  const [billingSettingRes, priceItemsRes] = await Promise.all([
    getClinicBillingSettingAction(clinicUid),
    getClinicPriceItemsAction(clinicUid),
  ]);

  const billingSetting = billingSettingRes.data;
  const priceItemCount = priceItemsRes.data?.length ?? 0;

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <CreditCard className="h-6 w-6 text-primary" />
            Billing & Cashier POS
          </h1>
          <p className="text-sm text-muted-foreground">
            Patient invoice checkout, official receipts, and payment settlements.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button asChild variant="outline" size="sm" className="gap-1.5">
            <Link href={`/v2/clinic/${clinicUid}/settings?tab=billing`}>
              <Settings className="h-4 w-4" />
              Configure Billing & Prices
            </Link>
          </Button>
        </div>
      </div>

      {/* Status Banner */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs uppercase tracking-wider font-semibold">
              Operational Status
            </CardDescription>
            <CardTitle className="text-xl flex items-center justify-between">
              <span>{billingSetting?.billingMode ?? "COMMERCIAL"}</span>
              <Badge variant="default">Active</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">
            {billingSetting?.registeredBusinessName || "Clinic"} • Series: {billingSetting?.invoicePrefix ?? "INV-"}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="text-xs uppercase tracking-wider font-semibold">
              Catalog Items
            </CardDescription>
            <CardTitle className="text-xl flex items-center justify-between">
              <span>{priceItemCount} Items</span>
              <Tag className="h-4 w-4 text-muted-foreground" />
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">
            {priceItemCount === 0 ? (
              <span className="text-amber-600 font-medium">Catalog empty — please seed or add prices</span>
            ) : (
              "Consultations, labs & imaging ready for checkout"
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="text-xs uppercase tracking-wider font-semibold">
              PH Tax Compliance
            </CardDescription>
            <CardTitle className="text-xl flex items-center justify-between">
              <span>{billingSetting?.isVatRegistered ? "12% VAT" : "Non-VAT"}</span>
              <Receipt className="h-4 w-4 text-muted-foreground" />
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">
            TIN: {billingSetting?.tinNumber || "Not configured"} • EOPT Act Compliant
          </CardContent>
        </Card>
      </div>

      {/* Checkout Counter Workspace (Phase 2 Ready) */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary" />
                Pending Billing & Checkout Queue
              </CardTitle>
              <CardDescription>
                Patients with completed consultations or diagnostic orders waiting for payment settlement.
              </CardDescription>
            </div>
            <Badge variant="secondary" className="gap-1">
              <UserCheck className="h-3 w-3" />
              0 in Queue
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="py-16 text-center text-muted-foreground space-y-3 border rounded-lg border-dashed bg-muted/20">
            <Receipt className="h-10 w-10 mx-auto text-muted-foreground/40" />
            <p className="font-semibold text-sm">No Pending Patient Encounters for Checkout</p>
            <p className="text-xs max-w-md mx-auto text-muted-foreground">
              When doctors complete consultations or order laboratory and imaging procedures, they will automatically appear here for itemized invoicing and official receipt generation.
            </p>
            <div className="pt-2">
              <Button asChild size="sm" variant="outline" className="gap-1.5">
                <Link href={`/v2/clinic/${clinicUid}/settings?tab=billing`}>
                  Manage Price Catalog
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
