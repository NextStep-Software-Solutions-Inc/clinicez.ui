"use client";

import React, { useRef } from "react";
import { Printer, Download, ArrowLeft, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface SalesInvoicePrintProps {
  invoice: any;
  onBack?: () => void;
}

export function SalesInvoicePrint({ invoice, onBack }: SalesInvoicePrintProps) {
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    window.print();
  };

  const clinic = invoice.Clinic;
  const billingSetting = clinic?.ClinicBillingSetting;
  const patientUser = invoice.ClinicPatient?.Patient || invoice.ClinicPatient?.User;
  const items = invoice.Items || [];
  const payments = invoice.Payments || [];

  const patientFullName = patientUser
    ? `${patientUser.lastName}, ${patientUser.firstName} ${patientUser.middleName || ""}`.trim()
    : "Walk-in Patient";

  return (
    <div className="space-y-4 max-w-4xl mx-auto">
      {/* Action Bar (hidden when printing) */}
      <div className="flex items-center justify-between no-print bg-card p-3 rounded-lg border">
        <div className="flex items-center gap-2">
          {onBack && (
            <Button variant="ghost" size="sm" onClick={onBack} className="gap-1.5">
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
          )}
          <span className="font-semibold text-sm">Sales Invoice Preview</span>
          <Badge
            variant={
              invoice.status === "PAID"
                ? "default"
                : invoice.status === "PARTIALLY_PAID"
                ? "secondary"
                : "outline"
            }
          >
            {invoice.status}
          </Badge>
        </div>

        <Button onClick={handlePrint} className="gap-2">
          <Printer className="h-4 w-4" />
          Print / Save PDF
        </Button>
      </div>

      {/* Printable Invoice Page */}
      <div
        ref={printRef}
        className="bg-white text-slate-900 p-8 sm:p-12 rounded-lg border shadow-sm print:border-none print:shadow-none print:p-0 print:m-0"
        style={{ minHeight: "297mm", fontFamily: "'Inter', sans-serif" }}
      >
        {/* Clinic Header */}
        <div className="border-b pb-6 flex justify-between items-start">
          <div className="space-y-1 max-w-md">
            <h1 className="text-xl font-bold uppercase tracking-tight text-slate-900">
              {billingSetting?.registeredBusinessName || clinic?.name || "Medical Clinic"}
            </h1>
            <p className="text-xs text-slate-600">
              {billingSetting?.registeredAddress || "Healthcare Services"}
            </p>
            <div className="text-xs text-slate-600 pt-1">
              <span>TIN: {billingSetting?.tinNumber || "000-000-000-000"}</span>
              <span className="mx-2">•</span>
              <span>{billingSetting?.isVatRegistered ? "VAT-Registered" : "Non-VAT"}</span>
            </div>
            {billingSetting?.birPermitNumber && (
              <p className="text-[11px] text-slate-500">BIR Permit/CAS: {billingSetting.birPermitNumber}</p>
            )}
          </div>

          <div className="text-right space-y-1">
            <h2 className="text-xl font-black tracking-wider text-slate-800">SALES INVOICE</h2>
            <div className="font-mono text-sm font-bold text-primary text-slate-900">
              {invoice.invoiceNumber}
            </div>
            <p className="text-xs text-slate-600">
              Date: {new Date(invoice.issuedAt).toLocaleDateString("en-PH", {
                year: "numeric",
                month: "short",
                day: "numeric",
              })}
            </p>
          </div>
        </div>

        {/* Patient / Billed To Info */}
        <div className="grid grid-cols-2 gap-6 py-6 border-b text-xs">
          <div>
            <span className="font-semibold text-slate-500 uppercase tracking-wider block mb-1">
              Billed To (Customer):
            </span>
            <div className="font-bold text-sm text-slate-900">{patientFullName}</div>
            <p className="text-slate-600">Mobile: {patientUser?.mobile || "N/A"}</p>
            <p className="text-slate-600">Email: {patientUser?.email || "N/A"}</p>
          </div>

          <div className="text-right">
            <span className="font-semibold text-slate-500 uppercase tracking-wider block mb-1">
              Invoice Details:
            </span>
            <p className="text-slate-700">
              Discount Applied:{" "}
              <span className="font-semibold text-slate-900">{invoice.discountType}</span>
            </p>
            {invoice.discountIdNumber && (
              <p className="text-slate-700">
                SC / PWD ID No.:{" "}
                <span className="font-mono font-bold text-slate-900">{invoice.discountIdNumber}</span>
              </p>
            )}
            {invoice.hmoProviderName && (
              <p className="text-slate-700">
                HMO / Approval: {invoice.hmoProviderName} ({invoice.hmoApprovalCode})
              </p>
            )}
          </div>
        </div>

        {/* Itemized Line Items Table */}
        <div className="py-6">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b-2 border-slate-900 text-slate-700 font-bold uppercase tracking-wider">
                <th className="py-2 text-left">Description</th>
                <th className="py-2 text-center w-16">Qty</th>
                <th className="py-2 text-right w-24">Unit Price</th>
                <th className="py-2 text-center w-20">Tax</th>
                <th className="py-2 text-right w-28">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {items.map((item: any, idx: number) => (
                <tr key={idx} className="py-2">
                  <td className="py-2.5 text-slate-900 font-medium">
                    {item.description}
                    {item.Doctor && (
                      <span className="text-[10px] text-slate-500 block">
                        Attending: Dr. {item.Doctor.firstName} {item.Doctor.lastName}
                      </span>
                    )}
                  </td>
                  <td className="py-2.5 text-center text-slate-700">{item.quantity}</td>
                  <td className="py-2.5 text-right font-mono text-slate-700">
                    ₱{Number(item.unitPrice).toFixed(2)}
                  </td>
                  <td className="py-2.5 text-center text-[11px] text-slate-500">
                    {item.isVatable ? "12%" : "Exempt"}
                  </td>
                  <td className="py-2.5 text-right font-mono font-semibold text-slate-900">
                    ₱{Number(item.totalPrice).toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals & VAT Breakdown (Philippine BIR EOPT Act Compliant) */}
        <div className="border-t-2 border-slate-900 pt-4 flex justify-between items-start text-xs">
          {/* Left: VAT Breakdown */}
          <div className="w-1/2 pr-6 space-y-1.5 text-slate-600">
            <div className="font-bold text-slate-800 uppercase tracking-wider mb-2">
              Tax Summary Breakdown:
            </div>
            <div className="flex justify-between">
              <span>VATable Sales:</span>
              <span className="font-mono">₱{Number(invoice.vatableSales).toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>VAT-Exempt Sales (SC/PWD):</span>
              <span className="font-mono">₱{Number(invoice.vatExemptSales).toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>12% Value Added Tax:</span>
              <span className="font-mono">₱{Number(invoice.vatAmount).toFixed(2)}</span>
            </div>
          </div>

          {/* Right: Net Payable Amounts */}
          <div className="w-1/2 pl-6 space-y-1.5">
            <div className="flex justify-between text-slate-700">
              <span>Gross Subtotal:</span>
              <span className="font-mono">₱{Number(invoice.subtotal).toFixed(2)}</span>
            </div>

            {Number(invoice.discountAmount) > 0 && (
              <div className="flex justify-between text-emerald-700 font-medium">
                <span>Discount ({invoice.discountType}):</span>
                <span className="font-mono">-₱{Number(invoice.discountAmount).toFixed(2)}</span>
              </div>
            )}

            <div className="flex justify-between text-sm font-black border-t border-b border-slate-900 py-2 mt-2 text-slate-900">
              <span>TOTAL AMOUNT DUE:</span>
              <span className="font-mono">₱{Number(invoice.totalAmount).toFixed(2)}</span>
            </div>

            <div className="flex justify-between text-slate-700 pt-1">
              <span>Total Amount Paid:</span>
              <span className="font-mono text-emerald-700 font-semibold">
                ₱{Number(invoice.amountPaid).toFixed(2)}
              </span>
            </div>

            <div className="flex justify-between font-bold text-sm text-slate-900 pt-1">
              <span>BALANCE DUE:</span>
              <span className="font-mono">₱{Number(invoice.balanceDue).toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Payments Summary (if any) */}
        {payments.length > 0 && (
          <div className="mt-8 border-t pt-4 text-xs">
            <div className="font-bold text-slate-800 uppercase tracking-wider mb-2">
              Payment Receipts Issued:
            </div>
            <div className="space-y-1">
              {payments.map((p: any, idx: number) => (
                <div key={idx} className="flex justify-between text-slate-600 bg-slate-50 p-2 rounded">
                  <span>
                    Receipt <strong>{p.receiptNumber}</strong> • {p.paymentMethod}
                    {p.referenceNumber && ` (Ref: ${p.referenceNumber})`}
                  </span>
                  <span className="font-mono font-semibold text-slate-900">
                    ₱{Number(p.amount).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer Notice */}
        <div className="mt-12 text-center text-[10px] text-slate-500 border-t pt-4">
          <p className="italic">
            {billingSetting?.receiptFooterNotes ||
              "Thank you for choosing ClinicEZ. This document serves as your official Sales Invoice."}
          </p>
          <p className="mt-1">Generated electronically via ClinicEZ Practice Management System.</p>
        </div>
      </div>
    </div>
  );
}
