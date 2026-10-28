"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  Calculator,
  DollarSign,
  Users,
  ShieldAlert,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Plus,
  Printer,
  Calendar,
  Wallet,
  CreditCard,
  Building,
  ArrowRight,
  TrendingDown,
  TrendingUp,
  FileText,
  BadgeCheck,
  Settings,
  Download,
  FileSpreadsheet,
  Database,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  openCashierShiftAction,
  closeCashierShiftAction,
  getCurrentShiftAction,
  getShiftHistoryAction,
} from "@/actions/accounting/cashier-shift.action";
import {
  generateDoctorPayoutVoucherAction,
  markDoctorVoucherPaidAction,
  getDoctorPayoutVouchersAction,
  getUnliquidatedDoctorFeesAction,
  getDoctorVoucherDetailAction,
  type UnliquidatedDoctorSummary,
} from "@/actions/accounting/doctor-payout.action";
import {
  updateHmoClaimStatusAction,
  settleHmoClaimAction,
  getHmoArSummaryAction,
} from "@/actions/accounting/hmo-receivables.action";
import {
  getBirSalesBookAction,
  getBirCashReceiptsBookAction,
  getGeneralJournalExportAction,
  updateClinicChartOfAccountsAction,
} from "@/actions/accounting/export.action";
import { DoctorPayoutVoucherPrint } from "./DoctorPayoutVoucherPrint";

interface AccountingDashboardClientProps {
  clinicUid: string;
  initialCurrentShift: any;
  initialShiftHistory: any[];
  initialDoctorSummaries: UnliquidatedDoctorSummary[];
  initialDoctorVouchers: any[];
  initialHmoAr: any;
  billingSetting: any;
  initialChartOfAccounts?: any;
}

