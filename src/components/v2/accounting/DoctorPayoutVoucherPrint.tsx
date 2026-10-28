"use client";

import React, { useRef } from "react";
import { Printer, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface DoctorPayoutVoucherPrintProps {
  voucher: any;
  onBack?: () => void;
}

export function DoctorPayoutVoucherPrint({ voucher, onBack }: DoctorPayoutVoucherPrintProps) {
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    window.print();
  };

  const clinic = voucher?.Clinic;
  const billingSetting = clinic?.ClinicBillingSetting;
  const doctor = voucher?.Doctor;
  const lineItems = voucher?.LineItems || [];

  const doctorFullName = doctor
    ? `Dr. ${doctor.firstName} ${doctor.lastName}`
    : "Attending Physician";

  const isPaid = voucher?.status === "PAID";

  return (
    <div className="space-y-4 max-w-4xl mx-auto">
      {/* Action Bar (hidden when printing) */}
      <div className="flex items-center justify-between no-print bg-card p-3 rounded-lg border shadow-sm">
        <div className="flex items-center gap-3">
          {onBack && (
            <Button variant="ghost" size="sm" onClick={onBack} className="gap-1.5">
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
          )}
          <span className="font-semibold text-sm">Disbursement Voucher Preview</span>
          <Badge
            variant={isPaid ? "default" : "secondary"}
            className={isPaid ? "bg-emerald-600 hover:bg-emerald-700" : ""}
          >
            {isPaid ? "PAID / SETTLED" : "UNPAID / PENDING"}
          </Badge>
        </div>

        <Button onClick={handlePrint} className="gap-2">
          <Printer className="h-4 w-4" />
          Print / Save PDF
        </Button>
      </div>

      {/* Printable Voucher Page */}
      <div
        ref={printRef}
        className="bg-white text-slate-900 p-8 sm:p-12 rounded-lg border shadow-sm print:border-none print:shadow-none print:p-0 print:m-0"
        style={{ minHeight: "297mm", fontFamily: "'Inter', sans-serif" }}
      >
        {/* Clinic Header */}
        <div className="border-b-2 border-slate-900 pb-6 flex justify-between items-start">
          <div className="space-y-1 max-w-md">
            <h1 className="text-xl font-bold uppercase tracking-tight text-slate-900">
              {billingSetting?.registeredBusinessName || clinic?.name || "Medical Clinic"}
            </h1>
            <p className="text-xs text-slate-600">
              {billingSetting?.registeredAddress || "Clinic Address"}
            </p>
            <div className="text-xs text-slate-600 pt-1">
              <span>TIN: {billingSetting?.tinNumber || "000-000-000-000"}</span>
              <span className="mx-2">•</span>
              <span>Healthcare Practice Management</span>
            </div>
            {billingSetting?.birPermitNumber && (
              <p className="text-[11px] text-slate-500">BIR Permit/CAS: {billingSetting.birPermitNumber}</p>
            )}
          </div>

          <div className="text-right space-y-1">
            <h2 className="text-xl font-black tracking-wider text-slate-800">
              DOCTOR PF VOUCHER
            </h2>
            <div className="font-mono text-sm font-bold text-slate-900">
              {voucher.voucherNumber}
            </div>
            <p className="text-xs text-slate-600">
              Issued:{" "}
              {new Date(voucher.generatedAt || voucher.createdAt).toLocaleDateString("en-PH", {
                year: "numeric",
                month: "short",
                day: "numeric",
              })}
            </p>
          </div>
        </div>

        {/* Doctor & Period Details */}
        <div className="grid grid-cols-2 gap-6 py-6 border-b text-xs">
          <div>
            <span className="font-semibold text-slate-500 uppercase tracking-wider block mb-1">
              Payee / Healthcare Professional:
            </span>
            <div className="font-bold text-base text-slate-900">{doctorFullName}</div>
            <p className="text-slate-600">Email: {doctor?.email || "N/A"}</p>
            <p className="text-slate-600">Mobile: {doctor?.mobile || "N/A"}</p>
          </div>

          <div className="text-right space-y-1">
            <span className="font-semibold text-slate-500 uppercase tracking-wider block mb-1">
              Settlement Particulars:
            </span>
            <p className="text-slate-700">
              Period Covered:{" "}
              <span className="font-medium text-slate-900">
                {new Date(voucher.periodStart).toLocaleDateString("en-PH", {
                  month: "short",
                  day: "numeric",
                })}{" "}
                -{" "}
                {new Date(voucher.periodEnd).toLocaleDateString("en-PH", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </span>
            </p>
            <p className="text-slate-700">
              Payment Status:{" "}
              <span className={`font-bold ${isPaid ? "text-emerald-600" : "text-amber-600"}`}>
                {voucher.status}
              </span>
            </p>
            {voucher.paidAt && (
              <p className="text-slate-700">
                Settled Date:{" "}
                <span className="font-medium text-slate-900">
                  {new Date(voucher.paidAt).toLocaleDateString("en-PH", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })}
                </span>
              </p>
            )}
            {voucher.paymentReference && (
              <p className="text-slate-700">
                Payment Ref:{" "}
                <span className="font-mono font-bold text-slate-900">
                  {voucher.paymentReference}
                </span>
              </p>
            )}
          </div>
        </div>

        {/* Itemized Line Items Table */}
        <div className="py-6">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
            Liquidated Encounters & Consultation Items
          </div>
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b-2 border-slate-900 text-slate-700 font-bold uppercase tracking-wider">
                <th className="py-2 text-left">Invoice / Date</th>
                <th className="py-2 text-left">Patient Name</th>
                <th className="py-2 text-left">Service Description</th>
                <th className="py-2 text-right w-28">Total Billed</th>
                <th className="py-2 text-right w-28">Doctor Share (PF)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {lineItems.map((item: any, idx: number) => {
                const inv = item.InvoiceItem?.Invoice;
                const patientUser = inv?.ClinicPatient?.Patient || inv?.ClinicPatient?.User;
                const patientName = patientUser
                  ? `${patientUser.lastName}, ${patientUser.firstName}`
                  : "Walk-in Patient";

                return (
                  <tr key={idx} className="py-2">
                    <td className="py-2.5 text-slate-900">
                      <div className="font-mono font-medium">{inv?.invoiceNumber || "N/A"}</div>
                      <div className="text-[10px] text-slate-500">
                        {inv?.issuedAt
                          ? new Date(inv.issuedAt).toLocaleDateString("en-PH", {
                              month: "short",
                              day: "numeric",
                            })
                          : "-"}
                      </div>
                    </td>
                    <td className="py-2.5 text-slate-900 font-medium">{patientName}</td>
                    <td className="py-2.5 text-slate-700">
                      {item.InvoiceItem?.description || "Professional Service"}
                    </td>
                    <td className="py-2.5 text-right font-mono text-slate-600">
                      ₱{Number(item.consultationFee).toFixed(2)}
                    </td>
                    <td className="py-2.5 text-right font-mono font-semibold text-slate-900">
                      ₱{Number(item.doctorShare).toFixed(2)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Financial Liquidation & Withholding Tax Summary */}
        <div className="border-t-2 border-slate-900 pt-6 flex justify-between items-start text-xs">
          {/* Left: Explanatory note */}
          <div className="w-1/2 pr-6 space-y-2 text-slate-600">
            <div className="font-bold text-slate-800 uppercase tracking-wider">
              Withholding Tax & Deductions Notice:
            </div>
            <p className="text-[11px] leading-relaxed">
              In compliance with Philippine Bureau of Internal Revenue (BIR) regulations, Expanded
              Withholding Tax (EWT) is withheld at source from professional fees disbursed to accredited
              physicians. BIR Form 2307 (Certificate of Creditable Tax Withheld At Source) will be
              provided for quarterly income tax filings.
            </p>
          </div>

          {/* Right: Calculations */}
          <div className="w-1/2 max-w-xs space-y-2 text-slate-700">
            <div className="flex justify-between py-1">
              <span>Gross Professional Fees:</span>
              <span className="font-mono font-bold text-slate-900">
                ₱{Number(voucher.grossPfAmount).toFixed(2)}
              </span>
            </div>

            {Number(voucher.facilityFeeDeduction) > 0 && (
              <div className="flex justify-between py-1 text-slate-600">
                <span>Less: Clinic Facility Deduction:</span>
                <span className="font-mono">
                  - ₱{Number(voucher.facilityFeeDeduction).toFixed(2)}
                </span>
              </div>
            )}

            <div className="flex justify-between py-1 text-slate-600">
              <span>Less: EWT ({Number(voucher.withholdingTaxRate).toFixed(1)}%):</span>
              <span className="font-mono text-red-600">
                - ₱{Number(voucher.withholdingTaxAmount).toFixed(2)}
              </span>
            </div>

            <div className="flex justify-between border-t-2 border-slate-900 pt-3 text-sm font-bold text-slate-900">
              <span className="uppercase">Net Disbursement:</span>
              <span className="font-mono text-base text-primary">
                ₱{Number(voucher.netPayoutAmount).toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        {/* Signatures & Formal Acknowledgement */}
        <div className="mt-16 pt-8 border-t grid grid-cols-2 gap-12 text-xs">
          <div>
            <div className="border-b border-slate-400 pb-8 text-center"></div>
            <div className="mt-2 text-center">
              <p className="font-bold text-slate-800">Prepared & Approved By</p>
              <p className="text-[11px] text-slate-500">Clinic Cashier / Accountant</p>
            </div>
          </div>

          <div>
            <div className="border-b border-slate-400 pb-8 text-center"></div>
            <div className="mt-2 text-center">
              <p className="font-bold text-slate-800">Received & Acknowledged By</p>
              <p className="text-[11px] text-slate-500">
                {doctorFullName} / Date: _______________
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-12 text-center text-[10px] text-slate-400 border-t pt-4">
          This document serves as an internal liquidation voucher and disbursement acknowledgment.
        </div>
      </div>
    </div>
  );
}
