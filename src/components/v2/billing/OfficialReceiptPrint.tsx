"use client";

import React, { useRef } from "react";
import { Printer, ArrowLeft, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface OfficialReceiptPrintProps {
  receipt: any;
  onBack?: () => void;
}

export function OfficialReceiptPrint({ receipt, onBack }: OfficialReceiptPrintProps) {
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    window.print();
  };

  const clinic = receipt.Clinic;
  const billingSetting = clinic?.ClinicBillingSetting;
  const patientUser = receipt.ClinicPatient?.Patient || receipt.ClinicPatient?.User;
  const invoice = receipt.Invoice;
  const items = invoice?.Items || [];
  const cashier = receipt.Cashier;

  const patientFullName = patientUser
    ? `${patientUser.lastName}, ${patientUser.firstName}`
    : "Walk-in Patient";

  return (
    <div className="space-y-4 max-w-md mx-auto">
      {/* Top Action Bar */}
      <div className="flex items-center justify-between no-print bg-card p-3 rounded-lg border">
        {onBack && (
          <Button variant="ghost" size="sm" onClick={onBack} className="gap-1.5">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
        )}
        <Button onClick={handlePrint} size="sm" className="gap-1.5 ml-auto">
          <Printer className="h-4 w-4" />
          Print Receipt (80mm)
        </Button>
      </div>

      {/* 80mm POS Thermal Receipt Layout */}
      <div
        ref={printRef}
        className="bg-white text-black p-6 rounded border shadow-sm print:border-none print:shadow-none print:p-0 print:m-0 font-mono text-[11px] leading-tight"
        style={{ width: "80mm", margin: "0 auto" }}
      >
        {/* Clinic Header */}
        <div className="text-center space-y-1 pb-3 border-b border-dashed border-black">
          <div className="font-bold text-[13px] uppercase">
            {billingSetting?.registeredBusinessName || clinic?.name || "Medical Clinic"}
          </div>
          <div className="text-[10px]">{billingSetting?.registeredAddress || "Clinic Address"}</div>
          <div className="text-[10px]">TIN: {billingSetting?.tinNumber || "000-000-000-000"}</div>
          {billingSetting?.birPermitNumber && (
            <div className="text-[9px]">Permit: {billingSetting.birPermitNumber}</div>
          )}
          <div className="font-bold pt-2 text-[12px] tracking-wider">OFFICIAL RECEIPT</div>
          <div className="font-bold">{receipt.receiptNumber}</div>
        </div>

        {/* Transaction Meta */}
        <div className="py-2.5 border-b border-dashed border-black space-y-1">
          <div className="flex justify-between">
            <span>Date/Time:</span>
            <span>{new Date(receipt.paidAt).toLocaleString("en-PH", { dateStyle: "short", timeStyle: "short" })}</span>
          </div>
          <div className="flex justify-between">
            <span>Cashier:</span>
            <span>{cashier ? `${cashier.firstName} ${cashier.lastName}` : "Cashier"}</span>
          </div>
          <div className="flex justify-between">
            <span>Patient:</span>
            <span className="font-bold truncate max-w-[140px] text-right">{patientFullName}</span>
          </div>
          <div className="flex justify-between">
            <span>Ref Invoice:</span>
            <span>{invoice?.invoiceNumber || "N/A"}</span>
          </div>
        </div>

        {/* Brief Itemized Summary */}
        <div className="py-2.5 border-b border-dashed border-black space-y-1">
          <div className="font-bold uppercase text-[10px] pb-1">Items Paid:</div>
          {items.map((item: any, idx: number) => (
            <div key={idx} className="flex justify-between">
              <span className="truncate max-w-[160px]">
                {item.quantity}x {item.description}
              </span>
              <span>₱{Number(item.totalPrice).toFixed(2)}</span>
            </div>
          ))}
        </div>

        {/* Payment & Tender Details */}
        <div className="py-2.5 border-b border-dashed border-black space-y-1">
          <div className="flex justify-between">
            <span>Payment Method:</span>
            <span className="font-bold">{receipt.paymentMethod}</span>
          </div>
          {receipt.referenceNumber && (
            <div className="flex justify-between text-[10px]">
              <span>Tender Ref #:</span>
              <span className="font-bold">{receipt.referenceNumber}</span>
            </div>
          )}
          {Number(receipt.tenderedAmount) > 0 && (
            <div className="flex justify-between">
              <span>Cash Tendered:</span>
              <span>₱{Number(receipt.tenderedAmount).toFixed(2)}</span>
            </div>
          )}
          {Number(receipt.changeAmount) > 0 && (
            <div className="flex justify-between">
              <span>Change:</span>
              <span>₱{Number(receipt.changeAmount).toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between font-bold text-[13px] pt-1.5 border-t border-dotted border-black">
            <span>AMOUNT PAID:</span>
            <span>₱{Number(receipt.amount).toFixed(2)}</span>
          </div>
          {invoice && (
            <div className="flex justify-between text-[10px] pt-1">
              <span>Remaining Balance:</span>
              <span>₱{Number(invoice.balanceDue).toFixed(2)}</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="text-center pt-3 space-y-1 text-[9px]">
          <p>{billingSetting?.receiptFooterNotes || "Thank you for trusting ClinicEZ!"}</p>
          <p className="italic">This serves as an Official Collection Receipt.</p>
          <p className="text-[8px] text-gray-500 pt-1">Powered by ClinicEZ Healthcare</p>
        </div>
      </div>
    </div>
  );
}