export function AccountingDashboardClient({
  clinicUid,
  initialCurrentShift,
  initialShiftHistory,
  initialDoctorSummaries,
  initialDoctorVouchers,
  initialHmoAr,
  billingSetting,
  initialChartOfAccounts,
}: AccountingDashboardClientProps) {
  const [isPending, startTransition] = useTransition();

  // State: Current Shift & History
  const [currentShift, setCurrentShift] = useState(initialCurrentShift);
  const [shiftHistory, setShiftHistory] = useState(initialShiftHistory);

  // State: Doctor PF
  const [doctorSummaries, setDoctorSummaries] = useState(initialDoctorSummaries);
  const [doctorVouchers, setDoctorVouchers] = useState(initialDoctorVouchers);

  // State: HMO AR
  const [hmoAr, setHmoAr] = useState(initialHmoAr);

  // Active Voucher View for Printing
  const [selectedVoucherForPrint, setSelectedVoucherForPrint] = useState<any | null>(null);

  // Dialog States: Shift Drawer
  const [isOpenShiftDialogOpen, setIsOpenShiftDialogOpen] = useState(false);
  const [openingFloatInput, setOpeningFloatInput] = useState("1000.00");
  const [openShiftNotes, setOpenShiftNotes] = useState("");

  const [isCloseShiftDialogOpen, setIsCloseShiftDialogOpen] = useState(false);
  const [actualCashCountInput, setActualCashCountInput] = useState("");
  const [closeShiftNotes, setCloseShiftNotes] = useState("");

  // Dialog States: Doctor Voucher
  const [isGenVoucherDialogOpen, setIsGenVoucherDialogOpen] = useState(false);
  const [selectedDoctorForVoucher, setSelectedDoctorForVoucher] =
    useState<UnliquidatedDoctorSummary | null>(null);
  const [taxRateInput, setTaxRateInput] = useState("10.0");
  const [facilityDeductionInput, setFacilityDeductionInput] = useState("0.00");

  const [isMarkPaidDialogOpen, setIsMarkPaidDialogOpen] = useState(false);
  const [selectedVoucherForPay, setSelectedVoucherForPay] = useState<any | null>(null);
  const [paymentRefInput, setPaymentRefInput] = useState("");

  // Dialog States: HMO Claim Settlement
  const [isSettleClaimDialogOpen, setIsSettleClaimDialogOpen] = useState(false);
  const [selectedClaimForSettle, setSelectedClaimForSettle] = useState<any | null>(null);
  const [claimSettledAmtInput, setClaimSettledAmtInput] = useState("");
  const [claimDeductionInput, setClaimDeductionInput] = useState("0.00");
  const [claimCheckRefInput, setClaimCheckRefInput] = useState("");

  // State: Chart of Accounts & Compliance Exports
  const [coa, setCoa] = useState(initialChartOfAccounts || {});
  const now = new Date();
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0];
  const todayStr = now.toISOString().split("T")[0];
  const [exportStartDate, setExportStartDate] = useState(firstDayOfMonth);
  const [exportEndDate, setExportEndDate] = useState(todayStr);

  const [coaForm, setCoaForm] = useState({
    cashAccountCode: initialChartOfAccounts?.cashAccountCode || "1010",
    eWalletAccountCode: initialChartOfAccounts?.eWalletAccountCode || "1020",
    bankAccountCode: initialChartOfAccounts?.bankAccountCode || "1030",
    hmoReceivableAccountCode: initialChartOfAccounts?.hmoReceivableAccountCode || "1100",
    consultationRevenueCode: initialChartOfAccounts?.consultationRevenueCode || "4010",
    labRevenueCode: initialChartOfAccounts?.labRevenueCode || "4020",
    imagingRevenueCode: initialChartOfAccounts?.imagingRevenueCode || "4030",
    pharmacyRevenueCode: initialChartOfAccounts?.pharmacyRevenueCode || "4040",
    vatPayableAccountCode: initialChartOfAccounts?.vatPayableAccountCode || "2100",
    doctorPfPayableCode: initialChartOfAccounts?.doctorPfPayableCode || "2200",
    withholdingTaxCode: initialChartOfAccounts?.withholdingTaxCode || "2300",
  });

  // Browser file download helper
  const triggerDownload = (csvContent: string, filename: string) => {
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleExportBirSalesBook = () => {
    startTransition(async () => {
      const res = await getBirSalesBookAction(clinicUid, exportStartDate, exportEndDate);
      if (res.status && res.data) {
        triggerDownload(res.data.csvString, res.data.filename);
        toast.success(`Downloaded BIR Sales Book (${res.data.invoiceCount} records)`);
      } else {
        toast.error(res.message);
      }
    });
  };

  const handleExportBirCashReceipts = () => {
    startTransition(async () => {
      const res = await getBirCashReceiptsBookAction(clinicUid, exportStartDate, exportEndDate);
      if (res.status && res.data) {
        triggerDownload(res.data.csvString, res.data.filename);
        toast.success(`Downloaded BIR Cash Receipts Book (${res.data.receiptCount} records)`);
      } else {
        toast.error(res.message);
      }
    });
  };

  const handleExportGeneralJournal = (format: "XERO" | "QUICKBOOKS" | "GENERIC") => {
    startTransition(async () => {
      const res = await getGeneralJournalExportAction(
        clinicUid,
        format,
        exportStartDate,
        exportEndDate
      );
      if (res.status && res.data) {
        triggerDownload(res.data.csvString, res.data.filename);
        toast.success(`Exported ${format} General Journal CSV`);
      } else {
        toast.error(res.message);
      }
    });
  };

  const handleSaveCoa = () => {
    startTransition(async () => {
      const res = await updateClinicChartOfAccountsAction(clinicUid, coaForm);
      if (res.status) {
        toast.success(res.message);
        setCoa(res.data);
      } else {
        toast.error(res.message);
      }
    });
  };

  // Refresh Shift Data
  const refreshShiftData = async () => {
    const shiftRes = await getCurrentShiftAction(clinicUid);
    if (shiftRes.status) setCurrentShift(shiftRes.data);
    const historyRes = await getShiftHistoryAction(clinicUid, 30);
    if (historyRes.status) setShiftHistory(historyRes.data);
  };

  // Refresh Doctor PF Data
  const refreshDoctorData = async () => {
    const sumRes = await getUnliquidatedDoctorFeesAction(clinicUid);
    if (sumRes.status) setDoctorSummaries(sumRes.data.summaries);
    const vouchRes = await getDoctorPayoutVouchersAction(clinicUid);
    if (vouchRes.status) setDoctorVouchers(vouchRes.data);
  };

  // Refresh HMO AR Data
  const refreshHmoData = async () => {
    const res = await getHmoArSummaryAction(clinicUid);
    if (res.status) setHmoAr(res.data);
  };

  // Handlers: Shift
  const handleOpenShift = () => {
    const floatNum = parseFloat(openingFloatInput);
    if (isNaN(floatNum) || floatNum < 0) {
      toast.error("Please enter a valid non-negative float amount.");
      return;
    }

    startTransition(async () => {
      const res = await openCashierShiftAction(clinicUid, floatNum, openShiftNotes);
      if (res.status) {
        toast.success(res.message);
        setIsOpenShiftDialogOpen(false);
        setOpenShiftNotes("");
        await refreshShiftData();
      } else {
        toast.error(res.message);
      }
    });
  };

  const handleCloseShift = () => {
    if (!currentShift) return;
    const actualCashNum = parseFloat(actualCashCountInput);
    if (isNaN(actualCashNum) || actualCashNum < 0) {
      toast.error("Please enter a valid actual cash count.");
      return;
    }

    startTransition(async () => {
      const res = await closeCashierShiftAction(
        currentShift.id,
        actualCashNum,
        closeShiftNotes
      );
      if (res.status) {
        toast.success(res.message);
        setIsCloseShiftDialogOpen(false);
        setActualCashCountInput("");
        setCloseShiftNotes("");
        await refreshShiftData();
      } else {
        toast.error(res.message);
      }
    });
  };

  // Handlers: Doctor Payout
  const handleGenerateVoucher = () => {
    if (!selectedDoctorForVoucher) return;
    const taxRate = parseFloat(taxRateInput) || 10.0;
    const facilityFee = parseFloat(facilityDeductionInput) || 0.0;

    startTransition(async () => {
      const res = await generateDoctorPayoutVoucherAction({
        clinicUid,
        doctorId: selectedDoctorForVoucher.doctorId,
        withholdingTaxRate: taxRate,
        facilityFeeDeduction: facilityFee,
      });

      if (res.status) {
        toast.success(res.message);
        setIsGenVoucherDialogOpen(false);
        await refreshDoctorData();
      } else {
        toast.error(res.message);
      }
    });
  };

  const handleMarkVoucherPaid = () => {
    if (!selectedVoucherForPay) return;
    if (!paymentRefInput.trim()) {
      toast.error("Please provide a check number, bank EFT, or payment reference.");
      return;
    }

    startTransition(async () => {
      const res = await markDoctorVoucherPaidAction(
        selectedVoucherForPay.id,
        paymentRefInput
      );

      if (res.status) {
        toast.success(res.message);
        setIsMarkPaidDialogOpen(false);
        setPaymentRefInput("");
        await refreshDoctorData();
      } else {
        toast.error(res.message);
      }
    });
  };

  const handleViewVoucherPrint = async (voucherId: number) => {
    startTransition(async () => {
      const res = await getDoctorVoucherDetailAction(voucherId);
      if (res.status && res.data) {
        setSelectedVoucherForPrint(res.data);
      } else {
        toast.error("Could not fetch voucher details for printing.");
      }
    });
  };

  // Handlers: HMO
  const handleUpdateClaimStatus = (claimId: number, status: any) => {
    startTransition(async () => {
      const res = await updateHmoClaimStatusAction(claimId, status);
      if (res.status) {
        toast.success(res.message);
        await refreshHmoData();
      } else {
        toast.error(res.message);
      }
    });
  };

  const handleSettleClaim = () => {
    if (!selectedClaimForSettle) return;
    const settled = parseFloat(claimSettledAmtInput);
    if (isNaN(settled) || settled <= 0) {
      toast.error("Please enter a valid settled amount.");
      return;
    }

    const deduction = parseFloat(claimDeductionInput) || 0;

    startTransition(async () => {
      const res = await settleHmoClaimAction({
        claimId: selectedClaimForSettle.id,
        settledAmount: settled,
        deductionAmount: deduction,
        checkNumber: claimCheckRefInput,
      });

      if (res.status) {
        toast.success(res.message);
        setIsSettleClaimDialogOpen(false);
        setClaimSettledAmtInput("");
        setClaimDeductionInput("0.00");
        setClaimCheckRefInput("");
        await refreshHmoData();
      } else {
        toast.error(res.message);
      }
    });
  };

  // If in Print View mode
  if (selectedVoucherForPrint) {
    return (
      <div className="p-6">
        <DoctorPayoutVoucherPrint
          voucher={selectedVoucherForPrint}
          onBack={() => setSelectedVoucherForPrint(null)}
        />
      </div>
    );
  }

  // Live calculations for shift reconciliation dialog
  const expectedCashInDrawer = currentShift ? Number(currentShift.expectedCashInDrawer) : 0;
  const countedCash = parseFloat(actualCashCountInput) || 0;
  const variance = countedCash - expectedCashInDrawer;

  // Live calculations for voucher generation dialog
  const doctorGrossPf = selectedDoctorForVoucher ? selectedDoctorForVoucher.grossPfAmount : 0;
  const dialogTaxRate = parseFloat(taxRateInput) || 0;
  const dialogFacilityDeduction = parseFloat(facilityDeductionInput) || 0;
  const dialogTaxAmt = (doctorGrossPf * dialogTaxRate) / 100;
  const dialogNetPayout = Math.max(0, doctorGrossPf - dialogFacilityDeduction - dialogTaxAmt);

  // Aggregated KPI Stats
  const totalUnliquidatedPf = doctorSummaries.reduce(
    (sum, d) => sum + Number(d.grossPfAmount),
    0
  );
  const totalOutstandingHmo = Number(hmoAr?.overallPending ?? 0);
  const shiftCashSales = currentShift ? Number(currentShift.cashCollections) : 0;
  const shiftTotalSales = currentShift ? Number(currentShift.totalSales) : 0;

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Calculator className="h-6 w-6 text-primary" />
            Commercial Practice Sub-Ledger
          </h1>
          <p className="text-sm text-muted-foreground">
            Cashier shift reconciliation, doctor professional fee payouts, and HMO accounts receivable aging.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button asChild variant="outline" size="sm" className="gap-1.5">
            <Link href={`/v2/clinic/${clinicUid}/billing`}>
              <CreditCard className="h-4 w-4" />
              Cashier POS Counter
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm" className="gap-1.5">
            <Link href={`/v2/clinic/${clinicUid}/settings?tab=billing`}>
              <Settings className="h-4 w-4" />
              Settings
            </Link>
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Drawer Status */}
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="text-xs uppercase tracking-wider font-semibold">
              Cash Drawer Float
            </CardDescription>
            <CardTitle className="text-xl flex items-center justify-between">
              <span>
                {currentShift
                  ? `₱${Number(currentShift.openingFloat).toFixed(2)}`
                  : "Closed"}
              </span>
              <Badge variant={currentShift ? "default" : "secondary"}>
                {currentShift ? "Drawer OPEN" : "No Shift"}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">
            {currentShift ? (
              <span className="text-emerald-600 font-medium">
                Cashier: {currentShift.Cashier?.firstName} {currentShift.Cashier?.lastName}
              </span>
            ) : (
              "Open shift to track drawer cash"
            )}
          </CardContent>
        </Card>

        {/* Shift / Today's Collections */}
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="text-xs uppercase tracking-wider font-semibold">
              Active Shift Sales
            </CardDescription>
            <CardTitle className="text-xl flex items-center justify-between">
              <span>₱{shiftTotalSales.toFixed(2)}</span>
              <DollarSign className="h-4 w-4 text-emerald-600" />
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">
            Cash: ₱{shiftCashSales.toFixed(2)} • {currentShift?.paymentCount ?? 0} receipt(s)
          </CardContent>
        </Card>

        {/* Doctor PF Accrued */}
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="text-xs uppercase tracking-wider font-semibold">
              Doctor PF Accrued
            </CardDescription>
            <CardTitle className="text-xl flex items-center justify-between">
              <span>₱{totalUnliquidatedPf.toFixed(2)}</span>
              <Users className="h-4 w-4 text-primary" />
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">
            {doctorSummaries.length} physician(s) pending payout
          </CardContent>
        </Card>

        {/* HMO AR Outstanding */}
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="text-xs uppercase tracking-wider font-semibold">
              HMO Receivables (AR)
            </CardDescription>
            <CardTitle className="text-xl flex items-center justify-between">
              <span>₱{totalOutstandingHmo.toFixed(2)}</span>
              <ShieldAlert className="h-4 w-4 text-amber-600" />
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">
            {hmoAr?.claims?.length ?? 0} insurance claim(s) tracked
          </CardContent>
        </Card>
      </div>

      {/* Main Tabs */}
      <Tabs defaultValue="shifts" className="space-y-4">
        <TabsList className="grid grid-cols-4 w-full max-w-2xl">
          <TabsTrigger value="shifts" className="gap-2">
            <Wallet className="h-4 w-4" />
            Cashier Shifts
          </TabsTrigger>
          <TabsTrigger value="doctor-pf" className="gap-2">
            <Users className="h-4 w-4" />
            Doctor PF Payouts
          </TabsTrigger>
          <TabsTrigger value="hmo-ar" className="gap-2">
            <ShieldAlert className="h-4 w-4" />
            HMO Aging (AR)
          </TabsTrigger>
          <TabsTrigger value="compliance" className="gap-2">
            <FileSpreadsheet className="h-4 w-4" />
            BIR Books & GL Sync
          </TabsTrigger>
        </TabsList>

        {/* TAB 1: CASHIER SHIFTS */}
        <TabsContent value="shifts" className="space-y-4">
          {/* Active Shift Card */}
          {currentShift ? (
            <Card className="border-primary/40 bg-gradient-to-r from-primary/5 via-background to-background">
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <Badge className="bg-emerald-600">SHIFT IN PROGRESS</Badge>
                    <span className="text-xs text-muted-foreground">
                      Opened{" "}
                      {new Date(currentShift.openedAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                  <CardTitle className="text-lg mt-1">
                    Cashier: {currentShift.Cashier?.firstName} {currentShift.Cashier?.lastName}
                  </CardTitle>
                </div>

                <Button
                  variant="destructive"
                  onClick={() => {
                    setActualCashCountInput(
                      Number(currentShift.expectedCashInDrawer).toFixed(2)
                    );
                    setIsCloseShiftDialogOpen(true);
                  }}
                  className="gap-2"
                >
                  <Clock className="h-4 w-4" />
                  Close Shift & Count Cash
                </Button>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3 pt-2 text-xs">
                  <div className="p-2.5 bg-card rounded-md border">
                    <span className="text-muted-foreground block">Opening Float</span>
                    <span className="text-sm font-bold font-mono">
                      ₱{Number(currentShift.openingFloat).toFixed(2)}
                    </span>
                  </div>

                  <div className="p-2.5 bg-card rounded-md border">
                    <span className="text-muted-foreground block">Cash Collected</span>
                    <span className="text-sm font-bold font-mono text-emerald-600">
                      ₱{Number(currentShift.cashCollections).toFixed(2)}
                    </span>
                  </div>

                  <div className="p-2.5 bg-card rounded-md border">
                    <span className="text-muted-foreground block">GCash / Maya</span>
                    <span className="text-sm font-bold font-mono text-blue-600">
                      ₱
                      {(
                        Number(currentShift.gcashCollections) +
                        Number(currentShift.mayaCollections)
                      ).toFixed(2)}
                    </span>
                  </div>

                  <div className="p-2.5 bg-card rounded-md border">
                    <span className="text-muted-foreground block">Card / Others</span>
                    <span className="text-sm font-bold font-mono">
                      ₱
                      {(
                        Number(currentShift.cardCollections) +
                        Number(currentShift.otherCollections)
                      ).toFixed(2)}
                    </span>
                  </div>

                  <div className="p-2.5 bg-primary/10 rounded-md border border-primary/30">
                    <span className="text-muted-foreground block font-semibold">
                      Expected in Drawer
                    </span>
                    <span className="text-sm font-bold font-mono text-primary">
                      ₱{Number(currentShift.expectedCashInDrawer).toFixed(2)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-8 text-center space-y-3">
                <div className="p-3 bg-muted rounded-full">
                  <Wallet className="h-6 w-6 text-muted-foreground" />
                </div>
                <div className="space-y-1">
                  <h3 className="font-semibold text-base">No Open Cashier Shift</h3>
                  <p className="text-xs text-muted-foreground max-w-sm">
                    Open a shift drawer to track your opening float, cash sales, and verify closing cash counts.
                  </p>
                </div>
                <Button onClick={() => setIsOpenShiftDialogOpen(true)} className="gap-2">
                  <Plus className="h-4 w-4" />
                  Open Cashier Shift Drawer
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Shift History Table */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Shift Reconciliation History</CardTitle>
              <CardDescription className="text-xs">
                Audited shift logs, cash drawer reconciliation, and overage/shortage records.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="border rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Status</TableHead>
                      <TableHead>Cashier</TableHead>
                      <TableHead>Opened At</TableHead>
                      <TableHead>Closed At</TableHead>
                      <TableHead className="text-right">Opening Float</TableHead>
                      <TableHead className="text-right">Expected Cash</TableHead>
                      <TableHead className="text-right">Actual Count</TableHead>
                      <TableHead className="text-right">Variance</TableHead>
                      <TableHead>Notes</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {shiftHistory.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={9} className="text-center py-6 text-muted-foreground text-xs">
                          No past shift records found.
                        </TableCell>
                      </TableRow>
                    ) : (
                      shiftHistory.map((shift: any) => {
                        const shiftVariance = Number(shift.cashVariance ?? 0);
                        return (
                          <TableRow key={shift.id}>
                            <TableCell>
                              <Badge
                                variant={shift.status === "OPEN" ? "default" : "outline"}
                                className={shift.status === "OPEN" ? "bg-emerald-600" : ""}
                              >
                                {shift.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="font-medium text-xs">
                              {shift.Cashier?.firstName} {shift.Cashier?.lastName}
                            </TableCell>
                            <TableCell className="text-xs text-muted-foreground">
                              {new Date(shift.openedAt).toLocaleString("en-PH", {
                                month: "short",
                                day: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </TableCell>
                            <TableCell className="text-xs text-muted-foreground">
                              {shift.closedAt
                                ? new Date(shift.closedAt).toLocaleString("en-PH", {
                                    month: "short",
                                    day: "numeric",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })
                                : "-"}
                            </TableCell>
                            <TableCell className="text-right font-mono text-xs">
                              ₱{Number(shift.openingFloat).toFixed(2)}
                            </TableCell>
                            <TableCell className="text-right font-mono text-xs">
                              {shift.expectedCash !== null
                                ? `₱${Number(shift.expectedCash).toFixed(2)}`
                                : "-"}
                            </TableCell>
                            <TableCell className="text-right font-mono text-xs">
                              {shift.actualCash !== null
                                ? `₱${Number(shift.actualCash).toFixed(2)}`
                                : "-"}
                            </TableCell>
                            <TableCell className="text-right font-mono text-xs font-semibold">
                              {shift.cashVariance !== null ? (
                                shiftVariance === 0 ? (
                                  <span className="text-emerald-600">₱0.00 (Balanced)</span>
                                ) : shiftVariance > 0 ? (
                                  <span className="text-emerald-600">
                                    +₱{shiftVariance.toFixed(2)} (Over)
                                  </span>
                                ) : (
                                  <span className="text-red-600">
                                    -₱{Math.abs(shiftVariance).toFixed(2)} (Short)
                                  </span>
                                )
                              ) : (
                                "-"
                              )}
                            </TableCell>
                            <TableCell className="text-xs text-muted-foreground max-w-xs truncate">
                              {shift.notes || "-"}
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 2: DOCTOR PF LIQUIDATION */}
        <TabsContent value="doctor-pf" className="space-y-4">
          {/* Unliquidated Doctors Card */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Users className="h-4 w-4 text-primary" />
                Unliquidated Professional Fees (Accrued)
              </CardTitle>
              <CardDescription className="text-xs">
                Services and consultations delivered by doctors on settled invoices that have not yet been disbursed.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="border rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Physician</TableHead>
                      <TableHead className="text-center">Paid Encounters</TableHead>
                      <TableHead className="text-right">Gross Service Sales</TableHead>
                      <TableHead className="text-right">Doctor PF Accrued</TableHead>
                      <TableHead>Earliest Unpaid</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {doctorSummaries.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-6 text-muted-foreground text-xs">
                          All professional fees are currently liquidated! No pending balances.
                        </TableCell>
                      </TableRow>
                    ) : (
                      doctorSummaries.map((summary) => (
                        <TableRow key={summary.doctorId}>
                          <TableCell className="font-semibold text-xs text-slate-900">
                            {summary.doctorName}
                          </TableCell>
                          <TableCell className="text-center text-xs">
                            <Badge variant="outline">{summary.itemCount} items</Badge>
                          </TableCell>
                          <TableCell className="text-right font-mono text-xs text-muted-foreground">
                            ₱{Number(summary.grossServiceAmount).toFixed(2)}
                          </TableCell>
                          <TableCell className="text-right font-mono text-xs font-bold text-primary">
                            ₱{Number(summary.grossPfAmount).toFixed(2)}
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {new Date(summary.oldestDate).toLocaleDateString("en-PH", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              size="sm"
                              onClick={() => {
                                setSelectedDoctorForVoucher(summary);
                                setTaxRateInput("10.0");
                                setFacilityDeductionInput("0.00");
                                setIsGenVoucherDialogOpen(true);
                              }}
                              className="gap-1.5 h-8 text-xs"
                            >
                              <FileText className="h-3.5 w-3.5" />
                              Generate Voucher
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* Payout Vouchers Table */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Doctor Payout Vouchers History</CardTitle>
              <CardDescription className="text-xs">
                Generated disbursement slips with Expanded Withholding Tax (EWT) deductions.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="border rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Voucher #</TableHead>
                      <TableHead>Physician</TableHead>
                      <TableHead>Issued Date</TableHead>
                      <TableHead className="text-right">Gross PF</TableHead>
                      <TableHead className="text-right">EWT Withheld</TableHead>
                      <TableHead className="text-right">Net Payable</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Payment Ref</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {doctorVouchers.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={9} className="text-center py-6 text-muted-foreground text-xs">
                          No doctor payout vouchers created yet.
                        </TableCell>
                      </TableRow>
                    ) : (
                      doctorVouchers.map((voucher: any) => (
                        <TableRow key={voucher.id}>
                          <TableCell className="font-mono text-xs font-bold">
                            {voucher.voucherNumber}
                          </TableCell>
                          <TableCell className="text-xs font-medium">
                            Dr. {voucher.Doctor?.firstName} {voucher.Doctor?.lastName}
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {new Date(voucher.generatedAt || voucher.createdAt).toLocaleDateString(
                              "en-PH",
                              { month: "short", day: "numeric", year: "numeric" }
                            )}
                          </TableCell>
                          <TableCell className="text-right font-mono text-xs">
                            ₱{Number(voucher.grossPfAmount).toFixed(2)}
                          </TableCell>
                          <TableCell className="text-right font-mono text-xs text-red-600">
                            -₱{Number(voucher.withholdingTaxAmount).toFixed(2)}
                          </TableCell>
                          <TableCell className="text-right font-mono text-xs font-bold text-primary">
                            ₱{Number(voucher.netPayoutAmount).toFixed(2)}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={voucher.status === "PAID" ? "default" : "secondary"}
                              className={voucher.status === "PAID" ? "bg-emerald-600" : ""}
                            >
                              {voucher.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-xs font-mono text-muted-foreground">
                            {voucher.paymentReference || "-"}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {voucher.status === "UNPAID" && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedVoucherForPay(voucher);
                                    setPaymentRefInput("");
                                    setIsMarkPaidDialogOpen(true);
                                  }}
                                  className="h-7 text-xs gap-1 text-emerald-700 border-emerald-300 hover:bg-emerald-50"
                                >
                                  <BadgeCheck className="h-3 w-3" />
                                  Mark Paid
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleViewVoucherPrint(voucher.id)}
                                className="h-7 text-xs gap-1"
                              >
                                <Printer className="h-3 w-3" />
                                Print Slip
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 3: HMO RECEIVABLES & AGING */}
        <TabsContent value="hmo-ar" className="space-y-4">
          {/* Aging Buckets Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Card className="border-l-4 border-l-emerald-500">
              <CardHeader className="p-3 pb-1">
                <CardDescription className="text-[11px] uppercase tracking-wider font-semibold">
                  Current (0-30 Days)
                </CardDescription>
                <CardTitle className="text-lg font-mono">
                  ₱{Number(hmoAr?.overallAging?.current ?? 0).toFixed(2)}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3 pt-0 text-[11px] text-muted-foreground">
                Active insurer billing window
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-blue-500">
              <CardHeader className="p-3 pb-1">
                <CardDescription className="text-[11px] uppercase tracking-wider font-semibold">
                  31 - 60 Days
                </CardDescription>
                <CardTitle className="text-lg font-mono">
                  ₱{Number(hmoAr?.overallAging?.thirtyToOne ?? 0).toFixed(2)}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3 pt-0 text-[11px] text-muted-foreground">
                Follow-up with HMO liaison
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-amber-500">
              <CardHeader className="p-3 pb-1">
                <CardDescription className="text-[11px] uppercase tracking-wider font-semibold">
                  61 - 90 Days
                </CardDescription>
                <CardTitle className="text-lg font-mono text-amber-700">
                  ₱{Number(hmoAr?.overallAging?.sixtyToOne ?? 0).toFixed(2)}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3 pt-0 text-[11px] text-muted-foreground">
                Overdue reimbursement
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-rose-500">
              <CardHeader className="p-3 pb-1">
                <CardDescription className="text-[11px] uppercase tracking-wider font-semibold">
                  90+ Days (Critical)
                </CardDescription>
                <CardTitle className="text-lg font-mono text-rose-700">
                  ₱{Number(hmoAr?.overallAging?.ninetyPlus ?? 0).toFixed(2)}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3 pt-0 text-[11px] text-muted-foreground">
                Escalation required
              </CardContent>
            </Card>
          </div>

          {/* Providers Aging Breakdown */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">HMO Providers Portfolio</CardTitle>
              <CardDescription className="text-xs">
                Total outstanding claim amounts by insurance / HMO company.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="border rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>HMO Provider</TableHead>
                      <TableHead className="text-center">Claims</TableHead>
                      <TableHead className="text-right">Total Claimed</TableHead>
                      <TableHead className="text-right">Settled Amount</TableHead>
                      <TableHead className="text-right">Pending Balance</TableHead>
                      <TableHead className="text-right">0-30 Days</TableHead>
                      <TableHead className="text-right">31-60 Days</TableHead>
                      <TableHead className="text-right">61+ Days</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(hmoAr?.providers ?? []).length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-6 text-muted-foreground text-xs">
                          No HMO claims registered yet.
                        </TableCell>
                      </TableRow>
                    ) : (
                      hmoAr.providers.map((p: any) => (
                        <TableRow key={p.providerName}>
                          <TableCell className="font-semibold text-xs">
                            {p.providerName}
                          </TableCell>
                          <TableCell className="text-center text-xs">
                            <Badge variant="outline">{p.claimCount}</Badge>
                          </TableCell>
                          <TableCell className="text-right font-mono text-xs">
                            ₱{Number(p.totalClaimAmount).toFixed(2)}
                          </TableCell>
                          <TableCell className="text-right font-mono text-xs text-emerald-600">
                            ₱{Number(p.settledAmount).toFixed(2)}
                          </TableCell>
                          <TableCell className="text-right font-mono text-xs font-bold text-amber-700">
                            ₱{Number(p.pendingBalance).toFixed(2)}
                          </TableCell>
                          <TableCell className="text-right font-mono text-xs">
                            ₱{Number(p.aging.current).toFixed(2)}
                          </TableCell>
                          <TableCell className="text-right font-mono text-xs">
                            ₱{Number(p.aging.thirtyToOne).toFixed(2)}
                          </TableCell>
                          <TableCell className="text-right font-mono text-xs font-semibold text-rose-600">
                            ₱{(Number(p.aging.sixtyToOne) + Number(p.aging.ninetyPlus)).toFixed(2)}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* Claims Ledger Table */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">HMO Claims Ledger</CardTitle>
              <CardDescription className="text-xs">
                Itemized claim status, member approval codes, and payment settlement actions.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="border rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Invoice #</TableHead>
                      <TableHead>Patient</TableHead>
                      <TableHead>Provider</TableHead>
                      <TableHead>Approval Code</TableHead>
                      <TableHead className="text-right">Claim Amount</TableHead>
                      <TableHead className="text-right">Settled Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(hmoAr?.claims ?? []).length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-6 text-muted-foreground text-xs">
                          No HMO claim records recorded.
                        </TableCell>
                      </TableRow>
                    ) : (
                      hmoAr.claims.map((claim: any) => {
                        const inv = claim.Invoice;
                        const patientUser = inv?.ClinicPatient?.User;
                        const patientName = patientUser
                          ? `${patientUser.lastName}, ${patientUser.firstName}`
                          : "Walk-in";

                        return (
                          <TableRow key={claim.id}>
                            <TableCell className="font-mono text-xs font-medium">
                              {inv?.invoiceNumber || "-"}
                            </TableCell>
                            <TableCell className="text-xs">{patientName}</TableCell>
                            <TableCell className="text-xs font-semibold">
                              {claim.hmoProvider}
                            </TableCell>
                            <TableCell className="font-mono text-xs text-muted-foreground">
                              {claim.approvalCode}
                            </TableCell>
                            <TableCell className="text-right font-mono text-xs font-semibold">
                              ₱{Number(claim.claimAmount).toFixed(2)}
                            </TableCell>
                            <TableCell className="text-right font-mono text-xs text-emerald-600">
                              {claim.settledAmount ? `₱${Number(claim.settledAmount).toFixed(2)}` : "-"}
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant={
                                  claim.status === "PAID"
                                    ? "default"
                                    : claim.status === "SUBMITTED"
                                    ? "outline"
                                    : "secondary"
                                }
                                className={claim.status === "PAID" ? "bg-emerald-600" : ""}
                              >
                                {claim.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                {claim.status === "PENDING_SUBMISSION" && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleUpdateClaimStatus(claim.id, "SUBMITTED")}
                                    className="h-7 text-xs"
                                  >
                                    Submit
                                  </Button>
                                )}
                                {claim.status !== "PAID" && (
                                  <Button
                                    size="sm"
                                    onClick={() => {
                                      setSelectedClaimForSettle(claim);
                                      setClaimSettledAmtInput(
                                        Number(claim.claimAmount).toFixed(2)
                                      );
                                      setClaimDeductionInput("0.00");
                                      setClaimCheckRefInput("");
                                      setIsSettleClaimDialogOpen(true);
                                    }}
                                    className="h-7 text-xs gap-1 bg-emerald-600 hover:bg-emerald-700"
                                  >
                                    <BadgeCheck className="h-3 w-3" />
                                    Settle
                                  </Button>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 4: BIR COMPLIANCE & GL EXPORT */}
        <TabsContent value="compliance" className="space-y-6">
          {/* Period Filter Bar */}
          <Card className="bg-muted/30">
            <CardContent className="p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="space-y-0.5">
                <div className="font-semibold text-sm flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-primary" />
                  Statutory & Audit Reporting Period
                </div>
                <p className="text-xs text-muted-foreground">
                  Select the date range for BIR tax books and General Ledger journal export files.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2">
                  <div className="space-y-1">
                    <Label htmlFor="export-start" className="text-[11px] text-muted-foreground">
                      From
                    </Label>
                    <Input
                      id="export-start"
                      type="date"
                      value={exportStartDate}
                      onChange={(e) => setExportStartDate(e.target.value)}
                      className="h-8 text-xs font-mono w-36"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="export-end" className="text-[11px] text-muted-foreground">
                      To
                    </Label>
                    <Input
                      id="export-end"
                      type="date"
                      value={exportEndDate}
                      onChange={(e) => setExportEndDate(e.target.value)}
                      className="h-8 text-xs font-mono w-36"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-1.5 pt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const d = new Date();
                      setExportStartDate(
                        new Date(d.getFullYear(), d.getMonth(), 1).toISOString().split("T")[0]
                      );
                      setExportEndDate(d.toISOString().split("T")[0]);
                    }}
                    className="h-8 text-xs px-2.5"
                  >
                    This Month
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const d = new Date();
                      d.setDate(d.getDate() - 30);
                      setExportStartDate(d.toISOString().split("T")[0]);
                      setExportEndDate(new Date().toISOString().split("T")[0]);
                    }}
                    className="h-8 text-xs px-2.5"
                  >
                    Last 30 Days
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* SECTION 1: BIR STATUTORY BOOKS */}
          <div className="space-y-3">
            <div>
              <h3 className="text-base font-semibold tracking-tight flex items-center gap-2">
                <FileSpreadsheet className="h-5 w-5 text-primary" />
                Philippine BIR Statutory Tax Books
              </h3>
              <p className="text-xs text-muted-foreground">
                Official Computerized Accounting System (CAS) and loose-leaf format books required under Philippine tax law (RA 11976 / EOPT Act).
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* BIR Sales Book */}
              <Card className="hover:border-primary/50 transition-colors">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="border-primary/40 text-primary">
                      BIR Revenue Journal
                    </Badge>
                    <FileSpreadsheet className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <CardTitle className="text-base mt-2">BIR Sales Book</CardTitle>
                  <CardDescription className="text-xs">
                    Itemized register of all issued sales invoices, detailing customer name, TIN/Senior ID, gross billing, 12% output VAT, senior/PWD exemptions, and discounts.
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <Button
                    onClick={handleExportBirSalesBook}
                    disabled={isPending}
                    className="w-full gap-2 text-xs h-9"
                  >
                    <Download className="h-4 w-4" />
                    Download BIR Sales Book (.CSV)
                  </Button>
                </CardContent>
              </Card>

              {/* BIR Cash Receipts Book */}
              <Card className="hover:border-primary/50 transition-colors">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="border-emerald-500/40 text-emerald-700">
                      BIR Collection Journal
                    </Badge>
                    <FileSpreadsheet className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <CardTitle className="text-base mt-2">BIR Cash Receipts Book</CardTitle>
                  <CardDescription className="text-xs">
                    Audited ledger of all Official and Collection Receipts tracking cash on hand, e-wallets (GCash/Maya), card settlements, and HMO receivable credits.
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <Button
                    onClick={handleExportBirCashReceipts}
                    disabled={isPending}
                    variant="outline"
                    className="w-full gap-2 text-xs h-9 border-emerald-600 text-emerald-700 hover:bg-emerald-50"
                  >
                    <Download className="h-4 w-4" />
                    Download Cash Receipts Book (.CSV)
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* SECTION 2: GENERAL LEDGER SYNC */}
          <div className="space-y-3">
            <div>
              <h3 className="text-base font-semibold tracking-tight flex items-center gap-2">
                <Database className="h-5 w-5 text-primary" />
                External General Ledger (GL) Sync
              </h3>
              <p className="text-xs text-muted-foreground">
                1-click general journal entries formatted for instant upload into third-party accounting platforms.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Xero */}
              <Card className="space-y-2">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <Badge variant="secondary">Xero</Badge>
                    <span className="text-[10px] text-muted-foreground font-mono">Manual Journal</span>
                  </div>
                  <CardTitle className="text-sm">Xero Accounting</CardTitle>
                  <CardDescription className="text-xs">
                    Directly formatted for Xero journal entry import with tax types and account codes.
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleExportGeneralJournal("XERO")}
                    disabled={isPending}
                    className="w-full gap-1.5 text-xs"
                  >
                    <Download className="h-3.5 w-3.5" />
                    Export Xero Journal
                  </Button>
                </CardContent>
              </Card>

              {/* QuickBooks Online */}
              <Card className="space-y-2">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <Badge variant="secondary">Intuit QuickBooks</Badge>
                    <span className="text-[10px] text-muted-foreground font-mono">Journal Entry</span>
                  </div>
                  <CardTitle className="text-sm">QuickBooks Online</CardTitle>
                  <CardDescription className="text-xs">
                    Pre-mapped for QuickBooks Online journal entry batch upload with debits and credits.
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleExportGeneralJournal("QUICKBOOKS")}
                    disabled={isPending}
                    className="w-full gap-1.5 text-xs"
                  >
                    <Download className="h-3.5 w-3.5" />
                    Export QuickBooks Journal
                  </Button>
                </CardContent>
              </Card>

              {/* Generic General Journal */}
              <Card className="space-y-2">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <Badge variant="secondary">Universal ERP</Badge>
                    <span className="text-[10px] text-muted-foreground font-mono">Double-Entry</span>
                  </div>
                  <CardTitle className="text-sm">Standard General Journal</CardTitle>
                  <CardDescription className="text-xs">
                    Balanced double-entry journal suitable for Zoho Books, SAP, Oracle NetSuite, or Excel.
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleExportGeneralJournal("GENERIC")}
                    disabled={isPending}
                    className="w-full gap-1.5 text-xs"
                  >
                    <Download className="h-3.5 w-3.5" />
                    Export Standard GL CSV
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* SECTION 3: CHART OF ACCOUNTS MAPPING */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Settings className="h-4 w-4 text-primary" />
                    Chart of Accounts (COA) Account Codes
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Map ClinicEZ revenue, tender, and liability items to your accountant's existing General Ledger codes.
                  </CardDescription>
                </div>
                <Button size="sm" onClick={handleSaveCoa} disabled={isPending} className="gap-1.5">
                  Save Account Codes
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2 text-xs">
                {/* Assets */}
                <div className="space-y-3">
                  <div className="font-semibold text-xs text-primary uppercase tracking-wider border-b pb-1">
                    Asset / Tender Accounts
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="code-cash" className="text-xs">
                      Cash on Hand Account Code
                    </Label>
                    <Input
                      id="code-cash"
                      value={coaForm.cashAccountCode}
                      onChange={(e) =>
                        setCoaForm({ ...coaForm, cashAccountCode: e.target.value })
                      }
                      className="font-mono text-xs h-8"
                      placeholder="1010"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="code-ewallet" className="text-xs">
                      E-Wallets (GCash / Maya) Code
                    </Label>
                    <Input
                      id="code-ewallet"
                      value={coaForm.eWalletAccountCode}
                      onChange={(e) =>
                        setCoaForm({ ...coaForm, eWalletAccountCode: e.target.value })
                      }
                      className="font-mono text-xs h-8"
                      placeholder="1020"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="code-bank" className="text-xs">
                      Bank Clearing / Cards Code
                    </Label>
                    <Input
                      id="code-bank"
                      value={coaForm.bankAccountCode}
                      onChange={(e) =>
                        setCoaForm({ ...coaForm, bankAccountCode: e.target.value })
                      }
                      className="font-mono text-xs h-8"
                      placeholder="1030"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="code-hmo-ar" className="text-xs">
                      HMO Accounts Receivable (AR) Code
                    </Label>
                    <Input
                      id="code-hmo-ar"
                      value={coaForm.hmoReceivableAccountCode}
                      onChange={(e) =>
                        setCoaForm({ ...coaForm, hmoReceivableAccountCode: e.target.value })
                      }
                      className="font-mono text-xs h-8"
                      placeholder="1100"
                    />
                  </div>
                </div>

                {/* Revenues */}
                <div className="space-y-3">
                  <div className="font-semibold text-xs text-emerald-700 uppercase tracking-wider border-b pb-1">
                    Operating Revenue Accounts
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="code-consult" className="text-xs">
                      Consultation Revenue Code
                    </Label>
                    <Input
                      id="code-consult"
                      value={coaForm.consultationRevenueCode}
                      onChange={(e) =>
                        setCoaForm({ ...coaForm, consultationRevenueCode: e.target.value })
                      }
                      className="font-mono text-xs h-8"
                      placeholder="4010"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="code-lab" className="text-xs">
                      Diagnostic Laboratory Revenue Code
                    </Label>
                    <Input
                      id="code-lab"
                      value={coaForm.labRevenueCode}
                      onChange={(e) =>
                        setCoaForm({ ...coaForm, labRevenueCode: e.target.value })
                      }
                      className="font-mono text-xs h-8"
                      placeholder="4020"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="code-imaging" className="text-xs">
                      Imaging / Radiology Revenue Code
                    </Label>
                    <Input
                      id="code-imaging"
                      value={coaForm.imagingRevenueCode}
                      onChange={(e) =>
                        setCoaForm({ ...coaForm, imagingRevenueCode: e.target.value })
                      }
                      className="font-mono text-xs h-8"
                      placeholder="4030"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="code-pharmacy" className="text-xs">
                      Pharmacy / Supplies Revenue Code
                    </Label>
                    <Input
                      id="code-pharmacy"
                      value={coaForm.pharmacyRevenueCode}
                      onChange={(e) =>
                        setCoaForm({ ...coaForm, pharmacyRevenueCode: e.target.value })
                      }
                      className="font-mono text-xs h-8"
                      placeholder="4040"
                    />
                  </div>
                </div>

                {/* Liabilities & Taxes */}
                <div className="space-y-3">
                  <div className="font-semibold text-xs text-amber-700 uppercase tracking-wider border-b pb-1">
                    Liability & Tax Accounts
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="code-vat" className="text-xs">
                      Output VAT Payable Code (12%)
                    </Label>
                    <Input
                      id="code-vat"
                      value={coaForm.vatPayableAccountCode}
                      onChange={(e) =>
                        setCoaForm({ ...coaForm, vatPayableAccountCode: e.target.value })
                      }
                      className="font-mono text-xs h-8"
                      placeholder="2100"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="code-doc-pf" className="text-xs">
                      Doctor PF Payable Code
                    </Label>
                    <Input
                      id="code-doc-pf"
                      value={coaForm.doctorPfPayableCode}
                      onChange={(e) =>
                        setCoaForm({ ...coaForm, doctorPfPayableCode: e.target.value })
                      }
                      className="font-mono text-xs h-8"
                      placeholder="2200"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="code-ewt" className="text-xs">
                      Withholding Tax (EWT) Payable Code
                    </Label>
                    <Input
                      id="code-ewt"
                      value={coaForm.withholdingTaxCode}
                      onChange={(e) =>
                        setCoaForm({ ...coaForm, withholdingTaxCode: e.target.value })
                      }
                      className="font-mono text-xs h-8"
                      placeholder="2300"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* DIALOG: OPEN SHIFT */}
      <Dialog open={isOpenShiftDialogOpen} onOpenChange={setIsOpenShiftDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Wallet className="h-5 w-5 text-primary" />
              Open Cashier Shift Drawer
            </DialogTitle>
            <DialogDescription className="text-xs">
              Count and declare starting cash float in the register drawer.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="opening-float">Starting Float Amount (₱)</Label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-xs text-muted-foreground font-mono">
                  ₱
                </span>
                <Input
                  id="opening-float"
                  type="number"
                  step="0.01"
                  value={openingFloatInput}
                  onChange={(e) => setOpeningFloatInput(e.target.value)}
                  className="pl-8 font-mono"
                  placeholder="1000.00"
                />
              </div>
              <p className="text-[11px] text-muted-foreground">
                Typically petty cash and coins provided for daily customer change.
              </p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="shift-notes">Shift Remarks (Optional)</Label>
              <Textarea
                id="shift-notes"
                value={openShiftNotes}
                onChange={(e) => setOpenShiftNotes(e.target.value)}
                placeholder="e.g. Morning Shift - Terminal 1"
                className="text-xs"
                rows={2}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsOpenShiftDialogOpen(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button onClick={handleOpenShift} disabled={isPending}>
              {isPending ? "Opening..." : "Start Shift"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* DIALOG: CLOSE SHIFT & RECONCILE */}
      <Dialog open={isCloseShiftDialogOpen} onOpenChange={setIsCloseShiftDialogOpen}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-destructive" />
              Reconcile & Close Cashier Shift
            </DialogTitle>
            <DialogDescription className="text-xs">
              Count all physical cash in the drawer to calculate variance (X/Z-Reading).
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2 text-xs">
            <div className="p-3 bg-muted/60 rounded-lg space-y-2 border">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Opening Float:</span>
                <span className="font-mono">
                  ₱{currentShift ? Number(currentShift.openingFloat).toFixed(2) : "0.00"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Cash Sales Collected:</span>
                <span className="font-mono text-emerald-600 font-semibold">
                  +₱{currentShift ? Number(currentShift.cashCollections).toFixed(2) : "0.00"}
                </span>
              </div>
              <div className="flex justify-between border-t pt-2 font-bold text-sm">
                <span>Expected Drawer Total:</span>
                <span className="font-mono text-primary">
                  ₱{expectedCashInDrawer.toFixed(2)}
                </span>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="actual-cash" className="text-xs font-semibold">
                Actual Physical Cash Counted (₱)
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-xs text-muted-foreground font-mono">
                  ₱
                </span>
                <Input
                  id="actual-cash"
                  type="number"
                  step="0.01"
                  value={actualCashCountInput}
                  onChange={(e) => setActualCashCountInput(e.target.value)}
                  className="pl-8 font-mono text-sm font-bold"
                  placeholder="0.00"
                  autoFocus
                />
              </div>
            </div>

            {/* Live Variance Calculation Banner */}
            <div
              className={`p-3 rounded-lg border text-xs flex items-center justify-between ${
                variance === 0
                  ? "bg-emerald-50 border-emerald-300 text-emerald-800"
                  : variance > 0
                  ? "bg-blue-50 border-blue-300 text-blue-800"
                  : "bg-red-50 border-red-300 text-red-800"
              }`}
            >
              <div>
                <span className="font-bold block">
                  {variance === 0
                    ? "Drawer is Balanced"
                    : variance > 0
                    ? "Cash Overage"
                    : "Cash Shortage"}
                </span>
                <span className="text-[11px]">
                  {variance === 0
                    ? "Count exactly matches expected cash."
                    : variance > 0
                    ? "Actual cash exceeds recorded sales."
                    : "Drawer is missing expected cash."}
                </span>
              </div>
              <div className="font-mono text-base font-bold">
                {variance >= 0 ? `+₱${variance.toFixed(2)}` : `-₱${Math.abs(variance).toFixed(2)}`}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="close-shift-notes" className="text-xs">
                Reconciliation Remarks (Optional)
              </Label>
              <Textarea
                id="close-shift-notes"
                value={closeShiftNotes}
                onChange={(e) => setCloseShiftNotes(e.target.value)}
                placeholder="Explain any variance or drawer hand-over notes..."
                rows={2}
                className="text-xs"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsCloseShiftDialogOpen(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleCloseShift} disabled={isPending}>
              {isPending ? "Reconciling..." : "Confirm & Close Shift"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* DIALOG: GENERATE DOCTOR VOUCHER */}
      <Dialog open={isGenVoucherDialogOpen} onOpenChange={setIsGenVoucherDialogOpen}>
        <DialogContent className="sm:max-w-[460px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              Generate Doctor Payout Voucher
            </DialogTitle>
            <DialogDescription className="text-xs">
              Disburse accrued professional fees for {selectedDoctorForVoucher?.doctorName}.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2 text-xs">
            <div className="p-3 bg-muted/60 rounded-lg space-y-1.5 border">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Doctor:</span>
                <span className="font-semibold">{selectedDoctorForVoucher?.doctorName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Unliquidated Encounters:</span>
                <span>{selectedDoctorForVoucher?.itemCount} consultations / procedures</span>
              </div>
              <div className="flex justify-between font-bold">
                <span>Gross Professional Fees:</span>
                <span className="font-mono text-primary">₱{doctorGrossPf.toFixed(2)}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="tax-rate" className="text-xs">
                  EWT Withholding Rate (%)
                </Label>
                <div className="relative">
                  <Input
                    id="tax-rate"
                    type="number"
                    step="0.5"
                    value={taxRateInput}
                    onChange={(e) => setTaxRateInput(e.target.value)}
                    className="font-mono pr-8 text-xs"
                  />
                  <span className="absolute right-3 top-2.5 text-xs text-muted-foreground">
                    %
                  </span>
                </div>
                <p className="text-[10px] text-muted-foreground">Default 10% BIR rate</p>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="facility-deduction" className="text-xs">
                  Clinic Deduction (₱)
                </Label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-xs text-muted-foreground font-mono">
                    ₱
                  </span>
                  <Input
                    id="facility-deduction"
                    type="number"
                    step="1.0"
                    value={facilityDeductionInput}
                    onChange={(e) => setFacilityDeductionInput(e.target.value)}
                    className="pl-7 font-mono text-xs"
                    placeholder="0.00"
                  />
                </div>
                <p className="text-[10px] text-muted-foreground">Facility / equipment fees</p>
              </div>
            </div>

            {/* Preview Breakdown */}
            <div className="p-3 bg-primary/5 rounded-lg border border-primary/20 space-y-1.5">
              <div className="flex justify-between text-muted-foreground">
                <span>Gross PF:</span>
                <span className="font-mono">₱{doctorGrossPf.toFixed(2)}</span>
              </div>
              {dialogFacilityDeduction > 0 && (
                <div className="flex justify-between text-muted-foreground">
                  <span>Facility Fee:</span>
                  <span className="font-mono">-₱{dialogFacilityDeduction.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-muted-foreground">
                <span>Withholding Tax ({dialogTaxRate}%):</span>
                <span className="font-mono text-red-600">-₱{dialogTaxAmt.toFixed(2)}</span>
              </div>
              <div className="flex justify-between border-t border-primary/30 pt-1.5 font-bold text-sm">
                <span>Net Payable Payout:</span>
                <span className="font-mono text-primary">₱{dialogNetPayout.toFixed(2)}</span>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsGenVoucherDialogOpen(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button onClick={handleGenerateVoucher} disabled={isPending}>
              {isPending ? "Generating..." : "Create Payout Voucher"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* DIALOG: MARK VOUCHER PAID */}
      <Dialog open={isMarkPaidDialogOpen} onOpenChange={setIsMarkPaidDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BadgeCheck className="h-5 w-5 text-emerald-600" />
              Settle Doctor Voucher Payment
            </DialogTitle>
            <DialogDescription className="text-xs">
              Confirm payment disbursement for {selectedVoucherForPay?.voucherNumber}.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2 text-xs">
            <div className="p-3 bg-muted/60 rounded-lg space-y-1 border">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Payee:</span>
                <span className="font-semibold">
                  Dr. {selectedVoucherForPay?.Doctor?.firstName}{" "}
                  {selectedVoucherForPay?.Doctor?.lastName}
                </span>
              </div>
              <div className="flex justify-between font-bold text-sm">
                <span>Net Amount to Disburse:</span>
                <span className="font-mono text-emerald-600">
                  ₱{Number(selectedVoucherForPay?.netPayoutAmount ?? 0).toFixed(2)}
                </span>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="payment-ref">Payment Reference / Check # / EFT</Label>
              <Input
                id="payment-ref"
                value={paymentRefInput}
                onChange={(e) => setPaymentRefInput(e.target.value)}
                placeholder="e.g. Check #104928 or GCash / BDO Ref"
                className="text-xs font-mono"
                autoFocus
              />
              <p className="text-[11px] text-muted-foreground">
                Documented on disbursement slip for auditing and BIR Form 2307.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsMarkPaidDialogOpen(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={handleMarkVoucherPaid}
              disabled={isPending}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {isPending ? "Settling..." : "Confirm Payment"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* DIALOG: SETTLE HMO CLAIM */}
      <Dialog open={isSettleClaimDialogOpen} onOpenChange={setIsSettleClaimDialogOpen}>
        <DialogContent className="sm:max-w-[440px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-amber-600" />
              Settle HMO Claim Remittance
            </DialogTitle>
            <DialogDescription className="text-xs">
              Record reimbursement check or bank transfer received from {selectedClaimForSettle?.hmoProvider}.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2 text-xs">
            <div className="p-3 bg-muted/60 rounded-lg space-y-1.5 border">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Provider / Approval:</span>
                <span className="font-semibold">
                  {selectedClaimForSettle?.hmoProvider} ({selectedClaimForSettle?.approvalCode})
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Claimed Amount:</span>
                <span className="font-mono font-bold">
                  ₱{Number(selectedClaimForSettle?.claimAmount ?? 0).toFixed(2)}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="settled-amt" className="text-xs font-semibold">
                  Settled / Received (₱)
                </Label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-xs text-muted-foreground font-mono">
                    ₱
                  </span>
                  <Input
                    id="settled-amt"
                    type="number"
                    step="0.01"
                    value={claimSettledAmtInput}
                    onChange={(e) => setClaimSettledAmtInput(e.target.value)}
                    className="pl-7 font-mono text-xs font-bold"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="deduction-amt" className="text-xs">
                  Disallowance / Fee (₱)
                </Label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-xs text-muted-foreground font-mono">
                    ₱
                  </span>
                  <Input
                    id="deduction-amt"
                    type="number"
                    step="0.01"
                    value={claimDeductionInput}
                    onChange={(e) => setClaimDeductionInput(e.target.value)}
                    className="pl-7 font-mono text-xs"
                    placeholder="0.00"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="check-ref" className="text-xs">
                Check Number / Bank Deposit Reference
              </Label>
              <Input
                id="check-ref"
                value={claimCheckRefInput}
                onChange={(e) => setClaimCheckRefInput(e.target.value)}
                placeholder="e.g. BPI Check #0981726"
                className="text-xs font-mono"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsSettleClaimDialogOpen(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSettleClaim}
              disabled={isPending}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {isPending ? "Settling..." : "Post Settlement"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
