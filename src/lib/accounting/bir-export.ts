/**
 * BIR Statutory Books & General Ledger Export Formatter
 * Compliant with Philippine Bureau of Internal Revenue (BIR) Computerized Accounting System (CAS)
 * and Loose-Leaf record requirements.
 */

// Helper to escape CSV cell values
function escapeCsv(val: any): string {
  if (val === null || val === undefined) return "";
  const str = String(val).trim();
  if (str.includes(",") || str.includes('"') || str.includes("\n") || str.includes("\r")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export interface DateRange {
  start: string;
  end: string;
}

export interface ClinicMeta {
  businessName?: string;
  tin?: string;
  birPermit?: string;
  isVatRegistered?: boolean;
}

/**
 * Generates BIR Sales Book CSV
 */
export function generateBirSalesBookCsv(
  invoices: any[],
  meta: ClinicMeta,
  dateRange: DateRange
): string {
  const lines: string[] = [];

  // 1. Formal BIR Header
  lines.push(escapeCsv(meta.businessName || "CLINIC HEALTHCARE SERVICES"));
  lines.push(`TIN: ${escapeCsv(meta.tin || "000-000-000-000")} • ${meta.isVatRegistered ? "VAT-REGISTERED" : "NON-VAT"}`);
  if (meta.birPermit) lines.push(`BIR CAS / Permit No.: ${escapeCsv(meta.birPermit)}`);
  lines.push("BIR STATUTORY SALES BOOK (REVENUE JOURNAL)");
  lines.push(`For the Period: ${dateRange.start} to ${dateRange.end}`);
  lines.push(`Generated: ${new Date().toLocaleString("en-PH")}`);
  lines.push(""); // Empty line

  // 2. Table Column Headers
  const headers = [
    "Date",
    "Invoice No",
    "Customer / Patient Name",
    "TIN / Senior / PWD ID",
    "Discount Type",
    "Gross Sales",
    "VATable Sales",
    "VAT-Exempt Sales",
    "Zero-Rated Sales",
    "Output VAT (12%)",
    "Statutory Discount",
    "Net Invoice Amount",
    "Status",
  ];
  lines.push(headers.map(escapeCsv).join(","));

  // 3. Data Rows & Running Totals
  let totalGross = 0;
  let totalVatable = 0;
  let totalExempt = 0;
  let totalZeroRated = 0;
  let totalVat = 0;
  let totalDiscount = 0;
  let totalNet = 0;

  for (const inv of invoices) {
    if (inv.status === "VOID" || inv.status === "CANCELLED") continue;

    const patient = inv.ClinicPatient?.Patient || inv.ClinicPatient?.User;
    const patientName = patient
      ? `${patient.lastName}, ${patient.firstName} ${patient.middleName || ""}`.trim()
      : "Walk-in Patient";

    const gross = Number(inv.subtotalAmount || inv.totalAmount);
    const vatable = Number(inv.vatableSales || 0);
    const exempt = Number(inv.vatExemptSales || 0);
    const zeroRated = Number(inv.zeroRatedSales || 0);
    const vat = Number(inv.vatAmount || 0);
    const discount = Number(inv.discountAmount || 0);
    const net = Number(inv.totalAmount || 0);

    totalGross += gross;
    totalVatable += vatable;
    totalExempt += exempt;
    totalZeroRated += zeroRated;
    totalVat += vat;
    totalDiscount += discount;
    totalNet += net;

    const row = [
      new Date(inv.issuedAt).toISOString().split("T")[0],
      inv.invoiceNumber,
      patientName,
      inv.discountIdNumber || "N/A",
      inv.discountType || "NONE",
      gross.toFixed(2),
      vatable.toFixed(2),
      exempt.toFixed(2),
      zeroRated.toFixed(2),
      vat.toFixed(2),
      discount.toFixed(2),
      net.toFixed(2),
      inv.status,
    ];
    lines.push(row.map(escapeCsv).join(","));
  }

  // 4. Totals Row
  lines.push("");
  const totalsRow = [
    "TOTALS",
    "",
    `${invoices.filter((i) => i.status !== "VOID").length} Invoices`,
    "",
    "",
    totalGross.toFixed(2),
    totalVatable.toFixed(2),
    totalExempt.toFixed(2),
    totalZeroRated.toFixed(2),
    totalVat.toFixed(2),
    totalDiscount.toFixed(2),
    totalNet.toFixed(2),
    "",
  ];
  lines.push(totalsRow.map(escapeCsv).join(","));

  return lines.join("\r\n");
}

/**
 * Generates BIR Cash Receipts Book CSV
 */
export function generateBirCashReceiptsBookCsv(
  receipts: any[],
  meta: ClinicMeta,
  dateRange: DateRange
): string {
  const lines: string[] = [];

  // 1. Formal BIR Header
  lines.push(escapeCsv(meta.businessName || "CLINIC HEALTHCARE SERVICES"));
  lines.push(`TIN: ${escapeCsv(meta.tin || "000-000-000-000")} • ${meta.isVatRegistered ? "VAT-REGISTERED" : "NON-VAT"}`);
  if (meta.birPermit) lines.push(`BIR CAS / Permit No.: ${escapeCsv(meta.birPermit)}`);
  lines.push("BIR STATUTORY CASH RECEIPTS BOOK");
  lines.push(`For the Period: ${dateRange.start} to ${dateRange.end}`);
  lines.push(`Generated: ${new Date().toLocaleString("en-PH")}`);
  lines.push(""); // Empty line

  // 2. Table Column Headers
  const headers = [
    "Date",
    "OR / Receipt No",
    "Sales Invoice No",
    "Customer / Payor",
    "Tender Method",
    "Reference / Approval No",
    "Cash on Hand (Debit)",
    "E-Wallet / Maya / GCash (Debit)",
    "Credit / Debit Card (Debit)",
    "HMO / AR Settlement (Credit)",
    "Direct Sales Revenue (Credit)",
    "Total Collected",
  ];
  lines.push(headers.map(escapeCsv).join(","));

  // 3. Data Rows & Running Totals
  let totalCash = 0;
  let totalEWallet = 0;
  let totalCard = 0;
  let totalHmoCredit = 0;
  let totalSalesCredit = 0;
  let totalAll = 0;

  for (const r of receipts) {
    if (r.isVoided) continue;

    const patient = r.ClinicPatient?.Patient || r.ClinicPatient?.User;
    const patientName = patient
      ? `${patient.lastName}, ${patient.firstName}`.trim()
      : "Walk-in Patient";

    const amt = Number(r.amount);
    totalAll += amt;

    let cashDebit = 0;
    let eWalletDebit = 0;
    let cardDebit = 0;

    if (r.paymentMethod === "CASH") {
      cashDebit = amt;
      totalCash += amt;
    } else if (r.paymentMethod === "GCASH" || r.paymentMethod === "MAYA") {
      eWalletDebit = amt;
      totalEWallet += amt;
    } else if (r.paymentMethod === "CREDIT_CARD" || r.paymentMethod === "DEBIT_CARD") {
      cardDebit = amt;
      totalCard += amt;
    } else {
      eWalletDebit = amt;
      totalEWallet += amt;
    }

    // Credits
    let hmoCredit = 0;
    let salesCredit = 0;
    if (r.paymentMethod === "HMO_RECEIVABLE") {
      hmoCredit = amt;
      totalHmoCredit += amt;
    } else {
      salesCredit = amt;
      totalSalesCredit += amt;
    }

    const row = [
      new Date(r.paidAt).toISOString().split("T")[0],
      r.receiptNumber,
      r.Invoice?.invoiceNumber || "-",
      patientName,
      r.paymentMethod,
      r.referenceNumber || "N/A",
      cashDebit > 0 ? cashDebit.toFixed(2) : "-",
      eWalletDebit > 0 ? eWalletDebit.toFixed(2) : "-",
      cardDebit > 0 ? cardDebit.toFixed(2) : "-",
      hmoCredit > 0 ? hmoCredit.toFixed(2) : "-",
      salesCredit > 0 ? salesCredit.toFixed(2) : "-",
      amt.toFixed(2),
    ];
    lines.push(row.map(escapeCsv).join(","));
  }

  // 4. Totals Row
  lines.push("");
  const totalsRow = [
    "TOTALS",
    "",
    "",
    `${receipts.filter((r) => !r.isVoided).length} Receipts`,
    "",
    "",
    totalCash.toFixed(2),
    totalEWallet.toFixed(2),
    totalCard.toFixed(2),
    totalHmoCredit.toFixed(2),
    totalSalesCredit.toFixed(2),
    totalAll.toFixed(2),
  ];
  lines.push(totalsRow.map(escapeCsv).join(","));

  return lines.join("\r\n");
}

/**
 * Generates General Journal CSV for Xero, QuickBooks Online, or Generic accounting import
 */
export function generateGeneralJournalCsv(
  data: {
    invoices: any[];
    receipts: any[];
    vouchers: any[];
    coa: any;
  },
  format: "XERO" | "QUICKBOOKS" | "GENERIC",
  meta: ClinicMeta,
  dateRange: DateRange
): string {
  const lines: string[] = [];
  const coa = data.coa || {};

  // COA Codes with fallback defaults
  const codeCash = coa.cashAccountCode || "1010";
  const codeEWallet = coa.eWalletAccountCode || "1020";
  const codeCard = coa.bankAccountCode || "1030";
  const codeHmoAr = coa.hmoReceivableAccountCode || "1100";
  const codeConsultRev = coa.consultationRevenueCode || "4010";
  const codeLabRev = coa.labRevenueCode || "4020";
  const codeImagingRev = coa.imagingRevenueCode || "4030";
  const codeVatPayable = coa.vatPayableAccountCode || "2100";
  const codeDoctorPfPayable = coa.doctorPfPayableCode || "2200";
  const codeEwtPayable = coa.withholdingTaxCode || "2300";

  if (format === "XERO") {
    // Xero Manual Journal Format
    // Headers: *Narration,*Date,*Description,*AccountCode,*TaxType,*Gross
    lines.push(
      ["*Narration", "*Date", "*Description", "*AccountCode", "*TaxType", "*Gross"].map(escapeCsv).join(",")
    );

    // 1. Process Invoices (Sales & Output Tax)
    for (const inv of data.invoices) {
      if (inv.status === "VOID" || inv.status === "CANCELLED") continue;
      const invDate = new Date(inv.issuedAt).toISOString().split("T")[0];
      const narration = `Sales Invoice ${inv.invoiceNumber}`;

      // Receivable / Cash Debit
      lines.push(
        [
          narration,
          invDate,
          `Settlement / Receivable for ${inv.invoiceNumber}`,
          codeCash,
          "No Tax",
          Number(inv.totalAmount).toFixed(2),
        ]
          .map(escapeCsv)
          .join(",")
      );

      // Revenue Credits by Category
      for (const item of inv.Items || []) {
        let revCode = codeConsultRev;
        if (item.category === "LABORATORY") revCode = codeLabRev;
        else if (item.category === "IMAGING") revCode = codeImagingRev;

        const itemTotal = Number(item.totalPrice);
        const creditGross = -itemTotal;

        lines.push(
          [
            narration,
            invDate,
            item.description,
            revCode,
            item.isVatable ? "Output Tax (12%)" : "Tax Exempt",
            creditGross.toFixed(2),
          ]
            .map(escapeCsv)
            .join(",")
        );
      }
    }

    // 2. Process Doctor Payout Vouchers
    for (const v of data.vouchers) {
      if (v.status !== "PAID") continue;
      const vDate = new Date(v.paidAt || v.generatedAt).toISOString().split("T")[0];
      const narration = `Doctor PF Disbursement ${v.voucherNumber}`;

      // Debit PF Payable
      lines.push(
        [
          narration,
          vDate,
          `Gross PF - Dr. ${v.Doctor?.firstName} ${v.Doctor?.lastName}`,
          codeDoctorPfPayable,
          "No Tax",
          Number(v.grossPfAmount).toFixed(2),
        ]
          .map(escapeCsv)
          .join(",")
      );

      // Credit Withholding Tax (10%)
      if (Number(v.withholdingTaxAmount) > 0) {
        lines.push(
          [
            narration,
            vDate,
            `Expanded Withholding Tax (EWT 10%)`,
            codeEwtPayable,
            "No Tax",
            (-Number(v.withholdingTaxAmount)).toFixed(2),
          ]
            .map(escapeCsv)
            .join(",")
        );
      }

      // Credit Cash / Bank Disbursement
      lines.push(
        [
          narration,
          vDate,
          `Net Payout Ref: ${v.paymentReference || "EFT/Check"}`,
          codeCash,
          "No Tax",
          (-Number(v.netPayoutAmount)).toFixed(2),
        ]
          .map(escapeCsv)
          .join(",")
      );
    }
  } else if (format === "QUICKBOOKS") {
    // QuickBooks Online Journal Entry Format
    // Headers: *JournalNo,*JournalDate,*AccountName,*Debit,*Credit,*Description,*Name
    lines.push(
      ["*JournalNo", "*JournalDate", "*AccountName", "*Debit", "*Credit", "*Description", "*Name"]
        .map(escapeCsv)
        .join(",")
    );

    let journalIdx = 1;

    // Invoices
    for (const inv of data.invoices) {
      if (inv.status === "VOID" || inv.status === "CANCELLED") continue;
      const jNo = `JRNL-${inv.invoiceNumber}`;
      const jDate = new Date(inv.issuedAt).toISOString().split("T")[0];
      const patient = inv.ClinicPatient?.Patient || inv.ClinicPatient?.User;
      const pName = patient ? `${patient.lastName}, ${patient.firstName}` : "Patient";

      // Debit Cash / Clearing
      lines.push(
        [
          jNo,
          jDate,
          `${codeCash} Cash on Hand`,
          Number(inv.totalAmount).toFixed(2),
          "",
          `Billing ${inv.invoiceNumber}`,
          pName,
        ]
          .map(escapeCsv)
          .join(",")
      );

      // Credit Revenue
      const vatable = Number(inv.vatableSales || 0);
      const exempt = Number(inv.vatExemptSales || 0);
      const vat = Number(inv.vatAmount || 0);

      const netRev = vatable + exempt;
      lines.push(
        [
          jNo,
          jDate,
          `${codeConsultRev} Clinical Service Revenue`,
          "",
          netRev.toFixed(2),
          `Service Revenue ${inv.invoiceNumber}`,
          pName,
        ]
          .map(escapeCsv)
          .join(",")
      );

      if (vat > 0) {
        lines.push(
          [
            jNo,
            jDate,
            `${codeVatPayable} Output VAT Payable`,
            "",
            vat.toFixed(2),
            `12% VAT ${inv.invoiceNumber}`,
            pName,
          ]
            .map(escapeCsv)
            .join(",")
        );
      }
    }

    // Doctor Vouchers
    for (const v of data.vouchers) {
      if (v.status !== "PAID") continue;
      const jNo = `JRNL-${v.voucherNumber}`;
      const jDate = new Date(v.paidAt || v.generatedAt).toISOString().split("T")[0];
      const docName = `Dr. ${v.Doctor?.firstName} ${v.Doctor?.lastName}`;

      // Debit PF Expense / Payable
      lines.push(
        [
          jNo,
          jDate,
          `${codeDoctorPfPayable} Doctor PF Payable`,
          Number(v.grossPfAmount).toFixed(2),
          "",
          `Doctor PF ${v.voucherNumber}`,
          docName,
        ]
          .map(escapeCsv)
          .join(",")
      );

      // Credit EWT
      if (Number(v.withholdingTaxAmount) > 0) {
        lines.push(
          [
            jNo,
            jDate,
            `${codeEwtPayable} Withholding Tax Expanded`,
            "",
            Number(v.withholdingTaxAmount).toFixed(2),
            `EWT 10% Withheld`,
            docName,
          ]
            .map(escapeCsv)
            .join(",")
        );
      }

      // Credit Cash / Bank
      lines.push(
        [
          jNo,
          jDate,
          `${codeCash} Cash on Hand`,
          "",
          Number(v.netPayoutAmount).toFixed(2),
          `Disbursement Ref: ${v.paymentReference || "N/A"}`,
          docName,
        ]
          .map(escapeCsv)
          .join(",")
      );
    }
  } else {
    // Standard Generic Double-Entry General Journal
    lines.push(
      [
        "Entry Date",
        "Transaction Type",
        "Reference No",
        "Account Code",
        "Account Description",
        "Debit (PHP)",
        "Credit (PHP)",
        "Memo / Details",
      ]
        .map(escapeCsv)
        .join(",")
    );

    // Process Invoices
    for (const inv of data.invoices) {
      if (inv.status === "VOID" || inv.status === "CANCELLED") continue;
      const dt = new Date(inv.issuedAt).toISOString().split("T")[0];

      // Debit: Cash or HMO AR
      const isHmo = !!inv.hmoProviderName;
      lines.push(
        [
          dt,
          "INVOICE",
          inv.invoiceNumber,
          isHmo ? codeHmoAr : codeCash,
          isHmo ? "HMO Accounts Receivable" : "Cash / Clearing",
          Number(inv.totalAmount).toFixed(2),
          "0.00",
          `Patient Invoice ${inv.invoiceNumber}`,
        ]
          .map(escapeCsv)
          .join(",")
      );

      // Credit: Service Revenues
      const vatable = Number(inv.vatableSales || 0);
      const exempt = Number(inv.vatExemptSales || 0);
      const vat = Number(inv.vatAmount || 0);

      lines.push(
        [
          dt,
          "INVOICE",
          inv.invoiceNumber,
          codeConsultRev,
          "Practice Clinical Service Revenue",
          "0.00",
          (vatable + exempt).toFixed(2),
          `Gross Revenue for ${inv.invoiceNumber}`,
        ]
          .map(escapeCsv)
          .join(",")
      );

      if (vat > 0) {
        lines.push(
          [
            dt,
            "INVOICE",
            inv.invoiceNumber,
            codeVatPayable,
            "Output VAT (12%) Payable",
            "0.00",
            vat.toFixed(2),
            `Output VAT for ${inv.invoiceNumber}`,
          ]
            .map(escapeCsv)
            .join(",")
        );
      }
    }

    // Process Doctor Payouts
    for (const v of data.vouchers) {
      if (v.status !== "PAID") continue;
      const dt = new Date(v.paidAt || v.generatedAt).toISOString().split("T")[0];

      lines.push(
        [
          dt,
          "DOCTOR_PAYOUT",
          v.voucherNumber,
          codeDoctorPfPayable,
          "Doctor Professional Fees Payable",
          Number(v.grossPfAmount).toFixed(2),
          "0.00",
          `PF Liquidation Dr. ${v.Doctor?.firstName} ${v.Doctor?.lastName}`,
        ]
          .map(escapeCsv)
          .join(",")
      );

      if (Number(v.withholdingTaxAmount) > 0) {
        lines.push(
          [
            dt,
            "DOCTOR_PAYOUT",
            v.voucherNumber,
            codeEwtPayable,
            "Expanded Withholding Tax (EWT) Payable",
            "0.00",
            Number(v.withholdingTaxAmount).toFixed(2),
            `10% BIR Withheld Tax`,
          ]
            .map(escapeCsv)
            .join(",")
        );
      }

      lines.push(
        [
          dt,
          "DOCTOR_PAYOUT",
          v.voucherNumber,
          codeCash,
          "Cash / Bank Disbursement",
          "0.00",
          Number(v.netPayoutAmount).toFixed(2),
          `Disbursement Ref: ${v.paymentReference || "EFT"}`,
        ]
          .map(escapeCsv)
          .join(",")
      );
    }
  }

  return lines.join("\r\n");
}
