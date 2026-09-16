"use client";

import React, { useState, useTransition, useEffect } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  CreditCard,
  Plus,
  Trash2,
  Receipt,
  UserCheck,
  Search,
  Printer,
  FileText,
  DollarSign,
  AlertCircle,
  Tag,
  CheckCircle2,
  Clock,
  ChevronRight,
  ShieldCheck,
  Building,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  getPendingBillingEncountersAction,
  createDraftInvoiceFromEncounterAction,
  updateInvoiceItemsAction,
  getInvoiceDetailAction,
  createDirectInvoiceAction,
  type PendingEncounter,
  type DirectInvoiceItemInput,
} from "@/actions/billing/invoice.action";
import { processPaymentAction, getPaymentReceiptDetailAction } from "@/actions/billing/payment.action";
import { calculateBillTotals } from "@/lib/billing/tax-engine";
import { SalesInvoicePrint } from "./SalesInvoicePrint";
import { OfficialReceiptPrint } from "./OfficialReceiptPrint";
import type { DiscountType, PaymentMethod, PriceCategory } from "@prisma/client";

interface CashierPosClientProps {
  clinicUid: string;
  initialPendingEncounters: PendingEncounter[];
  priceCatalog: any[];
  billingSetting: any;
}

export function CashierPosClient({
  clinicUid,
  initialPendingEncounters,
  priceCatalog,
  billingSetting,
}: CashierPosClientProps) {
  const [isPending, startTransition] = useTransition();

  // Queue state
  const [encounters, setEncounters] = useState<PendingEncounter[]>(initialPendingEncounters);
  const [searchQueue, setSearchQueue] = useState("");
  const [selectedEncounter, setSelectedEncounter] = useState<PendingEncounter | null>(null);

  // Active Invoice state
  const [activeInvoice, setActiveInvoice] = useState<any | null>(null);
  const [lineItems, setLineItems] = useState<DirectInvoiceItemInput[]>([]);
  const [discountType, setDiscountType] = useState<DiscountType>("NONE");
  const [discountIdNumber, setDiscountIdNumber] = useState("");
  const [invoiceNotes, setInvoiceNotes] = useState("");

  // Modals state
  const [isAddItemModalOpen, setIsAddItemModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isWalkInModalOpen, setIsWalkInModalOpen] = useState(false);

  // Add Item from Catalog state
  const [catalogSearch, setCatalogSearch] = useState("");
  const [selectedCatalogCategory, setSelectedCatalogCategory] = useState("");

  // Payment Form state
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("CASH");
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [tenderedCash, setTenderedCash] = useState<number>(0);
  const [referenceNumber, setReferenceNumber] = useState("");
  const [hmoProvider, setHmoProvider] = useState("");
  const [hmoApprovalCode, setHmoApprovalCode] = useState("");

  // Print state
  const [printMode, setPrintMode] = useState<"NONE" | "INVOICE" | "RECEIPT">("NONE");
  const [latestReceipt, setLatestReceipt] = useState<any | null>(null);

  // Walk-in form state
  const [walkInPatientName, setWalkInPatientName] = useState("");
  const [walkInPatientMobile, setWalkInPatientMobile] = useState("");

  // Refresh pending queue
  const refreshQueue = () => {
    startTransition(async () => {
      const res = await getPendingBillingEncountersAction(clinicUid);
      if (res.status) {
        setEncounters(res.data);
      }
    });
  };

  // Select an encounter from the queue
  const handleSelectEncounter = (enc: PendingEncounter) => {
    setSelectedEncounter(enc);
    setPrintMode("NONE");
    startTransition(async () => {
      const res = await createDraftInvoiceFromEncounterAction(clinicUid, enc.consultationTicketId);
      if (res.status && res.data) {
        // Load full invoice details
        const fullRes = await getInvoiceDetailAction(res.data.id);
        if (fullRes.status && fullRes.data) {
          const inv = fullRes.data;
          setActiveInvoice(inv);
          setDiscountType(inv.discountType);
          setDiscountIdNumber(inv.discountIdNumber || "");
          setInvoiceNotes(inv.notes || "");
          setLineItems(
            inv.Items.map((item: any) => ({
              description: item.description,
              category: item.category,
              quantity: item.quantity,
              unitPrice: Number(item.unitPrice),
              isVatable: item.isVatable,
              doctorId: item.doctorId,
              doctorSharePercent: item.doctorSharePercent ? Number(item.doctorSharePercent) : null,
              priceItemId: item.priceItemId,
            }))
          );
        }
      } else {
        toast.error(res.message);
      }
    });
  };

  // Calculated totals live preview
  const liveTotals = calculateBillTotals(
    lineItems,
    discountType,
    0,
    Number(billingSetting?.vatRate ?? 12) / 100
  );

  // Sync line item changes back to server
  const handleSyncInvoiceChanges = (
    updatedItems: DirectInvoiceItemInput[],
    newDiscountType = discountType,
    newIdNumber = discountIdNumber
  ) => {
    if (!activeInvoice) return;
    startTransition(async () => {
      const res = await updateInvoiceItemsAction({
        invoiceId: activeInvoice.id,
        items: updatedItems,
        discountType: newDiscountType,
        discountIdNumber: newIdNumber.trim() || undefined,
        notes: invoiceNotes,
      });
      if (res.status && res.data) {
        setActiveInvoice(res.data);
      } else {
        toast.error(res.message);
      }
    });
  };

  // Update item quantity
  const handleUpdateQuantity = (index: number, newQty: number) => {
    if (newQty < 1) return;
    const updated = [...lineItems];
    updated[index].quantity = newQty;
    setLineItems(updated);
    handleSyncInvoiceChanges(updated);
  };

  // Remove line item
  const handleRemoveItem = (index: number) => {
    if (lineItems.length <= 1) {
      toast.error("Invoice must have at least one line item.");
      return;
    }
    const updated = lineItems.filter((_, idx) => idx !== index);
    setLineItems(updated);
    handleSyncInvoiceChanges(updated);
  };

  // Add line item from catalog
  const handleAddCatalogItem = (catalogItem: any) => {
    const newItem: DirectInvoiceItemInput = {
      description: catalogItem.name,
      category: catalogItem.category,
      quantity: 1,
      unitPrice: Number(catalogItem.unitPrice),
      isVatable: catalogItem.isVatable,
      priceItemId: catalogItem.id,
      doctorSharePercent: catalogItem.defaultDoctorSharePercent
        ? Number(catalogItem.defaultDoctorSharePercent)
        : null,
    };
    const updated = [...lineItems, newItem];
    setLineItems(updated);
    handleSyncInvoiceChanges(updated);
    setIsAddItemModalOpen(false);
    toast.success(`Added ${catalogItem.name} to bill`);
  };

  // Discount Type Change
  const handleDiscountChange = (newDiscount: DiscountType) => {
    setDiscountType(newDiscount);
    handleSyncInvoiceChanges(lineItems, newDiscount, discountIdNumber);
  };

  // Open Payment Drawer
  const handleOpenPayment = () => {
    if (!activeInvoice) return;
    const balance = Number(activeInvoice.balanceDue);
    if (balance <= 0) {
      toast.info("This invoice is already fully paid.");
      return;
    }
    setPaymentAmount(balance);
    setTenderedCash(balance);
    setReferenceNumber("");
    setIsPaymentModalOpen(true);
  };

  // Process payment
  const handleProcessPayment = () => {
    if (!activeInvoice) return;
    if (paymentAmount <= 0) {
      toast.error("Payment amount must be greater than zero.");
      return;
    }
    if (paymentMethod === "CASH" && tenderedCash < paymentAmount) {
      toast.error("Tendered cash cannot be less than payment amount.");
      return;
    }
    if (
      (paymentMethod === "GCASH" ||
        paymentMethod === "MAYA" ||
        paymentMethod === "CREDIT_CARD" ||
        paymentMethod === "DEBIT_CARD" ||
        paymentMethod === "BANK_TRANSFER") &&
      !referenceNumber.trim()
    ) {
      toast.error("Please enter transaction/terminal reference number for non-cash tenders.");
      return;
    }

    startTransition(async () => {
      const change = paymentMethod === "CASH" ? Math.max(0, tenderedCash - paymentAmount) : 0;
      const res = await processPaymentAction({
        invoiceId: activeInvoice.id,
        paymentMethod,
        amount: paymentAmount,
        tenderedAmount: paymentMethod === "CASH" ? tenderedCash : paymentAmount,
        changeAmount: change,
        referenceNumber: referenceNumber.trim() || undefined,
        hmoProvider: paymentMethod === "HMO_RECEIVABLE" ? hmoProvider.trim() : undefined,
        hmoApprovalCode: paymentMethod === "HMO_RECEIVABLE" ? hmoApprovalCode.trim() : undefined,
      });

      if (res.status && res.data) {
        toast.success("Payment processed and Official Receipt issued!");
        setIsPaymentModalOpen(false);

        // Fetch full receipt for immediate printing
        const rRes = await getPaymentReceiptDetailAction(res.data.id);
        if (rRes.status && rRes.data) {
          setLatestReceipt(rRes.data);
          setPrintMode("RECEIPT");
        }

        // Refresh active invoice and queue
        const invRes = await getInvoiceDetailAction(activeInvoice.id);
        if (invRes.status && invRes.data) {
          setActiveInvoice(invRes.data);
        }
        refreshQueue();
      } else {
        toast.error(res.message);
      }
    });
  };

  // Filtered queue
  const filteredQueue = encounters.filter((e) => {
    if (!searchQueue.trim()) return true;
    const q = searchQueue.toLowerCase();
    return (
      e.patientName.toLowerCase().includes(q) ||
      (e.caseNumber && e.caseNumber.toLowerCase().includes(q)) ||
      e.doctorName.toLowerCase().includes(q)
    );
  });

  // Filtered catalog
  const filteredCatalog = priceCatalog.filter((item) => {
    const matchesCategory = selectedCatalogCategory
      ? item.category === selectedCatalogCategory
      : true;
    const matchesSearch = catalogSearch.trim()
      ? item.name.toLowerCase().includes(catalogSearch.toLowerCase()) ||
        (item.code && item.code.toLowerCase().includes(catalogSearch.toLowerCase()))
      : true;
    return matchesCategory && matchesSearch;
  });

  // If in print view, show print template
  if (printMode === "INVOICE" && activeInvoice) {
    return (
      <div className="p-6">
        <SalesInvoicePrint invoice={activeInvoice} onBack={() => setPrintMode("NONE")} />
      </div>
    );
  }

  if (printMode === "RECEIPT" && latestReceipt) {
    return (
      <div className="p-6">
        <OfficialReceiptPrint receipt={latestReceipt} onBack={() => setPrintMode("NONE")} />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <CreditCard className="h-6 w-6 text-primary" />
            Cashier Point of Sale (POS)
          </h1>
          <p className="text-sm text-muted-foreground">
            {billingSetting?.registeredBusinessName || "Clinic Checkout"} • Serial:{" "}
            {billingSetting?.invoicePrefix ?? "INV-"}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button asChild variant="outline" size="sm" className="gap-1.5">
            <Link href={`/v2/clinic/${clinicUid}/billing/invoices`}>
              <FileText className="h-4 w-4" />
              Invoices History
            </Link>
          </Button>
          <Button variant="outline" size="sm" onClick={refreshQueue} className="gap-1.5">
            <Clock className="h-4 w-4" />
            Refresh Queue
          </Button>
        </div>
      </div>

      {/* POS Two-Column Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Pending Encounters Queue (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          <Card className="shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <UserCheck className="h-4 w-4 text-primary" />
                  Ready for Billing
                </CardTitle>
                <Badge variant="secondary">{filteredQueue.length}</Badge>
              </div>
              <CardDescription>
                Encounters ready for invoice creation and payment.
              </CardDescription>

              <div className="pt-2 relative">
                <Search className="absolute left-2.5 top-4.5 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  placeholder="Search patient or doctor..."
                  value={searchQueue}
                  onChange={(e) => setSearchQueue(e.target.value)}
                  className="pl-8 h-8 text-xs"
                />
              </div>
            </CardHeader>

            <CardContent className="p-0">
              <div className="divide-y max-h-[580px] overflow-y-auto">
                {filteredQueue.length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground text-xs space-y-1">
                    <UserCheck className="h-8 w-8 mx-auto text-muted-foreground/40 mb-2" />
                    <p className="font-semibold">No encounters in queue</p>
                    <p>When doctors complete consultations, they will appear here.</p>
                  </div>
                ) : (
                  filteredQueue.map((enc) => {
                    const isSelected =
                      selectedEncounter?.consultationTicketId === enc.consultationTicketId;
                    return (
                      <div
                        key={enc.consultationTicketId}
                        onClick={() => handleSelectEncounter(enc)}
                        className={`p-3.5 cursor-pointer transition-all hover:bg-muted/50 ${
                          isSelected ? "bg-primary/10 border-l-4 border-primary" : ""
                        }`}
                      >
                        <div className="flex justify-between items-start">
                          <span className="font-semibold text-sm text-foreground">
                            {enc.patientName}
                          </span>
                          <span className="text-[10px] text-muted-foreground">
                            {new Date(enc.date).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                        <div className="text-xs text-muted-foreground mt-0.5">{enc.doctorName}</div>
                        <div className="flex items-center justify-between mt-2">
                          <Badge variant="outline" className="text-[10px] font-normal">
                            {enc.serviceSummary}
                          </Badge>
                          <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Active Bill & Checkout Workspace (8 cols) */}
        <div className="lg:col-span-8 space-y-4">
          {!activeInvoice ? (
            <Card className="h-[600px] flex items-center justify-center text-center p-8 border-dashed">
              <div className="space-y-3 max-w-sm">
                <Receipt className="h-12 w-12 mx-auto text-muted-foreground/30" />
                <h3 className="font-bold text-base">Select a Patient to Checkout</h3>
                <p className="text-xs text-muted-foreground">
                  Choose an encounter from the left queue to review auto-calculated charges, apply
                  statutory Senior/PWD discounts, and accept payment.
                </p>
              </div>
            </Card>
          ) : (
            <div className="space-y-4">
              {/* Invoice Header Card */}
              <Card className="shadow-sm border-primary/20">
                <CardHeader className="pb-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-lg font-bold">
                          {activeInvoice.invoiceNumber}
                        </CardTitle>
                        <Badge
                          variant={
                            activeInvoice.status === "PAID"
                              ? "default"
                              : activeInvoice.status === "PARTIALLY_PAID"
                              ? "secondary"
                              : "outline"
                          }
                        >
                          {activeInvoice.status}
                        </Badge>
                      </div>
                      <CardDescription className="text-xs mt-0.5">
                        Patient:{" "}
                        <strong className="text-foreground">
                          {selectedEncounter?.patientName || "Patient"}
                        </strong>{" "}
                        • {selectedEncounter?.doctorName}
                      </CardDescription>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPrintMode("INVOICE")}
                        className="gap-1.5 text-xs"
                      >
                        <FileText className="h-3.5 w-3.5" />
                        Print Invoice
                      </Button>
                      {activeInvoice.Payments?.length > 0 && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setLatestReceipt(activeInvoice.Payments[0]);
                            setPrintMode("RECEIPT");
                          }}
                          className="gap-1.5 text-xs"
                        >
                          <Printer className="h-3.5 w-3.5" />
                          Print OR
                        </Button>
                      )}
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Line Items Table */}
                  <div className="border rounded-md overflow-hidden">
                    <Table>
                      <TableHeader className="bg-muted/50">
                        <TableRow className="text-xs">
                          <TableHead>Service / Item</TableHead>
                          <TableHead className="w-16 text-center">Qty</TableHead>
                          <TableHead className="w-24 text-right">Price</TableHead>
                          <TableHead className="w-28 text-right">Line Total</TableHead>
                          <TableHead className="w-12 text-center"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {lineItems.map((item, idx) => (
                          <TableRow key={idx} className="text-xs">
                            <TableCell className="font-medium">
                              {item.description}
                              <Badge variant="outline" className="text-[10px] ml-2 font-normal">
                                {item.category}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-center">
                              <div className="flex items-center justify-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => handleUpdateQuantity(idx, item.quantity - 1)}
                                  className="h-5 w-5 rounded bg-muted hover:bg-muted/80 text-center font-bold text-xs"
                                >
                                  -
                                </button>
                                <span className="w-6 font-semibold">{item.quantity}</span>
                                <button
                                  type="button"
                                  onClick={() => handleUpdateQuantity(idx, item.quantity + 1)}
                                  className="h-5 w-5 rounded bg-muted hover:bg-muted/80 text-center font-bold text-xs"
                                >
                                  +
                                </button>
                              </div>
                            </TableCell>
                            <TableCell className="text-right font-mono">
                              ₱{Number(item.unitPrice).toFixed(2)}
                            </TableCell>
                            <TableCell className="text-right font-mono font-semibold">
                              ₱{(Number(item.unitPrice) * item.quantity).toFixed(2)}
                            </TableCell>
                            <TableCell className="text-center">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 text-destructive hover:bg-destructive/10"
                                onClick={() => handleRemoveItem(idx)}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Add Item Button */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsAddItemModalOpen(true)}
                    className="gap-1.5 text-xs w-full sm:w-auto"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Add Service / Item from Catalog
                  </Button>

                  {/* Statutory Discounts Selector (PH RA 9994 / RA 10754) */}
                  <div className="p-3.5 border rounded-lg bg-card space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs font-semibold flex items-center gap-1.5">
                        <Tag className="h-3.5 w-3.5 text-primary" />
                        Statutory Discounts (PH Law)
                      </Label>
                      <span className="text-[11px] text-muted-foreground">
                        Senior/PWD gets 20% discount + VAT Exemption
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="space-y-1">
                        <Label className="text-[11px] text-muted-foreground">Discount Type</Label>
                        <Select
                          value={discountType}
                          onValueChange={(val) => handleDiscountChange(val as DiscountType)}
                        >
                          <SelectTrigger className="h-8 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="NONE">None (Regular)</SelectItem>
                            <SelectItem value="SENIOR_CITIZEN">Senior Citizen (20% + VAT Exempt)</SelectItem>
                            <SelectItem value="PWD">PWD (20% + VAT Exempt)</SelectItem>
                            <SelectItem value="EMPLOYEE">Clinic Staff / Courtesy</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {(discountType === "SENIOR_CITIZEN" || discountType === "PWD") && (
                        <div className="sm:col-span-2 space-y-1">
                          <Label className="text-[11px] text-muted-foreground">
                            OSCA / PWD ID Number (Required by Law)
                          </Label>
                          <Input
                            placeholder="e.g. OSCA-MNL-2024-12345"
                            value={discountIdNumber}
                            onChange={(e) => {
                              setDiscountIdNumber(e.target.value);
                              handleSyncInvoiceChanges(lineItems, discountType, e.target.value);
                            }}
                            className="h-8 text-xs font-mono"
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Financial Summary & Checkout Button */}
                  <div className="bg-muted/30 p-4 rounded-lg border space-y-3">
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <span className="text-muted-foreground">Gross Subtotal:</span>
                      <span className="text-right font-mono">
                        ₱{liveTotals.rawSubtotal.toFixed(2)}
                      </span>

                      {liveTotals.discountAmount > 0 && (
                        <>
                          <span className="text-emerald-600 font-medium">
                            Discount ({discountType}):
                          </span>
                          <span className="text-right font-mono text-emerald-600 font-semibold">
                            -₱{liveTotals.discountAmount.toFixed(2)}
                          </span>
                        </>
                      )}

                      <span className="text-muted-foreground">VATable Sales:</span>
                      <span className="text-right font-mono">
                        ₱{liveTotals.vatableSales.toFixed(2)}
                      </span>

                      {liveTotals.vatExemptSales > 0 && (
                        <>
                          <span className="text-muted-foreground">VAT-Exempt Sales:</span>
                          <span className="text-right font-mono">
                            ₱{liveTotals.vatExemptSales.toFixed(2)}
                          </span>
                        </>
                      )}

                      <span className="text-muted-foreground">12% VAT:</span>
                      <span className="text-right font-mono">
                        ₱{liveTotals.vatAmount.toFixed(2)}
                      </span>

                      <div className="col-span-2 border-t pt-2 flex justify-between items-center text-sm font-bold">
                        <span>Total Amount Due:</span>
                        <span className="font-mono text-base text-primary">
                          ₱{liveTotals.totalAmount.toFixed(2)}
                        </span>
                      </div>

                      <div className="col-span-2 flex justify-between items-center text-xs">
                        <span className="text-muted-foreground">Amount Settled:</span>
                        <span className="font-mono text-emerald-600 font-semibold">
                          ₱{Number(activeInvoice.amountPaid).toFixed(2)}
                        </span>
                      </div>

                      <div className="col-span-2 flex justify-between items-center text-sm font-black border-t pt-2 text-foreground">
                        <span>Remaining Balance Due:</span>
                        <span className="font-mono text-lg text-foreground">
                          ₱{Number(activeInvoice.balanceDue).toFixed(2)}
                        </span>
                      </div>
                    </div>

                    {/* Checkout Button */}
                    <div className="pt-2">
                      {Number(activeInvoice.balanceDue) > 0 ? (
                        <Button
                          size="lg"
                          onClick={handleOpenPayment}
                          className="w-full gap-2 font-bold shadow-md"
                        >
                          <DollarSign className="h-5 w-5" />
                          Accept Payment & Issue Receipt (₱
                          {Number(activeInvoice.balanceDue).toFixed(2)})
                        </Button>
                      ) : (
                        <div className="p-3 bg-emerald-50 text-emerald-800 rounded text-center text-xs font-semibold flex items-center justify-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                          Invoice Fully Paid & Settled
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>

      {/* Add Item from Price Catalog Modal */}
      <Dialog open={isAddItemModalOpen} onOpenChange={setIsAddItemModalOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Add Item from Price Catalog</DialogTitle>
            <DialogDescription>
              Select a clinical service, diagnostic test, or medication from your catalog.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search catalog by name or code..."
                  value={catalogSearch}
                  onChange={(e) => setCatalogSearch(e.target.value)}
                  className="pl-8 h-9 text-xs"
                />
              </div>

              <Select
                value={selectedCatalogCategory}
                onValueChange={setSelectedCatalogCategory}
              >
                <SelectTrigger className="w-[180px] h-9 text-xs">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Categories</SelectItem>
                  <SelectItem value="CONSULTATION">Consultation</SelectItem>
                  <SelectItem value="LABORATORY">Laboratory</SelectItem>
                  <SelectItem value="IMAGING">Imaging</SelectItem>
                  <SelectItem value="HEART_STATION">Heart Station</SelectItem>
                  <SelectItem value="PROCEDURE">Procedure</SelectItem>
                  <SelectItem value="MEDICATION">Medication</SelectItem>
                  <SelectItem value="SUPPLIES">Supplies</SelectItem>
                  <SelectItem value="OTHER">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="border rounded-md max-h-[300px] overflow-y-auto divide-y text-xs">
              {filteredCatalog.length === 0 ? (
                <div className="p-6 text-center text-muted-foreground">
                  No matching price items found.
                </div>
              ) : (
                filteredCatalog.map((item) => (
                  <div
                    key={item.id}
                    className="p-2.5 flex items-center justify-between hover:bg-muted/50 cursor-pointer"
                    onClick={() => handleAddCatalogItem(item)}
                  >
                    <div>
                      <div className="font-semibold text-foreground">{item.name}</div>
                      <div className="text-[10px] text-muted-foreground font-mono">
                        {item.code || "—"} • {item.category}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-mono font-bold">
                        ₱{Number(item.unitPrice).toFixed(2)}
                      </span>
                      <Button size="sm" variant="secondary" className="h-7 text-xs">
                        Add
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Payment Settlement Modal */}
      <Dialog open={isPaymentModalOpen} onOpenChange={setIsPaymentModalOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-primary" />
              Accept Payment & Issue Official Receipt
            </DialogTitle>
            <DialogDescription>
              Record tender and generate BIR-compliant Official Receipt.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2 text-xs">
            {/* Payment Method Selector */}
            <div className="space-y-2">
              <Label className="text-xs font-semibold">Tender / Payment Method</Label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { label: "Cash", value: "CASH" },
                  { label: "GCash", value: "GCASH" },
                  { label: "Maya", value: "MAYA" },
                  { label: "Credit Card", value: "CREDIT_CARD" },
                  { label: "Debit Card", value: "DEBIT_CARD" },
                  { label: "Bank Wire", value: "BANK_TRANSFER" },
                  { label: "HMO / Insurer", value: "HMO_RECEIVABLE" },
                ].map((m) => (
                  <Button
                    key={m.value}
                    type="button"
                    size="sm"
                    variant={paymentMethod === m.value ? "default" : "outline"}
                    className="text-xs h-9 justify-center"
                    onClick={() => setPaymentMethod(m.value as PaymentMethod)}
                  >
                    {m.label}
                  </Button>
                ))}
              </div>
            </div>

            {/* Payment Amount */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>Amount Paying</Label>
                <Input
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(Number(e.target.value))}
                  className="font-mono text-sm font-bold"
                />
              </div>

              {paymentMethod === "CASH" && (
                <div className="space-y-1">
                  <Label>Cash Handed Over</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={tenderedCash}
                    onChange={(e) => setTenderedCash(Number(e.target.value))}
                    className="font-mono text-sm font-bold"
                  />
                </div>
              )}
            </div>

            {/* Change Display for Cash */}
            {paymentMethod === "CASH" && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-md flex justify-between items-center">
                <span className="text-emerald-800 font-medium">Change to Return:</span>
                <span className="font-mono text-base font-black text-emerald-900">
                  ₱{Math.max(0, tenderedCash - paymentAmount).toFixed(2)}
                </span>
              </div>
            )}

            {/* Non-Cash Reference Number Input */}
            {paymentMethod !== "CASH" && paymentMethod !== "HMO_RECEIVABLE" && (
              <div className="space-y-1">
                <Label>
                  {paymentMethod === "GCASH" || paymentMethod === "MAYA"
                    ? "Transaction Reference Number (e.g. 13-digit ref)"
                    : "Terminal Approval Code / Auth Reference"}
                </Label>
                <Input
                  placeholder="Enter manual transaction reference..."
                  value={referenceNumber}
                  onChange={(e) => setReferenceNumber(e.target.value)}
                  className="font-mono text-xs"
                />
              </div>
            )}

            {/* HMO Fields */}
            {paymentMethod === "HMO_RECEIVABLE" && (
              <div className="space-y-3 p-3 bg-card border rounded-md">
                <div className="space-y-1">
                  <Label>HMO / Corporate Insurance Provider</Label>
                  <Input
                    placeholder="e.g. Maxicare, Intellicare, Medicard"
                    value={hmoProvider}
                    onChange={(e) => setHmoProvider(e.target.value)}
                    className="text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <Label>Approval / Guarantee Letter (LOA) Code</Label>
                  <Input
                    placeholder="e.g. LOA-2024-99881"
                    value={hmoApprovalCode}
                    onChange={(e) => setHmoApprovalCode(e.target.value)}
                    className="font-mono text-xs"
                  />
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPaymentModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleProcessPayment} disabled={isPending} className="gap-2">
              <DollarSign className="h-4 w-4" />
              {isPending ? "Issuing Receipt..." : "Confirm & Print Receipt"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
