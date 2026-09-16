"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
import {
  FileText,
  Search,
  Filter,
  ArrowLeft,
  Printer,
  Ban,
  Receipt,
  CheckCircle2,
  AlertCircle,
  Eye,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { toast } from "sonner";
import {
  getInvoicesAction,
  getInvoiceDetailAction,
  voidInvoiceAction,
} from "@/actions/billing/invoice.action";
import { SalesInvoicePrint } from "@/components/v2/billing/SalesInvoicePrint";
import { OfficialReceiptPrint } from "@/components/v2/billing/OfficialReceiptPrint";
import type { InvoiceStatus } from "@prisma/client";

interface InvoicesListClientProps {
  clinicUid: string;
  initialInvoices: any[];
}

export function InvoicesListClient({ clinicUid, initialInvoices }: InvoicesListClientProps) {
  const [isPending, startTransition] = useTransition();
  const [invoices, setInvoices] = useState<any[]>(initialInvoices);
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  // Print / View state
  const [selectedInvoice, setSelectedInvoice] = useState<any | null>(null);
  const [selectedReceipt, setSelectedReceipt] = useState<any | null>(null);
  const [viewMode, setViewMode] = useState<"LIST" | "INVOICE" | "RECEIPT">("LIST");

  // Void modal state
  const [isVoidModalOpen, setIsVoidModalOpen] = useState(false);
  const [voidInvoiceTarget, setVoidInvoiceTarget] = useState<any | null>(null);
  const [voidReason, setVoidReason] = useState("");

  const loadInvoices = () => {
    startTransition(async () => {
      const res = await getInvoicesAction(clinicUid, {
        status: statusFilter !== "ALL" ? (statusFilter as InvoiceStatus) : undefined,
        search: searchQuery.trim() || undefined,
      });
      if (res.status) {
        setInvoices(res.data);
      }
    });
  };

  const handleOpenInvoiceDetail = (invoiceId: number) => {
    startTransition(async () => {
      const res = await getInvoiceDetailAction(invoiceId);
      if (res.status && res.data) {
        setSelectedInvoice(res.data);
        setViewMode("INVOICE");
      } else {
        toast.error(res.message);
      }
    });
  };

  const handleOpenReceiptDetail = (invoice: any) => {
    if (!invoice.Payments || invoice.Payments.length === 0) {
      toast.info("No official receipts recorded for this invoice.");
      return;
    }
    startTransition(async () => {
      const fullRes = await getInvoiceDetailAction(invoice.id);
      if (fullRes.status && fullRes.data && fullRes.data.Payments?.length > 0) {
        setSelectedReceipt({
          ...fullRes.data.Payments[0],
          Clinic: fullRes.data.Clinic,
          Invoice: fullRes.data,
          ClinicPatient: fullRes.data.ClinicPatient,
        });
        setViewMode("RECEIPT");
      }
    });
  };

  const handleConfirmVoid = () => {
    if (!voidInvoiceTarget) return;
    if (!voidReason.trim()) {
      toast.error("Please enter a reason for voiding this invoice.");
      return;
    }

    startTransition(async () => {
      const res = await voidInvoiceAction(voidInvoiceTarget.id, voidReason);
      if (res.status) {
        toast.success(`Invoice ${voidInvoiceTarget.invoiceNumber} has been voided.`);
        setIsVoidModalOpen(false);
        setVoidReason("");
        loadInvoices();
      } else {
        toast.error(res.message);
      }
    });
  };

  if (viewMode === "INVOICE" && selectedInvoice) {
    return (
      <div className="p-6">
        <SalesInvoicePrint invoice={selectedInvoice} onBack={() => setViewMode("LIST")} />
      </div>
    );
  }

  if (viewMode === "RECEIPT" && selectedReceipt) {
    return (
      <div className="p-6">
        <OfficialReceiptPrint receipt={selectedReceipt} onBack={() => setViewMode("LIST")} />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" size="sm" className="gap-1 px-2 -ml-2">
              <Link href={`/v2/clinic/${clinicUid}/billing`}>
                <ArrowLeft className="h-4 w-4" />
                POS
              </Link>
            </Button>
            <h1 className="text-2xl font-bold tracking-tight">Invoice Records & History</h1>
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">
            Audit trail of issued Sales Invoices, official receipts, and settlement statuses.
          </p>
        </div>

        <Button asChild size="sm" className="gap-1.5">
          <Link href={`/v2/clinic/${clinicUid}/billing`}>
            <FileText className="h-4 w-4" />
            Open Cashier POS
          </Link>
        </Button>
      </div>

      {/* Filters Bar */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search invoice number or patient name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && loadInvoices()}
                className="pl-9 h-9 text-xs"
              />
            </div>

            <Select
              value={statusFilter}
              onValueChange={(val) => {
                setStatusFilter(val);
                startTransition(async () => {
                  const res = await getInvoicesAction(clinicUid, {
                    status: val !== "ALL" ? (val as InvoiceStatus) : undefined,
                    search: searchQuery.trim() || undefined,
                  });
                  if (res.status) setInvoices(res.data);
                });
              }}
            >
              <SelectTrigger className="w-full sm:w-[180px] h-9 text-xs">
                <SelectValue placeholder="Status Filter" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Statuses</SelectItem>
                <SelectItem value="UNPAID">Unpaid</SelectItem>
                <SelectItem value="PARTIALLY_PAID">Partially Paid</SelectItem>
                <SelectItem value="PAID">Fully Paid</SelectItem>
                <SelectItem value="VOID">Void</SelectItem>
              </SelectContent>
            </Select>

            <Button size="sm" variant="outline" onClick={loadInvoices} disabled={isPending}>
              Search
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Invoices Table */}
      <Card>
        <CardContent className="p-0">
          <div className="border rounded-md overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="text-xs">
                  <TableHead className="w-[140px]">Invoice #</TableHead>
                  <TableHead>Patient Name</TableHead>
                  <TableHead>Date Issued</TableHead>
                  <TableHead className="text-center">Items</TableHead>
                  <TableHead className="text-right">Total Amount</TableHead>
                  <TableHead className="text-right">Balance Due</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-12 text-muted-foreground text-xs">
                      No invoices found matching criteria.
                    </TableCell>
                  </TableRow>
                ) : (
                  invoices.map((inv) => (
                    <TableRow key={inv.id} className="text-xs">
                      <TableCell className="font-mono font-bold">{inv.invoiceNumber}</TableCell>
                      <TableCell className="font-medium">
                        {inv.ClinicPatient?.User
                          ? `${inv.ClinicPatient.User.lastName}, ${inv.ClinicPatient.User.firstName}`
                          : "Walk-in Patient"}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {new Date(inv.issuedAt).toLocaleDateString("en-PH", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </TableCell>
                      <TableCell className="text-center font-mono">
                        {inv._count?.Items ?? 1}
                      </TableCell>
                      <TableCell className="text-right font-mono font-semibold">
                        ₱{Number(inv.totalAmount).toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        <span
                          className={
                            Number(inv.balanceDue) > 0 ? "text-amber-600 font-bold" : "text-slate-500"
                          }
                        >
                          ₱{Number(inv.balanceDue).toFixed(2)}
                        </span>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge
                          variant={
                            inv.status === "PAID"
                              ? "default"
                              : inv.status === "PARTIALLY_PAID"
                              ? "secondary"
                              : inv.status === "VOID"
                              ? "destructive"
                              : "outline"
                          }
                          className="text-[10px]"
                        >
                          {inv.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 px-2 text-xs gap-1"
                            onClick={() => handleOpenInvoiceDetail(inv.id)}
                          >
                            <Eye className="h-3 w-3" />
                            Invoice
                          </Button>
                          {inv.Payments?.length > 0 && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 px-2 text-xs gap-1 text-primary"
                              onClick={() => handleOpenReceiptDetail(inv)}
                            >
                              <Printer className="h-3 w-3" />
                              OR
                            </Button>
                          )}
                          {inv.status !== "VOID" && inv.status !== "CANCELLED" && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-destructive hover:bg-destructive/10"
                              title="Void Invoice"
                              onClick={() => {
                                setVoidInvoiceTarget(inv);
                                setIsVoidModalOpen(true);
                              }}
                            >
                              <Ban className="h-3.5 w-3.5" />
                            </Button>
                          )}
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

      {/* Void Invoice Confirmation Dialog */}
      <Dialog open={isVoidModalOpen} onOpenChange={setIsVoidModalOpen}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle className="text-destructive flex items-center gap-2">
              <Ban className="h-5 w-5" />
              Void Sales Invoice
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to void invoice{" "}
              <strong>{voidInvoiceTarget?.invoiceNumber}</strong>? This action is recorded in the
              audit log and cannot be undone.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2 py-2">
            <Label htmlFor="voidReason" className="text-xs font-semibold">
              Reason for Voiding (Required)
            </Label>
            <Input
              id="voidReason"
              placeholder="e.g. Wrong items billed / Patient cancelled"
              value={voidReason}
              onChange={(e) => setVoidReason(e.target.value)}
              className="text-xs"
            />
          </div>

          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setIsVoidModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleConfirmVoid}
              disabled={isPending}
            >
              {isPending ? "Voiding..." : "Confirm Void"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
